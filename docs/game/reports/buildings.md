# buildings — builder report

`lib/game/buildings/` · showcase `/game?showcase=buildings` · 15 TypeScript files, 7,233 lines, plus
a 637-line self-test of 65,918 checks. Entity kind `building`. Nothing outside the folder was touched
except this file and `docs/game/requests/buildings.md`.

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
| `index.ts`     | The `GameModule`. Worker-safe: Babylon only through `await import('./main')`. No `sim` — §5.6.  |
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
| `selftest.mjs` | 65,918 checks in ~1 s, no browser.                                                              |

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
- **No `world.modules.buildings` slot, no commands, no events, no sim.** A building is a fact about
  the world, not a process: it has no state that changes with the clock and nothing to serialise
  beyond the entity core already owns. §5.6 says what that costs.

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

`node scripts/game-shot.mjs --showcase=buildings --cam=overview,close,ground --tod=09:00,18:30,23:00`
and `node scripts/game-shot.mjs --cam=overview,close --tod=12:00,22:00`, 1280 × 720, WebGL2 through
SwiftShader, `medium` preset. Every PNG below was opened and looked at.

### The frames

| File                                           | What is actually in it                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showcase-buildings/0900-overview.png`         | The street from 132 m: three brick terrace houses with mansards and chimneys, the ticket hall's arcaded front, the clock tower, the grand pavilion closing the vista, the rotunda's terracotta cone, the market hall's dark barrel vault, the teal guest-services pavilion.       |
| `showcase-buildings/0900-ground.png`           | Eye level on the street. Brick with real courses, sashes with glazing bars, sills, string courses, quoins, wall lanterns, the pavilion's cupola at the end of the vista. Windows read as glazed rather than as holes.                                                             |
| `showcase-buildings/0900-close.png`            | The clock tower block at 44 m: two storeys of brick under a 46° slate roof with three dormers and two chimneys, the tower with its pyramid roof and lantern, the rotunda behind it.                                                                                               |
| `showcase-buildings/1830-ground.png`           | Dusk. The lights are coming on: warm panes at different brightnesses, lanterns beside the doors, the cupola lit at the end of the street, sky still blue. The best frame in the set.                                                                                              |
| `showcase-buildings/2300-close.png`            | Night on the clock tower. Individual panes at individual brightnesses with the glazing bars still legible, dormers lit, the tower lantern glowing, the guest-services sign teal in the distance.                                                                                  |
| `showcase-buildings/2300-overview.png`         | The whole street at night — lit windows scattered across the terrace, four glowing cupolas, one teal sign. Reads as a place with people in it, from 132 m.                                                                                                                        |
| `buildings-exhibit/1200-inn.png`               | **The extensibility exhibit.** The showcase pack's inn: a jettied first floor oversailing the ground floor with its shadow under it, a wing swung 35° off the block, an oculus in the gable, pantiles, two chimneys. Three masses of JSON, nothing in `lib/game/buildings` knows. |
| `buildings-detail5/1200-rot.png`               | The rotunda: an octagonal drum with an arch on every facet, a conical terracotta roof, a glazed lantern with a finial.                                                                                                                                                            |
| `buildings-detail5/1200-market.png`            | The market hall's barrel vault, after §4.1 — the frame that proves the roof is there.                                                                                                                                                                                             |
| `probe2/0900-facade.png`                       | Two metres from a terrace house in shade: bricks, mortar joints, quoin blocks, a string course, sill, lintel, sash, glazing bars. The only frame in which any of those is more than a pixel.                                                                                      |
| `probe-palette/buildings-tab.png`              | The build bar's Buildings tab with all twenty items (§2).                                                                                                                                                                                                                         |
| `park/1200-overview.png` and `park/2200-*.png` | The demo park as a regression check. Boots clean, and the two reserved pads are **empty ground** — this module may not edit `lib/game/demo-park/`, so the exact call is `requests/buildings.md` §1.                                                                               |
| `buildings-pads/pavilion.png`                  | The grand pavilion standing on the demo park's `pavilion` pad, placed through the exact call in the request, with the forecourt plaza below it and the park's own trees round it.                                                                                                 |
| `buildings-pads/entrance-hall.png`             | The ticket hall on the west flank of the entrance forecourt, arcade square on to the planted roundel, in the park's brick rather than the blueprint's station stone.                                                                                                              |
| `buildings-pads/entrance-preset.png`           | The same two through the built-in `entrance` camera — the frame the whole-game critic will take: the gate arch, the roundel, the ticket hall on the left, the pavilion 340 m up the axis.                                                                                         |

### What the numbers say

From a throwaway Playwright probe that reads `window.__parkfan_game.scene()` and the module's own
`stats()`, because `report.json` gives only whole-scene figures and a module's share cannot be read
out of it.

- **23 buildings → 21 batches → 47 drawn meshes**, i.e. **47 draw calls for twenty-three buildings**
  in eighteen distinct types. Per type it is **2 to 4**: kit (always), glass, lit windows, sign. The
  three terrace houses are **one** batch and three matrices, so a street of twenty would still be
  three draw calls. Against the game's 1,200 budget that is **3.9 %** for more buildings than a real
  park's main street.
- **82,452 triangles drawn, 70,384 unique.** The heaviest single building is the grand pavilion at
  15,854 (kit) + 208 (glass) + 316 (lit) = **16,378**; the terrace house is 5,934 and is drawn three
  times. A kit piece is 144–464.
- **Draw calls in the whole frame: 153–163 at 09:00, 86–98 after dark**, of which this module is 47.
  (The daytime figure is higher because the sun's shadow cascades add passes; that is core's.)
- **Atlas: 403–801 ms** across runs, sixteen tiles at 144² × three maps, on the main thread, **and
  only when the first building is placed** (§4.7). Build cost for all 23 buildings: **163 ms**.
- **Texture: 576 × 576 × 3 maps = 3.98 MB, about 5.3 MB with mipmaps** at `medium`; 768² and ~9.4 MB
  at `high`. One atlas for every building of every style in the park.
- **366 windows, of which 200 are lit** after dark, out of one emissive material per colour.
- **Sim tick 0.00 ms** — there is no sim.
- **Zero console errors, zero hydration warnings**, `ok: true`, in both `showcase-buildings/` and
  `park/report.json`.

### The two demo-park plots, placed and measured

The integrator asked for the reserved plots to be finished and for the footprints to be measured
against the pads before proposing anything. Both `entity:add` calls in `requests/buildings.md` §1
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

Both reports carry two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` warnings. They are in
`.game-render/park/report.json` — the demo park, which contains **zero** `building` entities, so this
module draws nothing and allocates no instance buffer there — and in
`.game-render/probe-rides/report.json` taken against `--showcase=rides`. Not mine, named here so a
critic does not have to find that out. `requests/buildings.md` §5.

