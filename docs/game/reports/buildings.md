# buildings — builder report

`lib/game/buildings/` · showcase `/game?showcase=buildings` · 16 TypeScript files, plus a self-test
of 66,000 checks. Entity kind `building`. Nothing outside the folder was touched except this file and
`docs/game/requests/buildings.md`.

**Round 1: 7.5, FAIL** (`docs/game/critiques/buildings-round1.md`). No hard gate failed; the frame
axis at 6.5 carried it down. This report has been corrected against that critique rather than
defended: §4.1 and §4.2 below recorded two bugs as **fixed that were not**, and §3 stated a
draw-call share measured at night and spent in daylight. Both corrections are in place, marked, and
the numbers behind them are re-measured. Round 2 found three more of its own that the critique does
not contain: the night work of the last round turned out to have been tuned against a constant
(§4.10), and `pnpm test:game` was red for everybody the day the demo park got its first two
buildings (§4.11).

---

## 0. Round 2 — what changed and what it is worth

| #   | Finding                                                                               | State | Evidence                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 83 arch heads were back-faces                                                         | fixed | `fanTriangles` walked its ring clockwise; **0 of 63,513** triangles now disagree with their normal                                                                                                               |
| 2   | 233.6 m² of gable and mansard end wall faced inwards                                  | fixed | `addTriangle` takes a `facing` now; **0 m²** of any mass envelope faces into its building                                                                                                                        |
| 3   | A night facade is lit windows on a black wall, and the one lamp clips                 | fixed | the lantern was still clipping brick to **254.1** over **0.673 %** of the 23:00 street after the first attempt at this; at intensity 7 it is **250.2** and **0.000 %**, with the courses legible inside the pool |
| 3b  | The spill decal was drawing at noon and through roofs                                 | fixed | two shader bugs found in the 09:00 frame, §4.10; scene-pixel difference with the ring disabled is now **0 px at 09:00**, and it lifts **30,906 px** of the 23:00 street                                          |
| 4   | The roofs are black holes                                                             | fixed | sunlit slate was **20.8** against sunlit brick **89.4**; it is **84–95** against **65–87** now, measured off `r2-final/0900-ground.png`                                                                          |
| 5   | The lantern and the downpipe are placeholder geometry                                 | fixed | a bracket-cage-cap lantern (22 quads) and an 80 mm pipe with a hopper, two clips and a shoe                                                                                                                      |
| 6   | A clock tower with one clock                                                          | fixed | a dial on every elevation of a mass whose plan is squarer than 1.6 : 1                                                                                                                                           |
| 7   | The reported budget share was the night one                                           | fixed | §3 now states **120 draw calls / 10.0 %** at 09:00, A/B'd here, and says what it measures                                                                                                                        |
| 8   | `dispose()` never reset the content registry                                          | fixed | `resetBuildingContent()` and `resetBuildWarnings()` on dispose                                                                                                                                                   |
| 9   | Four dead manifest fields and a silently dropped sign                                 | fixed | `sign.side`, `night.spill`, `style.wallUpper` + `palette.wallUpper` all read; the sign warns by name                                                                                                             |
| 10  | A 17.7 m three-storey terrace house                                                   | fixed | 2.95 m storeys and a lighter eaves band: ridge ~14 m, 16.3 m over the chimneys                                                                                                                                   |
| 11  | Kit pieces are ten slabs on a lawn                                                    | open  | §5.9 — still a display row, not a merchant's yard                                                                                                                                                                |
| 12  | The spill's dusk curve was wired to a value the shader ignores                        | fixed | `StandardMaterial` ADDS its emissive texture to `emissiveColor` instead of multiplying, so the ring drew the glow tile at full strength at every hour; the texture is gone and the colour is the fade (§4.10)    |
| 13  | The spill was drawn over whatever stood in front of it                                | fixed | `renderingGroupId = 1` clears the depth buffer; the ring is back in group 0, where alpha meshes already sort after opaque ones (§4.10)                                                                           |
| 14  | `pnpm test:game` went red on `{"building":2}` the day the demo park got its buildings | fixed | a kind gets its owner in the **sim** runtime and this module had none; there is one now, and it earns its keep (§4.11)                                                                                           |

**The two that failed the module were the same class of bug, and the check I wrote after round 1's
own winding bug could not see either of them.** §4.1 measured _roof planes_, because `roofs.ts` says
in a comment that a gable end is "wall, not roof" — so the check exempted the surface that was about
to break. There are now two checks with no categories in them at all (§3, "winding"): every triangle
against its own normal, and every triangle on a mass's envelope against the solid it stands on. They
reproduce the critic's numbers to within a square metre and both read zero.

**Rows 12, 13 and 14 are round 2's own and none is in the critique.** The first two are in the very
frame the critique asked for: the 09:00 crop taken to prove the gable end was solid also carries a
row of orange window-shaped outlines lying on the clock tower's slate, and the teal of a pavilion
two buildings back showing through the roof. Both are the night spill drawn in daylight and drawn
out of order, both are one line, and neither can be found by reading `buildings/` — one is a Babylon
shader `#ifdef`, the other a default in `RenderingManager` (§4.10). The third came out of a red
`pnpm test:game`, and the sim it produced then had a bug of its own that only the harness's warning
count showed (§4.11).

---

## 1. What exists

A building is a **style** (what it is made of and what colour it is painted) and a **blueprint** (a
list of masses, each with storeys, a bay pattern per elevation, a roof, trim and ground works), and
both are manifest entries. The kit — walls, reveals, sashes, sills, cornices, quoins, arches, doors,
shopfronts, louvres, oculi, pilasters, arcades, dormers, chimneys, lanterns, clock faces, downpipes,
sign bands, aprons, kerbs and steps — is code, and it is the primitives rather than the content: a
pack combines eleven bay codes and eight roof forms at any size, count, material and colour and never
needs TypeScript.

