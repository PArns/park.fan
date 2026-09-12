# shops — module report

Counters, queues, tills, stock and staffing demand — and the buildings they happen in.
Folder: `lib/game/shops/` (13 files, 6,170 lines, of which 567 are the selftest).

## What exists

| File                    | What it owns                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `sim.ts`                | A queue per shop, a till per counter, stock, deliveries, takings, refusals, staffing demand, and `find()` — the question `guests` asks. |
| `manifest.ts`           | Shop **styles** and **menus** as pack categories, the glyph library, and the resolver that turns a `shopSchema` entry into a building.  |
| `build.ts`              | One parametric generator, five massings, no `switch` on a content id. Pure arrays; no Babylon, so it runs under node.                   |
| `geometry.ts`           | `Surface` primitives and the 4×2 material atlas that makes a whole building one draw call. Babylon-free.                                |
| `shaders.ts`            | The eight procedural surfaces as pure functions, split out so the selftest can measure their tone spread in node.                       |
| `textures.ts`           | The atlas: albedo + normal + ORM from one height field, Sobel wrapped **inside** each tile.                                             |
| `materials.ts`          | Three materials for the whole park — the atlas, glazing, and one emissive per signage colour.                                           |
| `main.ts`               | Batching (a mesh trio per shop TYPE, thin-instanced), the night-light pool, the wiring.                                                 |
| `showcase.ts`           | `/game?showcase=shops` — every registered shop on one street.                                                                           |
| `selftest.mjs`          | 51 checks over extensibility, geometry, materials, the till and save → resume.                                                          |
| `types.ts` / `noise.ts` | The shared shapes; addressable hashing and tileable noise.                                                                              |

## The public API

```ts
// sim (worker) — ctx.module<ShopsSimApi>('shops')
find(need, x, z, cash?, limit?): ShopOffer[]   // ranked by WALK + WAIT in park minutes, not distance
offer(id): ShopOffer | null
join(id, guest, cash): ShopJoin | null          // null = refused; lastRefusal(id) says why
place(id, ticket): [x, z] | null                // where to stand; moves forward as the line does
collect(id, ticket): ShopSale | null            // the receipt, exactly once
leave(id, ticket): void
frontage(id): [x, z] | null
list(): ShopView[]                              // per shop: queue, wait, stock, takings, staffWanted
stats(): ShopsStats                             // plus `unanswered`: needs no open shop sells

// main (renderer) — ctx.module<ShopsMainApi>('shops')
styles(): ShopStyleDef[]                        // a build bar reads this, not a hard-coded list
meshes(): Mesh[]
frontage(id): [x, z] | null
stats(): ShopsMeshStats                         // batches, meshes, triangles + the sim's frame stats

// commands accepted: shops:price { id, price } · shops:close { id, closed }
// events emitted:    shop:sale { shop, cents, guest, source } · shop:restock { shop, units, cost }
```

## Numbers, measured

**Showcase**, twelve shops — one of every item both bundled packs declare — `medium` preset,
12:00, from `.game-render/shops-final/*/report.json` and a scene census in
`.game-render/final-census/probe.json`:

|                                              |                            |
| -------------------------------------------- | -------------------------: |
| Shop types drawn                             |                     **12** |
| Meshes for them (kit / sign / glass)         |       **25** (12 / 12 / 1) |
| Triangles, all twelve                        |                 **19,094** |
| Per shop: biggest / mean / smallest          |        2,470 / 1,591 / 434 |
| Atlas generation (8 tiles × 3 maps, 160²)    |                 **222 ms** |
| Geometry build, twelve buildings             |                **43.1 ms** |
| Whole frame, `ground` / `close` / `overview` | 149 / 139 / 176 draw calls |

**Demo park** with eight shops dispatched onto the reserved plots, 922 guests, 16:29, from
`.game-render/demo/counter/probe.json`:

|                                              |                                                 |
| -------------------------------------------- | ----------------------------------------------: |
| Shops placed                                 |                                           **8** |
| Batches / meshes                             |                                      **8 / 17** |
| Shop triangles                               |                                      **11,834** |
| Whole frame                                  |         **324 draw calls, 1,431,947 triangles** |
| This module's share of that frame            | **5.2 % of the calls, 0.83 % of the triangles** |
| This module's share of the 1,200 game budget |                                       **1.4 %** |