Earlier runs of this module also carried the two `Registry.name` page errors; the integrator fixed
that under me and every run since is clean. `requests/buildings.md` §3 keeps the finding.

### The self-test

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/buildings/selftest.mjs`
→ **65,918/65,918 checks, ~1 s.** What it proves that a frame cannot:

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
- **The declared `size` matches the geometry** for all seven blueprints within 8 %, apron and kerb
  excluded — the promise `palette.ts` makes to a build tool's ghost.
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

### 4.1 A whole barrel vault, and every drum in the module, was inside out

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
14 × 34 m cream slab. Both are one-line winding fixes, and the check is in the self-test so the next
roof form cannot ship the same way.

### 4.2 You could see the landscape through the buildings

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

---

## 5. What is weak, ranked

1. **The atlas is 160 px/m at the preset the harness runs.** A 0.9 m brick tile at 144 px is 160
   texels per metre against the art bible's 256 for mid-ground and 512 for what a camera can touch.
   `high` is 213 and `ultra` 249. `probe2/0900-facade.png` is the frame where that shows: at two
   metres the mortar joints are soft. Raising it costs boot time and memory linearly — 192² is 1.8×
   the 400–800 ms — and the honest fix is generating the atlas off the main thread, which is a
   `Worker` this module does not have.
2. **A night facade is lit windows on a black wall.** The pooled point lights (two at `high`, one at
   `medium`, and deliberately the smallest share of the six the whole game has) sit at doorways, so
   the wall around a lit window gets nothing from it. `2300-close.png` shows it: the panes glow, the
   brick beside them is nearly black. A cheap emissive halo quad around each lit pane, or one light
   per lit facade rather than per doorway, would fix it; neither is written.
3. **The buildings have no interiors and the doors do not open.** Every opening is backed by a flat
   dark quad 70 mm behind the glass. It reads correctly from outside at any distance the game's
   cameras use, and it will read as a lie the first time a camera goes through a door.
4. **`round` masses only take polygons, and there is no dome.** A rotunda is an octagon and a cone;
   a real one is a cylinder and a hemisphere. The eight roof forms have no dome, no gambrel, no
   sawtooth, no mansard with a curved bell. Each is a `roofs.ts` function and a schema line, but a
   pack cannot add one.
5. **The `flat` roof form measures 62 % of its area facing up**, and that is a closed parapet box
   with a real underside rather than a bug — but it means the check that caught §4.1 is looser than
   I would like for that one form.
6. **There is no `sim`, so a building costs nothing and does nothing.** No upkeep, no power draw, no
   capacity, nothing a guest can enter. When `management` wants a building's power or `guests` wants
   a lobby to shelter in, this module grows a sim; I did not add one to have one.
7. **The demo park's two plots are still empty in the committed tree**, because I may not edit that
   folder. The call is not guesswork — it was run against the real park through
   `__parkfan_game.dispatch` and the placed meshes' world bounds measured against the pad
   rectangles: **0.00 m overhang on all eight edges**, 54.42 × 24.99 m in the 56 × 32 pavilion pad
   and 19.12 × 31.52 m in the 22 × 38 entrance pad, 7 draw calls, zero console errors, and the three
   frames above. But until somebody pastes it in, the only place in the committed tree where these
   buildings stand is the showcase. `requests/buildings.md` §1.
8. **The showcase street is enclosed enough that three of my own inspection cameras were blocked.**
   The east side is behind the terrace from every western viewpoint, which is why the inn had to be
   moved to its own plot at the north-east corner to be photographable at all. A critic wanting a
   three-quarter view of the market hall or the guest-services pavilion will have the same trouble.
9. **`terrace-house` has a residential ground floor.** A park's main street is shopfronts at street
   level, and the pattern language already has `g` for it — this is one more blueprint in the pack,
   not a code change, and I did not write it.
10. **Two atlas slots are nearly unused.** `canvas` and `copper` were added to fill a 4 × 4 grid and
    nothing in the shipped pack names them. They cost about 12 % of the atlas generation time to
    produce a surface no frame in this report contains.

---

## 6. Requests

`docs/game/requests/buildings.md`: the two demo-park calls with their measured fit (§1), the
`package.json` line for the self-test (§2), the `Registry.name` finding (§3), a core teardown error
that is not a leak (§4), the two harness warnings that belong to nobody (§5), the unchecked
`buildings[].size` promise (§6), and why i18n has nothing to do yet (§7).