**The module's own catalogue is a pack** (`pack.ts`, registered from `main()` at boot step 5, before
the worker starts at step 7 so both threads resolve the same ids). That is not tidiness — it is the
extensibility claim made structurally: the seven buildings the game ships with come through exactly
the door a third party's would, and deleting that file leaves a module that still draws every
building any other pack declares.

### The files

| File           | What is in it                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `index.ts`     | The `GameModule`. Worker-safe: Babylon only through `await import('./main')`.                   |
| `types.ts`     | The vocabulary — every field a manifest may set.                                                |
| `bays.ts`      | The facade pattern language and nothing else. Pure, and the part a test can hold to an integer. |
| `noise.ts`     | Addressable hashing and tileable value noise. No stream: a shader is asked in any order.        |
| `geometry.ts`  | `Surface`, the 4 × 4 atlas, the winding rule, and the `Frame` every kit piece is placed on.     |
| `shaders.ts`   | Sixteen procedural PBR surfaces as pure functions. Node-runnable, so their spread is measured.  |
| `textures.ts`  | The atlas: albedo, tangent normal (Sobel per tile) and ORM, generated together from one height. |
| `kit.ts`       | The pieces a facade is bashed from — every opening, band, quoin, lantern, clock and sign.       |
| `roofs.ts`     | Eight roof forms plus eaves, soffits, gutters, ridges, dormers, chimneys and cupolas.           |
| `build.ts`     | Blueprint → three vertex buffers. Masses, facades, arcades, ground works, and the kit pieces.   |
| `manifest.ts`  | The two pack categories, the zod schemas, style derivation from a pack's own materials.         |
| `materials.ts` | Four PBR materials for every building in the park, plus one emissive per colour and kind.       |
| `pack.ts`      | This module's content, as a pack: 5 styles, 7 blueprints, 10 palette entries.                   |
| `main.ts`      | The renderer: lazy atlas, batches, thin instances, the night pool, the public API.              |
| `showcase.ts`  | A street of ten buildings, the ten loose kit pieces, and a runtime-registered content pack.     |
| `sim.ts`       | Footprints and doors on the worker, derived from the blueprint. Empty tick — §4.11.             |
| `selftest.mjs` | 66,000 checks in ~2 s, no browser.                                                              |

### The content vocabulary

Two pack keys, claimed through `registerPackCategory(…, 'buildings')`, plus the core `buildings` key
that `pack-schema.ts` already had:

- **`buildingStyles`** — `wall` / `plinth` / `roof` name one of sixteen atlas surfaces (`brick`,
  `render`, `ashlar`, `timber`, `slate`, `pantile`, `zinc`, `shingle`, `panel`, `concrete`, `paving`,
  `metal`, `rubble`, `canvas`, `copper`); a ten-colour `palette`; a `trim` block (cornice height and
  projection, string course, quoins on or off, how deep an opening sits into the wall, how far a sill
  oversails); and `glazing` (panes across and up).
- **`buildingBlueprints`** — `masses[]`, each with `at`, `size`, `yaw`, `storeys`, `storeyHeight`,
  `base`, `plinth`, `bay`, `facades`, `roof`, `trim`, `arcade`, `round`, per-mass colour and material
  overrides and a `clock` diameter; plus `ground` (apron, kerb, steps), `night` (lit fraction,
  lanterns) and `sign`.
- **`buildings`** (core's own) — the palette entry: `category` (`blueprint` or one of the seven kit
  categories), `size`, `cost`, `procedural` (which blueprint or which generator), `material`,
  `theme`, and the pack's `icons` map.

**The facade pattern language** is the part worth reading twice. One character per bay:

```
"w d w"        three bays: window, door, window — exactly three, whatever the wall is
"w* D w*"      a grand door in the middle, and as many windows either side as the wall affords
"a*"           an arcade of round-headed arches, as many as fit
"w d w / w*"   the ground floor, then every storey above it (the last pattern repeats upward)
```

`s` solid · `w` window · `t` tall window · `a` arched · `o` oculus · `d` door · `D` grand door ·
`g` glazed shopfront · `v` louvred vent · `n` blind niche · `p` pilaster. `*` marks a flexible group:
the bay count comes from the wall's width over the style's bay module and the flexible groups absorb
the remainder, outer groups first, so an odd bay widens the ends of an elevation instead of shoving
its middle sideways. That is what lets one blueprint sit on a 14 m frontage and a 34 m one and be a
building both times.

Five styles, seven blueprints and ten palette entries ship built in, written as the JSON a pack would
carry and run through the same `readPack` a pack goes through. A pack that declares a style or a
blueprint of the same id replaces it.

### Public API

`ctx.module<BuildingsMainApi>('buildings')` (from `@/lib/game/buildings/main`):

```ts
styles(): BuildingStyleDef[];        blueprints(): BlueprintDef[];
catalogue(): ResolvedBuilding[];     // every placeable item every registered pack declares
meshes(): Mesh[];                    stats(): BuildingsMeshStats;
entrance(id: string): [number, number] | null;   // where a guest walks to, WORLD space
```

Pure exports from `@/lib/game/buildings` (worker-safe, Babylon-free): `planBays`, `parsePattern`,
`patternForStorey`, `isBayCode`, `attachBuildingContent`, `resolveBuilding`, `buildingItems`,
`buildingStyles`, `buildingBlueprints`, `surfaceFromMaterial`, `DEFAULT_STYLE`, `buildBuilding`,
`buildKitPiece`, `seedForBuilding`, `PIECES`, `ARCHITECTURE_PACK`, and the whole type vocabulary.

### Owned state, commands, events

- Entity kind **`building`**; `entity.data` is `BuildingEntityData` — `style`, `blueprint`,
  `variant`, all optional. A building placed with nothing but a position behaves exactly like one a
  build tool filled in.