**One to three draw calls per shop TYPE, not per shop.** Every copy of a `pack:item` at one
footprint, signage colour and counter count is a matrix in the same meshes, so a park with eight
burger stands costs what a park with one costs. A realistic park runs five or six types and pays
**12–15 draw calls for all its retail**; the twelve-type showcase — the entire catalogue of two
packs at once — pays 25.

Triangles are the other half of that trade, deliberately. The atlas cannot WRAP (a repeat would walk
into the neighbouring tile), so `addQuad` subdivides and emits one tile per cell: a 4 × 2.6 m wall is
24 triangles rather than 2. At ~1,600 triangles a type and tens of shops in a park that is under
1 % of a 1.4 M-triangle demo-park frame, which is the right way round — draw calls are the scarce
resource in this game and triangles are not.

**Per-unit tone spread**, the number the paths critique measured at 2.9 % on that module's flagship
concrete and called "one colour with a grid drawn on it": pantile **10.2 %**, brick **11.4 %**,
paving **7.4 %**, painted boards **4.8 %** — the last one is the only surface below 6 % and it is the
only one that is a single tin of paint over seven boards rather than units fired in different
batches. Measured in node by `selftest.mjs` off the shaders themselves, averaging each unit over a
4 × 4 grid inside its middle half so the tone is isolated from the grain laid over it.

**Sim cost:** `stats().tickMs` reads **0.0007 ms** with eight shops indexed (its own measurement,
`.game-render/_probe/demand.mjs`), against the 6 ms whole-sim budget. `pnpm game:soak` is unchanged
at **mean 0.83 ms/tick** over 48 park-hours at 100×.

**The money reconciles.** In a node run of the demo park with these eight shops,
`shops.stats().takingsToday` finished at 6,000 cents and `world.finance.cash` finished 6,000 cents
above the demo park's starting 250,000,000 — to the cent, with `guests` doing the buying and this
module only recording it. The same held in the browser at 25,500.

## Two decisions worth arguing with

**1. A shop entity's position is where a GUEST STANDS, not where the building is.**
`guests` walks to `entity.position` and stops the moment it is within `REACH_RADIUS` (3.2 m), so
whatever point is stored is where the crowd forms. Store the building's centre there — the obvious
choice, and what a build tool's cursor suggests — and half the queue renders inside the wall. So the
building is laid out **backwards** from the entity position by `frontSetback(apron)` (1.2–1.5 m) and
the apron forwards, and a shop placed with nothing but a position and a yaw has its counter facing
whoever walked to it. What it costs: a build tool has to draw its ghost off-centre, and
`frontage()` and `entity.position` are the same point today in a way that may not survive a rotate
tool. The alternative — a `queuePoint` field on the entity — needs `guests` to read it, which is
request 3.

**2. This module records a sale it did not make.** `guests` in this tree does its own buying: walk
to the shop, 0.6–2.2 minutes in `BUYING`, take the manifest's `needRelief`, credit
`world.finance.cash`, emit `shop:sale`. Rather than build a till nothing calls, `sim.ts` subscribes
to that event and treats it as a customer already served — stock off, takings up, the counter's
busy-minutes window advanced — and explicitly does **not** move the money a second time. Against:
two paths into one till is a bug factory, and the bridge is blind three ways it cannot fix (a free
shop emits nothing, nobody ever queues, a stock-out cannot refuse a sale that already happened).
For: the alternative is a module whose interesting half is never exercised, which is exactly what
the guests report says about its own decision layer. Both halves are written out in
`docs/game/requests/shops.md` §3 with the call sites.

## Extensibility

`attachShopContent` claims **`shopStyles`** and **`shopMenus`**, walks `registry.packs()` **and**
subscribes to `onPack` — both, because `onPack` fires on registration and the bundled packs are
registered before any module is built, which is the trap `scenery`, `paths` and `terrain` each fell
into. A style is the whole recipe for a building (massing, roof, pitch, eaves, counters, counter
height, awning, menu board, doors, glazing, rail, apron, plinth, cladding, flue, dressing, seven
palette colours, fascia, pictogram, bracket, pylon) and `build.ts` switches on nothing but the fields
of the record it is handed.

`core-classic` and `neon-lagoon` name six generators (`kiosk-a`, `kiosk-round`, `toilet-block`,
`shop-b`, `atm`, `changing-block`) and say nothing about how they look, and those packs are not this
module's to edit — so the six built-ins live here, go through the same parser a pack's entry does,
and **a pack declaring a style of the same id wins**. A shop naming no known style falls back to a
form derived from its `kind`, warns once, and reports `styleFallback: true`. A style may also
`extends` another and override a few fields.