- **No `world.modules.buildings` slot, no commands, no events, and a sim whose tick is empty.** A
  building is a fact about the world, not a process: it has no state that changes with the clock and
  nothing to serialise beyond the entity core already owns, so `sim.ts` writes no save slot and
  derives its whole index from `world.entities`. What it is there for is §4.11.
- `ctx.module<BuildingsSimApi>('buildings')` on the **worker** side answers `at(x, z)`,
  `entrance(id)`, `nearestEntrance(x, z, radius)`, `get(id)`, `all()` and `count()` — a footprint
  and a door, without a mesh.

---

## 2. The Buildings tab

The integrator asked what the build bar actually offers now that `kind: 'building'` is claimed.
Checked by opening it in the demo park and reading the DOM, not by reading `palette.ts`:
`.game-render/probe-palette/buildings-tab.png`.

**Twenty items, all enabled, all localized, in four rows.** Ten are the kit pieces the two bundled
packs already declared and that nothing had ever drawn — Brick wall €24, Plaster wall €20, Arched
window €32, Double door €36, Slate roof €30, Timber floor €12, Stone column €15, Concrete wall €22,
Flat roof €26, Panorama window €42. Ten come from this module's pack — Ticket hall €42,000, Grand
pavilion €96,000, Clock tower hall €54,000, Market hall €61,000, Rotunda €33,000, Terrace house
€21,000, Guest services €26,000, Glass canopy €9,000, Arched wall €3,200, Oculus wall €3,400.

So the blueprints **are** reachable through `buildingSchema`, and no request to `tools` is needed.
The mechanism: a blueprint is a `buildings[]` entry with `category: 'blueprint'` whose `procedural`
names the `buildingBlueprints` record, so `palette.ts` sees an ordinary schema entry and takes the
footprint from `def.size[0]`/`def.size[2]` and the ghost height from `def.size[1]`. That makes those
three numbers a promise about geometry that nothing in core checks — this module checks its own
(§3, "declared size") and `requests/buildings.md` §6 records that a pack written by anybody else can
still lie.

---

## 3. What I verified

`node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=buildings --cam=overview,close,ground --tod=09:00,18:30,23:00`
and the same without `--showcase` for the demo park, 1280 × 720, WebGL2 through SwiftShader,
`medium` preset. Every PNG below was opened and looked at. Round 2's set is in
`.game-render/r2-final/` (the nine showcase frames), `.game-render/r2-measure/` (the A/B pairs),
`.game-render/r2-park/` (the demo park) and `.game-render/r2-warn/` (one frame taken after §4.11);
the paths in the first column below without a `r2-` prefix are round 1's and still describe what
they show.

One vintage note, because it decides what a night frame is worth. The **lantern** dropped from
intensity 21 to 7 after `r2-final/` was taken, and `r2-measure/2300-ground-halo-on.png` is the
first frame of the shipped number. It makes no difference to the nine: the light pool re-picks on a
0.45 s clock and needs several seconds to settle, which is longer than `game-shot.mjs` waits, so
**no harness frame in this report has a pooled lantern lit in it at all.** Everything said about
that light was measured in a probe that waits for it, and it is the reason the round-1 finding was
recorded as fixed twice before it was (§4.10).

### The frames

| File                                       | What is actually in it                                                                                                                                                                                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `r2-final/0900-overview.png`               | The street from 132 m: three brick terrace houses with mansards and chimneys, the ticket hall's arcaded front, the clock tower, the grand pavilion closing the vista, the rotunda's terracotta cone, the market hall's dark barrel vault, the teal guest-services pavilion.       |
| `r2-final/0900-ground.png`                 | Eye level on the street. Brick with real courses, sashes with glazing bars, sills, string courses, quoins, wall lanterns, the pavilion's cupola at the end of the vista. Windows read as glazed rather than as holes.                                                             |
| `r2-final/0900-close.png`                  | The clock tower block at 44 m: two storeys of brick under a 46° slate roof with three dormers and two chimneys, the tower with its pyramid roof and lantern, the rotunda behind it.                                                                                               |
| `r2-final/1830-close.png`                  | Dusk on the clock tower block. The lights are coming on: warm panes at three or four brightnesses, three dormers lit, the lit clock face, the tower lantern, the rotunda's cupola glowing at the left edge, the sky still holding its last red. The best frame in the set.        |
| `r2-final/2300-close.png`                  | Night on the clock tower. Individual panes at individual brightnesses with the glazing bars still legible, dormers lit, the tower lantern glowing, the guest-services sign teal in the distance.                                                                                  |
| `r2-final/2300-overview.png`               | The whole street at night — lit windows scattered across the terrace, four glowing cupolas, one teal sign. Reads as a place with people in it, from 132 m.                                                                                                                        |
| `buildings-exhibit/1200-inn.png`           | **The extensibility exhibit.** The showcase pack's inn: a jettied first floor oversailing the ground floor with its shadow under it, a wing swung 35° off the block, an oculus in the gable, pantiles, two chimneys. Three masses of JSON, nothing in `lib/game/buildings` knows. |
| `buildings-detail5/1200-rot.png`           | The rotunda: an octagonal drum with an arch on every facet, a conical terracotta roof, a glazed lantern with a finial.                                                                                                                                                            |
| `buildings-detail5/1200-market.png`        | The market hall's barrel vault, after §4.1 — the frame that proves the roof is there.                                                                                                                                                                                             |
| `probe2/0900-facade.png`                   | Two metres from a terrace house in shade: bricks, mortar joints, quoin blocks, a string course, sill, lintel, sash, glazing bars. The only frame in which any of those is more than a pixel.                                                                                      |
| `probe-palette/buildings-tab.png`          | The build bar's Buildings tab with all twenty items (§2).                                                                                                                                                                                                                         |
| `r2-measure/0900-close-halo-{on,off}.png`  | The A/B that proves the spill ring contributes **nothing** in daylight after §4.10: the two frames differ in 32 pixels, all of them the animated clock in the HUD.                                                                                                                |
| `r2-measure/2300-ground-halo-{on,off}.png` | The same toggle at night, with the light pool settled. Warm brick round every lit window in one and bare brick in the other; the numbers are in "what the numbers say".                                                                                                           |
| `r2-measure/1200-close.png`                | Noon on the clock tower, the frame the sunlit-slate measurement is taken off: the roof reads as blue-grey slate with courses in it rather than as a hole in the sky.                                                                                                              |
| `r2-warn/0900-close.png`                   | The same clock tower after §4.11's fix, and the frame that proves it: identical to `r2-final/0900-close.png` on the budget (166 draw calls, 397,530 triangles in both), with the run back to **2 warnings** from the 10 the missing realm attach produced.                        |
| `r2-park/1200-overview.png`                | The demo park with both pad buildings in it — the integrator placed them between rounds, so `building: 2` is now in the world factory rather than in a request. Boots clean: `ok: true`, 0 errors.                                                                                |
| `r2-park/pad-grand-pavilion.png`           | The pavilion on its pad at noon: cream render, a nine-bay round-arched arcade down the long elevation, hipped wings, a terracotta roof, the cupola over the crossing, its own paved apron, the park's forecourt plaza to one side and the park's trees round the rest.            |
| `r2-park/pad-ticket-hall.png`              | The ticket hall on the west flank of the entrance forecourt, yawed 90° so its arcade faces the planted roundel, in the park's brick rather than the blueprint's station stone, with the main path running past its door.                                                          |