The selftest proves it rather than asserting it: a synthetic third pack ships `timber-barn` — a
style nothing in this repo anticipated — plus a menu and a shop naming both, and the checks are that
the style carries the pack's values, that the menu beats the `kind:` default, that the building
differs from the built-in it did not name in **both** triangle count and height (2,492 vs 2,112
triangles, 7.15 m vs 4.89 m), that it has glazing the kiosk has not, that its board is the pack's
menu rescaled to the shop's own price, and that a malformed entry is skipped without taking its
sibling down.

Two things are code, and are said out loud rather than hidden: a genuinely new **massing** (the five
`form` values) and a new atlas **surface**. A pack can combine those forms with any parameters,
recolour everything, price it, restock it, set its hours and ship its own pictogram as polylines —
but it cannot invent a geometry primitive from JSON. That is the same line `guests` draws between a
thought (manifest) and a signal (code).

## Determinism and state

One rng stream (`ctx.rng.fork('tills')`), used only to vary a service time by ±30 %. Four things
carry a fraction across a tick and all four are in `serialize()`: each till's remaining service, the
delivery timer, the busy-minutes window behind `utilisation`, and the rng state. The queue, the
un-collected receipts and the next ticket number are state too — a resumed save that re-issued
ticket 1 would hand two guests one receipt. The shop list is written in id order and the tick runs in
id order (ARCHITECTURE §1 rule 4).

**The field-by-field save → resume diff found a real bug that `pnpm test:game-save-roundtrip`
structurally cannot see** — its world has no shop entities, so this module's slot is `undefined` on
both sides of its comparison. `Rng.state()` returns the four words as JavaScript sees them and `^=`
leaves an int32 that may be negative, while `deserialize` normalised with `>>> 0`: same bits, same
generator, different string. An uninterrupted run wrote `-958509949` where the run resumed from its
own save wrote `3336457347`, the serialisations differed, and nothing was actually wrong.
`serialize()` canonicalises to unsigned now, and the check is `zero differing fields`.

## What was verified, and with which command

| Check                                                                     | Command                                                                                                  | Result                                                                                                                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                                                                 | `npx tsc --noEmit`                                                                                       | clean                                                                                                                                                               |
| Lint                                                                      | `npx eslint lib/game/shops`                                                                              | clean                                                                                                                                                               |
| Format                                                                    | `npx prettier --write "lib/game/shops/**"`                                                               | clean                                                                                                                                                               |
| Repo lint (`Math.random`, barrels, DOM at module scope, side-effect APIs) | `node scripts/test-game-lint.mjs`                                                                        | 159 files clean                                                                                                                                                     |
| Suite                                                                     | `pnpm test:game`                                                                                         | green; soak mean 0.83 ms/tick                                                                                                                                       |
| Module selftest                                                           | `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/shops/selftest.mjs` | **51 checks, exit 0**                                                                                                                                               |
| Teardown / GPU-context leak                                               | `node scripts/check-game-teardown.mjs`                                                                   | 3 dispose/reboot cycles, ≤1 live context, 0 console errors                                                                                                          |
| Console errors / hydration                                                | 4 × `scripts/game-shot.mjs --showcase=shops --cam=ground,close,overview`                                 | **err 0, hyd 0** in all four `report.json`, 12 shots                                                                                                                |
| Barrel import                                                             | `grep -rn "from '@babylonjs/core'" lib/game/shops/`                                                      | no hits                                                                                                                                                             |
| `window`/`document`/`navigator`                                           | `grep -rnE "\b(window\|document\|navigator)\s*\." lib/game/shops/`                                       | no hits anywhere, not just at module scope (two matches are the word "window" in prose)                                                                             |
| Coupling                                                                  | `grep -rn "from '\.\./" lib/game/shops/*.ts`                                                             | core (`types`, `rng`, `world`) + `../terrain` for two paint-layer constants in the showcase; `paths`, `terrain` and `environment` reached through `ctx.module<T>()` |
| Touched only its own folder                                               | `git status --porcelain`                                                                                 | 15 paths — `lib/game/shops/*`, this report, the requests file                                                                                                       |

**Two warnings appear in every `report.json` and are not this module's**:
`WebGL: INVALID_VALUE: bufferSubData: buffer overflow`, ×2. `node scripts/game-shot.mjs
--showcase=paths` produces the identical pair with the shops module not loaded at all.

**`scripts/game-shot.mjs` cannot take the `overview` camera with `--step`.** Four runs of four died
at `nextFrame()` with "Resulting promise was garbage collected" — the stepping starves the render
loop at 1–2 fps under SwiftShader — and the same command without `--step` succeeded first time. A
showcase loads core/terrain/environment/ui/camera plus the module and its deps, so it has no guests
and the simulation changes nothing about the picture; the showcase frames below were therefore taken
without it, and `--step=900` and `--step=5400` were used where it does matter, in the demo park,
through a per-shot probe.

## The frames, and what is actually in them

Every PNG named here was opened and looked at.

### The showcase, after the fixes (`.game-render/shops-final/`)

| File                     | What is in it                                                                                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1200/1200-ground.png`   | The street from a visitor's eye: a rendered octagonal pavilion with a shingled cone and a finial on the left, a timber kiosk with a pantile hip and a red-and-white awning behind it, a brick toilet block with a pylon sign on the right, six more receding. Every apron meets the promenade kerb. |
| `1200/1200-close.png`    | The plaza from ~40 m: the misting station on the pavers and the beach grill on its own apron. The kiosk's awning, counter, bin and planter all read; the plaza itself is a large empty pink field, which is the showcase's own composition and not the shops'.                                      |
| `1200/1200-overview.png` | From 340 m the whole street is about 230 × 90 px of a 1280 × 720 frame. The roofs hold their colour and nothing else reads. This camera is not a subject for a 220 m string of 3–8 m buildings.                                                                                                     |
| `2200/2200-close.png`    | **The best frame this module produces.** The beach grill under a magenta fascia with its awning lit from below and a real warm pool of light across the paving and the queue rail; the misting station under a teal one.                                                                            |
| `2200/2200-ground.png`   | The night street: lit fascias down both sides, a lit pylon, warm counter light under the near two awnings. The two nearest shops have a pool on the ground; the other ten have a lit sign over an unlit apron — that is `LIGHT_POOL.medium = 2`.                                                    |
| `1830/1830-ground.png`   | Dusk: the signage is at about a third and the buildings are in silhouette against a graded sky. The dark green cones and the pantile hips hold their shape.                                                                                                                                         |
| `0900/0900-ground.png`   | Low morning sun across the street; the eaves throw a hard line down each frontage and the awnings a second one.                                                                                                                                                                                     |

### The demo park, with eight shops on the reserved plots (`.game-render/demo/`, `demo-a/`, `demo-b/`)

| File                       | What is in it                                                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo/counter/counter.png` | A burger kiosk at 6 m in dappled tree shadow at 16:29: pantile hip with ridge cap, timber boards, the fork-and-knife pictogram on a cream fascia, a chalk menu board, a striped awning, a queue rail, paver apron, the park's own box hedge behind it. **Nobody at the counter.** |
| `demo/street/street.png`   | The promenade with a crowd of guests walking past that kiosk. They walk down the middle; not one of them turns in.                                                                                                                                                                |
| `demo/ground/ground.png`   | The `ground` preset at 16:29: the main street with ~40 visible guests, a round pavilion on the west verge and the brick toilet block on the east, both under the lime avenue. The shops read as part of the park rather than as objects dropped on it.                            |
| `demo-a/counter.png`       | The same kiosk before the frontage was restacked — the awning started in the middle of the fascia band. Kept as the before.                                                                                                                                                       |

### Frames that were wrong, and what they cost

Six rounds, and each of these was found by looking rather than by reading:

- `shops-1/0900-ground.png` — the showcase painted 20 m of concrete either side of the walk "so the
  shops do not stand on a lawn", and the frame came back as a forty-metre car park with six huts on
  it. The paint band is 6 m now and each shop lays its own apron.
- `shops-1/1200-close.png` and `shops-detail2/street.png` — the round pavilion's fascia was an
  axis-aligned quad spanning ±0.82 r across an octagon, so it stuck a metre out past the drum on
  both sides, and the menu board floated half off the wall. Every fitting takes a `Facet` now.
- `shops-detail/round-lemonade.png` — the aprons stopped four metres short of the promenade and sat
  in the grass like helipads. The showcase offset went 10.5 → 8.6 → **7.4**, measured each time.