### What the numbers say

From a throwaway Playwright probe that reads `window.__parkfan_game.scene()` and the module's own
`stats()`, because `report.json` gives only whole-scene figures and a module's share cannot be read
out of it.

- **The budget figure is 120 draw calls, it is the daylight one, and it is what an A/B says.** The
  round-1 report claimed 47 and called it 3.9 % of the 1,200-call budget. 47 was the count of this
  module's own colour meshes, which is not the same question. Disabling `api.meshes()` in the 09:00
  overview takes the whole scene from **173 draw calls / 398,426 triangles** to **53 / 67,468**, so
  this module is **120 draw calls and 330,958 triangles**, i.e. **10.0 % of the call budget**. The
  arithmetic is exact and worth writing down: **57 colour meshes + 21 `kit` meshes × 3 shadow
  cascades = 120.** The cascades are core's mechanism; the geometry going through them three more
  times is this module's, so it counts here. The three non-casting surfaces (glass, lit panes, sign)
  are already excluded from the shadow list, and the halo is a fourth.
- **23 buildings → 21 batches → 57 drawn meshes**, in eighteen distinct types. Per type it is **1 to
  5**: kit (always), glass, lit windows, sign, spill ring. The three terrace houses are **one** batch
  and three matrices, so a street of twenty would still be one.
- **86,314 triangles drawn, 74,458 unique.** The heaviest single building is the grand pavilion at
  **17,038**, then the showcase pack's inn at 12,914 and the clock tower at 10,464; the terrace house
  is 5,928 and is drawn three times. A kit piece is 144–500.
- **Atlas: 403–801 ms** across runs (691 ms in the run these figures come from), sixteen tiles at
  144² × three maps, on the main thread, **and only when the first building is placed** (§4.7). Build
  cost for all 23 buildings: **359 ms**.
- **Texture: 576 × 576 × 3 maps = 3.98 MB, about 5.3 MB with mipmaps** at `medium`; 768² and ~9.4 MB
  at `high`. One atlas for every building of every style in the park.
- **363 windows, of which 200 are lit** after dark, out of one emissive material per colour, plus 24
  light sites that a pool of at most two point lights draws from.
- **The night spill is worth 30,906 pixels and no clipped ones.** Toggling the ring in a settled
  23:00 frame (the light pool re-picks on a 0.45 s clock, so both halves need a few seconds to hold
  still — two "off" frames taken either side of the "on" one differ by **0.0**) lifts the street's
  mean luma by **0.63**, its 99th percentile by **13.9**, its brightest spill pixel by **43.5**, and
  takes the near-black share from **8.1 % to 7.5 %**. At 09:00 the same toggle changes **zero scene
  pixels** — the 32 that do move are the clock in the HUD.
- **The one pooled lantern no longer clips.** At the intensity this round started with, brick 1 m
  from a lamp reached **254.1** across **0.673 %** of the 23:00 street; at 7 it peaks at **250.2**
  with **0.000 %** at 254 and 0.060 % at 250, and that 0.060 % is the lantern's own glazing.
- **Sim tick 0.00 ms.** The sim indexes the entity stream and ticks nothing; the soak harness's
  mean over 576 ticks with every module in it is 2.35 ms against a 6 ms budget.
- **Zero console errors, zero hydration warnings**, `ok: true`, nine shots, in
  `.game-render/r2-final/report.json`. The only two warnings are the `bufferSubData` pair that every
  scene in this game reports (`requests/buildings.md` §5).

### The two demo-park plots, placed and measured

**Both are placed.** The integrator put them in the world factory between the two rounds, so the
demo park's census now reads `building: 2` and the two entities are `building-1551` at
`[-8, 0, -162]` and `building-1552` at `[-33, 0, 178]` with `yaw: π/2` — the calls in
`requests/buildings.md` §1, as written. What follows is the measurement that stood behind them, kept
because a later change to either blueprint has to be checked against it. Both `entity:add` calls
were executed against the running demo park and the resulting meshes' **world** bounding boxes read
back out of the scene:

| item             | pad rectangle               | built extent (world)                    | overhang |
| ---------------- | --------------------------- | --------------------------------------- | -------- |
| `grand-pavilion` | x [−36, 20], z [−178, −146] | x [−35.21, 19.21], z [−174.31, −149.32] | **0.00** |
| `ticket-hall`    | x [−44, −22], z [159, 197]  | x [−42.56, −23.44], z [162.24, 193.76]  | **0.00** |

Clearance to the nearest pad edge is 0.79 m for the pavilion and 1.44 m for the ticket hall; the
pavilion's ridge stands 21.5 m over a pad at 7 m. The two together are **7 draw calls and 22,830
triangles**, and the run logged **zero console errors**.

### Two warnings that are not this module's

Every report carries exactly two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` warnings.
They were in `.game-render/park/report.json` back when the demo park held **zero** `building`
entities — this module drew nothing and allocated no instance buffer there — and they are equally in
`.game-render/probe-rides/report.json`, taken against a showcase this module does not appear in. Not
mine, named here so a critic does not have to find that out. `requests/buildings.md` §5.

Earlier runs of this module also carried the two `Registry.name` page errors; the integrator fixed
that under me and every run since is clean. `requests/buildings.md` §3 keeps the finding.

### The self-test

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs`
→ **66,000/66,000 checks, ~2 s.** What it proves that a frame cannot:

- **The pattern language does what it says.** `"w d w"` on a 26 m wall is three bays of 8.67 m;
  `"w* D w*"` is eight bays of 3.25 m with the door at index 4 of 8; a wall too narrow for its fixed
  bays keeps them anyway.
- **A blueprint from a pack nothing anticipated draws.** A synthetic third pack ships a **watermill**
  — two masses, one swung 22° and standing on a lower `base`, a shed roof, a rubble plinth, louvres
  in the back gable — and it resolves `source: 'pack'`, builds 4,888 triangles and exactly one door.
- **A missing blueprint falls back rather than disappearing**: an item naming
  `a-blueprint-nobody-wrote` warns once, resolves `source: 'fallback'` and draws a plain block.
- **A pack material becomes an atlas surface with no code**: `core-classic:wall-brick` resolves to
  `wall: 'brick'` and `palette.wall: '#9a4a3a'`, the material's own base colour.
- **Every roof form faces the sky** — the check that found §4.1. Area-weighted, above the eaves:
  gable 94 %, hip 95 %, pyramid 95 %, mansard 95 %, shed 100 %, barrel 100 %, cone 100 %, flat 62 %
  (a parapet is a closed box and has an underside), and the highest face of every form points up.
- **Nothing in the catalogue is inside out, and no category decides which triangles are checked.**
  "winding" walks all **64,811** triangles of every blueprint, every kit piece and the synthetic
  pack, and asserts each one against the vertex normal it was authored with: **0 inverted**.
  "outward faces" takes every triangle within 0.1 m of a mass's own plan-prism envelope and asserts
  it looks out of the solid it stands on: **0 m²** facing in. Between them they reproduce the
  round-1 critic's two findings exactly (1,328 fan triangles; 109.3 / 51.8 / 72.6 m² of end wall)
  from the pre-fix tree, and both read zero on this one.
- **The declared `size` matches the geometry** for all seven blueprints within 8 %, apron and kerb
  excluded — the promise `palette.ts` makes to a build tool's ghost.
- **The sim's plan agrees with the geometry it stands in for.** Eight fixtures including the
  synthetic pack's watermill, each placed at a yaw: the sim's plan box is inside the built bounds
  and more than half of them (the difference is the apron, the kerb and the roof overhang), the
  entrance is outside the building, on the front elevation after yaw, and within **6 m** of the door
  `build.ts` actually drew — 0.00 m on three of the eight and 5.41 m at worst on the rotunda, whose
  front elevation is one facet of an octagon. `at()` finds each building under its own plan and not
  half a kilometre away; `rebuild()` against an emptied world empties the index.
- **And the sim reads the packs in its own realm.** A ninth fixture builds one against a `Registry`
  nobody has attached the content to, and asserts the catalogue fills and the pavilion resolves
  `source: 'pack'` rather than the fallback block — the two checks that fail on the version of
  `sim.ts` that leant on the renderer's copy (§4.11).
- **Both demo-park buildings fit their pads**, measured off the built bounds: grand pavilion
  54.4 × 25.0 m on a 56 × 32 pad, ticket hall 19.1 × 31.5 m on a 22 × 38 pad after its yaw.
- **Determinism**: the same seed gives byte-identical positions and the same windows lit; a different
  seed does not; `seedForBuilding` is a pure function of the batch key.
- **Geometry hygiene**: every normal is a unit vector to 1e-4, indices are whole triangles, one
  colour and one uv per vertex, no non-finite positions, no building over four draw calls, the whole
  catalogue under 150 k unique triangles.
- **Every material has real tone variation**, measured rather than asserted: brick 10.2 %, slate
  10.9 %, pantile 12.3 %, shingle 14.1 %, rubble 12.3 %, paving 7.8 %, ashlar 5.1 %, timber 6.5 %
  against a 5 % bar for unit materials; render 3.3 %, concrete 2.8 %, canvas 3.6 %, copper 3.5 %,
  metal 3.8 %, panel 1.9 % against a 1.5 % bar for the ones that really are nearly one colour; the
  window glow 17.3 %. None is roughness-1.0.

`pnpm test:game` is green end to end. `npx tsc --noEmit` and `npx eslint lib/game/buildings` are
clean. `pnpm game:teardown` passes every context check and fails on a core boot error that is not
this module's (`requests/buildings.md` §4).

---

## 4. What went wrong, and what the fix was

Every one of these was found by looking at a picture or by writing a check, and none of them was
visible in a green build.

### 4.1 A whole barrel vault, and every drum in the module, was inside out — **and the check I wrote for it had a hole in it**