- `shops-fix/kiosk-straight.png` — five of the twelve shops declare no `night.signage`, and the
  fascia was using the **surround** colour for the lit panel, so they rendered as black bars.
  `palette.signLit` is a separate colour now.
- `demo-a/counter.png` — at a 2.65 m wall the awning and the sign band overlapped and the awning's
  front edge came down to 1.7 m, under head height. `kiosk-a` is 3.15 m and the three are stacked off
  each other rather than off three independent numbers.
- `shops-3/2200-ground.png` — at a peak emissive of 1.35 against the pipeline's 0.9 bloom threshold,
  the cream fascias were featureless white bars with a halo. Peak 1.0, and the counter pool went
  22 → 45 cd because a lit sign over an unlit apron is the exact criticism the scenery critique
  makes of that module's lamps.

## What is weak or missing, ranked

1. **Nobody queues, and the reason is not in this module.** `guests`'s needs do not rise at any
   speed a player can select: `d.needs` is a `Uint8Array` and `stepNeeds` writes back through
   `Math.round`, so a per-tick rise of 0.0217 (hunger at speed 1), 0.065 (speed 3) or 0.108
   (speed 5) is rounded away and the level never moves. Measured over 300 park minutes per speed:
   mean hunger **25 / 24 / 24** against `urgentAt: 170`; at 100× it reaches 100. With every need
   frozen near 24, `decide()` scores every candidate under its own `FLOOR` and **934 of 944 guests
   stand `idle` with `dest: null`**. The only trade that ever happens is the burst after a clock
   jump, when `resettle()` re-seeds needs — which is exactly what the browser frames caught, €255
   through the tills right after the 09:00 → 12:00 jump and not one cent in the next three park
   hours. Full write-up, table and repro in `docs/game/requests/shops.md` §2. Until it is fixed, the
   queue, the balking, `place()` and `waitMinutes` are exercised only by the selftest, and no frame
   this module can take will show a line at a counter.
2. **The night light pool is two.** `LIGHT_POOL.medium = 2` (3 at `high`, 4 at `ultra`, 0 at `low`),
   so in the 22:00 street frame two of twelve shops have a pool of light on their apron and ten have
   a lit sign over dark paving. That is the same finding the scenery critique made about that
   module's 72 lamps and 2 lights, and it has the same answer — either a shared pool across modules
   or baked light decals — and neither is in this module alone.
3. **The `overview` camera gets nothing.** 230 × 90 px of a 1280 × 720 frame, and no shop is legible.
   Partly the showcase's fault for stringing twelve buildings along 220 m instead of clustering them,
   and partly real: a 3 m kiosk at 340 m is four pixels. There is no LOD — a shop is one build at one
   detail level. With tens of shops in a park that is defensible on triangles (11,834 for eight) and
   it is untested at a hundred.
4. **The demo park still has no shops in it.** The eight in every demo frame above were dispatched
   from a probe. `demo-park` reserves four plots and places nothing on them, so opening `/game`
   today shows a park with no retail at all. Request 4 has the coordinates and the yaws.
5. **`refusedToday.price` is structurally always zero**, and a free shop's counter always reads idle.
   Both follow from the bridge: `guests.serve()` refuses a guest who cannot pay without a word, and
   emits nothing at all when `price === 0`, which is first aid, the cash machine and information.
6. **Two hard-coded constants duplicate other modules' numbers**: the opening hours (09:00–23:00,
   which is `guests`'s `PARK_OPEN`/`PARK_CLOSE`) and `WALK_PACE = 1.25` m per park minute, which is
   the middle of the archetype speeds. Neither can be imported without pulling the guest simulation
   into a worker bundle that has no guests in it; both are requests (§5), and `WALK_PACE` is used
   only for ranking, so an error there reorders two shops that were nearly equal.
7. **No critic has graded this.** Every number above is my own measurement with the same harness a
   critic uses, which is not a grade.
8. **`shopStyles` is exercised by one synthetic pack, not by a shipped one.** Neither bundled pack
   declares a style, because neither is this module's to edit — so the extensibility path that a
   critic can see running is the selftest's, and the six built-ins are the path everything else
   takes. A `shopStyles` block in `neon-lagoon` would make it visible in a screenshot.
9. **The queue geometry is drawn from `standAt()` and nothing has ever stood on it.** The switchback
   is right on paper — 1.9 m channel, 0.85 m pitch, serpentine rows — and completely unverified
   against a crowd, which is the same class of gap as (1).