`.game-render/probe-isolate/only-market.png` — the market hall with every other building disabled —
showed its brick wall with a **flat cream slab lying on top of it, tiled like paving**. Three rounds
of guessing what that slab was (the arcade's entablature? the apron? the coping?) got nowhere, so I
stopped guessing and wrote a check: build each of the eight roof forms and measure the area-weighted
normal of everything above the eaves. **Barrel 0 %. Cone 0 %.**

`addPrism` authored its facets in increasing angle, and `cross(tangent, up)` points at the axis — so
every prism in the module faced inwards: the cone roof of the rotunda, the octagonal drum under it,
the lanterns, the arcade columns, the round plinths. `barrelRoof` had the same bug independently. A
back-face-culled roof draws no error; it shows **whatever was under it**, which here was the
cornice's top face — and the cornice is a `boxLocal` over the mass's whole plan, so it is a
14 × 34 m cream slab. Both are one-line winding fixes, and the check went into the self-test.

**And the check was written around the surface that was about to break.** It measures the
area-weighted normal of _roof planes_ above the eaves, because `roofs.ts` says, in a comment, that a
gable end is "wall, not roof". So it read 94–100 % on every form while 233.6 m² of gable and mansard
end wall pointed into three of the seven buildings, and 0 inverted while 83 arch heads were
back-faces. The round-1 critic found both. A check with a comment explaining what it does not cover
is a check with a hole in it, and the hole is where the bug lives — the two replacements in §3 have
no categories in them at all.

### 4.2 You could see the landscape through the buildings — **and this shipped recorded as fixed when it was not**

`.game-render/buildings-arcade/1200-arcade.png`: the market hall's arched windows had **grass and a
horizon in them**. A building here is a hollow box whose inner faces are back-face culled, so a
38 %-opaque pane over an opening shows 62 % of the world on the far side.

Every pane got a two-triangle opaque interior behind it and the glass went to 55 % — and the _fan_
of every arch did not, because the fanlight is a separate triangle fan. The second render looked
identical to the first and I nearly recorded the fix as working. The backing is in `fanTriangles`
now and both callers use it.

The interior colour then needed a second correction: at 0.3 of the wall's own colour, a brick facade
in shade came back with **black rectangles punched into it**
(`.game-render/probe2/0900-facade.png`). A real interior is dark and _warm_, so it is
`mix(wall × 0.42, litColour, 0.22)`.

**None of that was the bug, and this section shipped claiming it was.** The backing landed and the
fans were still holes, because `fanTriangles` walks its ring from the left springing over the crown
to the right one — clockwise as seen from the front, against `tri()`'s counter-clockwise contract —
so **both** fans it emits, the backing and the glass, were back-faces and culled. 49 on the pavilion,
25 on the market hall, 7 on the rotunda, 2 on kit pieces: 83 arch heads you could see the meadow
through, at 44 m and at 132 m. The paragraph above even contains the warning it needed — "the second
render looked identical to the first and I nearly recorded the fix as working" — and then recorded it
as working anyway. The fix is one swap of the ring order and it is now held by a check that walks all
63,513 triangles of the catalogue.

### 4.3 A three-storey terrace house 23 m tall

A mansard is two pitches, and I took the break at 42 % of the half-span. At 72° a horizontal run is
nearly three times itself in height, so a 5 m half-span got an **8.9 m** lower slope and the self-test
measured the house at 22.9 m against a declared 16. What matters is the _run_ of the steep part, not
a fraction of the span: 1.0 m of run, 70°, is a 2.75 m lower slope — the storey inside the roof the
form exists for. Measured after: 17.6 m.

### 4.4 A door on the first floor

The pattern language repeats its last storey upward by design, so `"w d w"` on a two-storey mill
asked for a door three metres up — and the self-test caught it as two doors where the blueprint
wanted one. Upstairs, `d` and `D` now draw a full-height window, which is what a French casement onto
no balcony actually is. The substitution is in the primitive rather than in every blueprint that has
to remember.

### 4.5 A colonnade with no roof on it

`.game-render/buildings-detail2/1200-inn.png` showed the market hall's arcade from above as a
35 × 3 m platform of pale stone lying against the building. It stopped at the entablature. A loggia
has a roof on it; it is where the rain goes. It gets a lean-to in the building's own roof material
now, and `planExtent` counts the arcade and the eaves so the apron reaches under the columns instead
of leaving seven of them standing on grass.

### 4.6 Ten kit pieces standing edge-on

The first showcase turned each kit piece to face the street it stood beside, so from the street they
were **black slabs**: a 4 × 4 m panel 0.3 m thick, seen end-on
(`.game-render/showcase-buildings/0900-close.png`, first round). They face the visitor now, and the
roof pieces sit on a metre of wall and a plinth instead of lying in the grass like a wedge.

### 4.7 A park with no buildings was paying for the atlas

Sixteen procedural tiles is 400–800 ms of per-pixel JavaScript on the main thread and 5.3 MB of
texture, and the demo park — which reserves two plots for this module and has nothing standing on
them — was paying all of it at boot for nothing. A sandbox starts empty too. The atlas and the
materials are built on the **first** `building` entity now; the rng draw that seeds them stays at
`main()` so the module's stream advances identically either way.

### 4.8 Every lit window was the same value, and then they were all white

Babylon's PBR computes emissive as `emissiveColor × texture(uv)` and never touches the vertex stream,
so one emissive material means one brightness for every lit pane in the park — which is what a decal
looks like. Atlas slot 12 is a **window glow** field no pack can name, and each pane samples a random
45 % sub-rectangle of it, so forty windows get forty brightnesses and a soft gradient inside each
one. Then the peak was 1.15 against the pipeline's 0.9 bloom threshold and
`showcase-buildings/2300-close.png` came back with every pane a white rectangle in its own halo,
glazing bars gone. 0.95 keeps the variation the trick exists for.

### 4.9 A chequerboard instead of a stone wall

Ashlar took its per-block tone at ±16 %, which on the ticket hall's back elevation
(`.game-render/buildings-detail/1200-gate.png`) read as a chequerboard of light and dark blocks.
Dressed stone out of one quarry is close in tone; it is rubble that is not. ±11 %, with the
difference put back as bedding grain inside each block.

### 4.10 The night spill was on at nine in the morning, and it was painted over the roofs in front of it

The frame I took to prove §4.2 was closed — the clock tower at 44 m, 09:00 — has, four hundred
pixels above the gable I was checking, **a row of orange window-shaped outlines lying flat on the
slate**, and beside them a smear of the teal that only the guest-services pavilion two buildings
further back is painted. I nearly filed the frame as evidence for something else.

Two independent bugs, both one line, and both in Babylon rather than in this folder.

**The dusk curve was wired to a value the shader does not use.** `PBRMaterial` computes emissive as
`emissiveColor × texture(uv)`, which is what the lit panes one screen down depend on for their
per-pane brightness. `StandardMaterial` does not: `default.fragment` sets `emissiveColor =
vEmissiveColor` and then, under `#ifdef EMISSIVE`, **adds** `texture(uv) × level` to it. The ring
had the atlas bound as its emissive texture, so it drew the glow tile at full strength at every hour
of the day and `applyHalo`'s fade — the function with the comment about not lighting the street —
moved nothing at all. Every measurement I took of the spill last round was a measurement of a
constant. The texture is gone; the falloff was never in it (it is in the vertex colour, which
reaches the output through `baseColor.rgb`), so `emissiveColor` alone is now both the fade and the
tint, and the peak that used to come out of the tile is written down as 0.72.

**And it was in rendering group 1.** I put it there to get it drawn after the wall it lies on.
Babylon clears the depth buffer before every rendering group above zero unless told otherwise
(`_autoClearDepthStencil[1].depth === true`), so the ring was drawn against no depth at all: every
lit window in the scene stamped its outline on whatever geometry stood in front of it. It is back in
group 0, where alpha-blended meshes already render after the opaque ones — which is the ordering the
group was reaching for — and `disableDepthWrite` keeps it from occluding anything.

The A/B is in `.game-render/r2-measure/`: at 09:00, toggling the ring changes **zero pixels of the
scene** (32 move, and all 32 are the clock in the HUD); at 23:00 it lifts 30,906 of them.

**A third thing fell out of the same frame.** The round-1 critic measured brick 1 m from a wall
lantern at luma 246.8 and called it clipped. Round 2's answer — move the light 0.9 m off the wall
and halve it — was checked against a harness frame in which the light pool had not settled, so it
measured a lantern that was not on. With the pool running it clipped **worse**: 254.1 across 0.673 %
of the 23:00 street. The arithmetic says why. Babylon's default point-light falloff is
inverse-square, and 0.9 m in front of a wall is a distance of 0.9, so the nearest brick receives
**more** than the number written in the source. At 7 it peaks at 250.2 with nothing at 254, the
courses and the mortar joints stay legible inside the pool, and the only pixels over 250 are the
lantern's own glazing.

### 4.11 A module with no sim cannot own a kind, and nothing said so until the park had two buildings in it

`pnpm test:game` went red on `✗ no orphan entities — {"building":2}`. The check asks the **sim
runtime's** registry who owns each entity's kind, and `building` had no owner there, because
`SimRuntime.createModules` reads

```ts
if (!def?.sim) continue;
for (const kind of def.kinds ?? []) this.registry.registerKind(kind, def.id);
```

— the `continue` comes first, so a module with no `sim` never reaches the line that claims its kind.
`host.ts` does it unconditionally on the main thread, which is why the palette, the build bar and
the renderer had all been perfectly happy. The check's own comment had already written down the way
it would be found: "a check that would have gone green here only because the demo park has no
entities to get it wrong about yet." The integrator placed the two pad buildings, and it did.

Round 1 argued this module needs no sim, and `index.ts` said so in a docstring: a building is a fact
about the world, not a process. The tick is still empty and that part of the argument still holds.
What it missed is that **`sim` is also where ownership is declared**, so refusing one is refusing to
own the kind.

`requests/buildings.md` §8 asks for the two lines to be swapped in core. `sim.ts` is here either
way, and it is not a shim: a guest cannot wait for a mesh, so the two things the other side of the
thread would ask for — **a footprint and a door** — are derived from the blueprint alone, with no
geometry built and no atlas touched. `at(x, z)`, `entrance(id)` and `nearestEntrance(x, z, r)` are
what a path tool and a wandering guest need.

**And the first version of it read an empty catalogue.** `manifest.ts` keeps its styles and
blueprints in module scope; the worker and the main thread are separate realms with a copy each, so
the renderer having read the packs says nothing about what is in the sim's. `resolveBuilding` found
every item, found no blueprint behind it, and fell back to a plain block — so the sim indexed eight
boxes of the wrong shape while every pixel on screen stayed correct, because the renderer reads its
own copy. What said so was the harness: a run that had reported **2 warnings** reported **10**, and
the eight new ones were `"parkfan-architecture:grand-pavilion" is a blueprint but no pack declares
one by that id`, one per building. It is `attachBuildingContent(ctx.registry)` in the sim as well,
and the self-test now builds a sim against a registry nobody has attached to and asserts the
catalogue fills and the pavilion resolves `source: 'pack'` — two checks that fail on the old file.

That makes it a **hand-written twin** of `build.ts`, which is the shape of bug this repository
already knows, so the self-test measures it against the thing it stands in for rather than asserting
it (§3, "sim plan"). Three things came out of that immediately: `MassDef.size` is two numbers and
not three, so the first version read a mass's depth as its height; an **arcade** is part of the
footprint, and leaving it out made the ticket hall's plan 10 m deep against a building that is 19 m
deep; and a plan box centred on the **entity** is the wrong box — the watermill's masses sit off its
origin, so a symmetric box is 15.4 m across a building that is 13.8 m across, and the record carries
its own `cx, cz`. The doors are exact on three of the eight fixtures and
within 1.9 m on four more; the worst is the rotunda at 5.4 m, because the middle of an octagon's
facet is not the arch in it.

---

## 5. What is weak, ranked

Round 2. Everything the round-1 critic ranked 1–10 is closed except #11; what follows is what is
left, including four things the critic did not raise.

1. **The atlas is 160 px/m at the preset the harness runs.** A 0.9 m brick tile at 144 px is 160
   texels per metre against the art bible's 256 for mid-ground and 512 for what a camera can touch;
   `high` is 213 and `ultra` 249. `probe2/0900-facade.png` is where it shows — at two metres the
   mortar joints are soft. Raising it costs boot time and memory linearly (192² is 1.8× the 400–800
   ms), and the honest fix is generating the atlas off the main thread, which is a `Worker` this
   module does not have.
2. **The night spill is a decal, and its strength is a number I chose by looking.** The ring works
   now that the fade reaches it (§4.10) — 30,906 lifted pixels at 23:00, none at 09:00, nothing
   clipped — but it is eight quads of vertex-coloured falloff on a flat wall, so it does not turn a
   corner, it does not fall on the ground under a window, and it does not know the wall's normal. A
   reveal's own soffit gets nothing. Its peak, 0.72, is the strength the glow tile happened to
   supply while the bug was in place; it is defensible in the three frames I measured and there is no
   physical argument behind it. The right answer is one real light per lit facade, and the whole game
   has six.
   **And two frames were not enough to catch the bug it replaced.** The dusk gate, the ring geometry
   and the clamp to the wall's extent all shipped last round with screenshots I had looked at, and
   the thing they were all tuning was a constant. What found it was a 420 × 130 crop of the eaves of
   one building, blown up 2×, taken to check something else. At 1280 × 720 a window ring on a roof
   is eight pixels tall.
3. **The buildings have no interiors and the doors do not open.** Every opening is backed by a flat
   dark quad 70 mm behind the glass. It reads correctly from outside at every camera the game uses,
   and it will read as a lie the first time one goes through a door.
4. **`round` masses only take polygons, and there is no dome.** A rotunda is an octagon and a cone; a
   real one is a cylinder and a hemisphere. The eight roof forms have no dome, no gambrel, no
   sawtooth, no bell-cast mansard. Each is a `roofs.ts` function and a schema line, but a pack cannot
   add one.
5. **The `flat` roof form still measures 62 % of its area facing up** in §5b's roof check, and that
   is a closed parapet box with a real underside rather than a bug — but it means that one check is
   looser for that form than I would like. §5c and §5d, the two round-2 checks, are strict at zero
   for every form.
6. **§5d has one known limitation and it is coincident envelopes.** Where two masses' plan boundaries
   land on the same plane — a wing whose edge grazes the block it joins — a correct outward face of
   one is on the envelope of the other and the check cannot tell which it belongs to. It is stated in
   the check, and the selftest's own watermill fixture was moved 2 m off the coincidence rather than
   the tolerance being widened. All seven shipped blueprints and the showcase pack measure a strict
   zero without it.
7. **The `sim` has an empty tick, and a building still costs nothing and does nothing.** It indexes
   footprints and doors (§4.11) and that is all: no upkeep, no power draw, no capacity, nothing a
   guest can enter. Nothing calls it yet either — `guests` and `paths` do not know it is there, so
   its two useful queries are a offer rather than a feature. When `management` wants a building's
   power or `guests` wants a lobby to shelter in, that is what goes in the tick.
8. **The showcase street is enclosed enough that three of my own inspection cameras were blocked.**
   The east side is behind the terrace from every western viewpoint, which is why the showcase pack's
   inn had to be moved to its own plot at the north-east corner to be photographable at all. A critic
   wanting a three-quarter view of the market hall will have the same trouble.
9. **The kit row is still ten pieces standing in grass** — round-1 finding 11, and the only one I did
   not close. They face the visitor and the roof pieces sit on a metre of wall, but a Panorama window
   is a teal rectangle on a lawn. A short plinth run along the pavement is what a builders' merchant
   looks like and it is half an hour of `showcase.ts`.
10. **`terrace-house` has a residential ground floor.** A park's main street is shopfronts at street
    level, the pattern language already has `g` for it, and this is one more blueprint in the pack
    rather than a code change. Not written.
11. **Two atlas slots are nearly unused.** `canvas` and `copper` were added to fill a 4 × 4 grid and
    nothing in the shipped pack names them. They cost about 12 % of the atlas generation time to
    produce a surface no frame in this report contains.
12. **Nothing checks a frame, and both of round 2's own findings were frame-only.** `selftest.mjs`
    walks 64,811 triangles and cannot see a material that ignores its own fade or a mesh in the wrong
    rendering group; the harness reports `ok: true` and 0 errors on a frame with light stamped
    through a roof. A cheap version exists — take the 09:00 close frame with this module's meshes
    toggled and assert the two differ in nothing but the HUD — but it needs a browser, so it belongs
    with `game:bundle` and `game:teardown` rather than in the self-test.

## 6. Requests

`docs/game/requests/buildings.md`: the two demo-park calls with their measured fit, now placed (§1),
the `package.json` line for the self-test (§2), the `Registry.name` finding (§3), a core teardown
error that is not a leak (§4), the two harness warnings that belong to nobody (§5), the unchecked
`buildings[].size` promise (§6), why i18n has nothing to do yet (§7), and the two lines in
`SimRuntime.createModules` that let a module own an entity kind without a sim (§8) — the one that
turned `pnpm test:game` red for everybody and cost a whole file to work around.
