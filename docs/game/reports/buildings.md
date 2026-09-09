# buildings — builder report

`lib/game/buildings/` · showcase `/game?showcase=buildings` · 16 TypeScript files, plus a self-test
of 66,020 checks. Entity kind `building`. Nothing outside the folder was touched except this file and
`docs/game/requests/buildings.md`.

**Round 1: 7.5, FAIL** (`docs/game/critiques/buildings-round1.md`). **Round 2: 8.2, FAIL**
(`docs/game/critiques/buildings-round2.md`), short of the 8.5 gate by 0.28, with no hard gate
failed. The round-2 critic's closing instruction is what round 3 started from, verbatim: _"Round 3
should start by making §5d judge every upright triangle rather than only those standing on a mass's
plan envelope … until that check has no hole in it nothing else about this module's geometry can be
trusted to stay fixed."_

**It was the right instruction, and the reason is in §0.** Widening the check cost the round's
largest diff — a `Solid` recorded by every primitive that lays a volume down, plumbed through
`geometry.ts`, `build.ts`, `kit.ts` and `roofs.ts` — and the first run of it printed the module's
largest visible defect, the one the same critic had ranked first and could not explain: **every round
mass in the catalogue was built inside out**, which is why the rotunda's drum photographed as a
featureless pale sheet. Two rounds of checks had read green over it.

This report has been corrected against both critiques rather than defended. Round 1's corrections
(§4.1, §4.2 and a draw-call share measured at night and spent in daylight) are marked in place.
Round 2's are §0 below: the claim that its two winding checks had "no categories in them at all" was
true of one of them and false of the other, and that sentence is struck wherever it appeared.

---

## 0. Round 3 — what changed and what it is worth

| #   | Finding (round-2 critique unless marked)                                                | State | Evidence                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | §5d could not see 2,650 m² of upright surface, and the report said it had no categories | fixed | it judges **every** upright triangle in the build against the solids the KIT recorded; 38,237 judged over 8,897 m², **248 / 132.4 m² (1.6 %) on no solid at all — counted, printed and asserted under 2 %** |
| 2   | The rotunda's drum reads as a featureless pale sheet                                    | fixed | **found by finding 1**: `roundFrames` walked its ring by increasing angle, so every round mass in the module was built inside out. Put back, §5d answers `rotunda: 475 triangles, 117.2 m²` (§4.12)         |
| 3   | One point light for 24 sites, and the harness never photographs it                      | fixed | `LIGHT_POOL.medium` 1 → 2 and the pool re-sorts on a camera **jump** as well as on its clock; the standard 23:00 frame and a `--wait=20000` control differ in **0 scene pixels** (§4.13)                    |
| 4   | The night roofscape is black, the largest surface in every overview                     | fixed | a hemispheric sky term on this module's meshes only: a mansard slope 26.4 → 35.9 mean luma, the lawn **19.8 → 19.8** to the decimal (§4.14)                                                                 |
| 5   | A park's main street with no shopfront on it                                            | fixed | `shop-terrace` — one blueprint, no TypeScript — on three of the eleven showcase plots; the glazed shopfront and its fascia are legible in `0900-ground.png` and lit in `1830-ground.png`                    |
| 6   | `overview` frames empty lawn and hides the kit row behind the HUD                       | part  | reframed and two plots moved to the east side: lawn **71.8 % → 60.8 %** of the judged frame. Three fifths is still lawn (§5.3)                                                                              |
| 7   | Two kit samples still read as slabs                                                     | open  | §5.1 — the Panorama window and the Double door, both visible in `1200-kit-east.png`                                                                                                                         |
| 9   | `mass.id` dead, clock count hard-coded where the manifest has a field                   | fixed | `sign.mass` names the mass a sign hangs on; `mass.clockFaces` overrides the 1.6 : 1 ratio                                                                                                                   |
| 10  | Two pixel claims that do not say what they measured                                     | fixed | every pixel figure in §3 now names its file, its crop and its threshold                                                                                                                                     |
| 11  | **Round 3's own:** the kit yard laid a plaza over the promenade                         | fixed | a `plaza` does not clip a path that crosses it; `1200-kit.png` came back with the two surfaces torn into each other. Two `path` aisles instead (§4.15)                                                      |
| 12  | **Round 3's own:** a code comment quoting numbers from a frame that no longer exists    | fixed | `main.ts`'s sky-light comment cited a roof band measured before `overview` was re-aimed; re-A/B'd and re-written with the file and the crop in it                                                           |

**The round's whole result is row 1 finding row 2, and that is worth saying plainly.** The critic
demonstrated the hole by turning every dormer front in the catalogue inward and watching the suite
pass; the fix was to take the reference for "which way is out" from the code that lays each solid
down (`Surface.solids`, filled by `addBox`, `addPrism`, `addBand`, `addTube`, `boxLocal` and the mass
itself) instead of from `blueprint.masses`. The first thing the widened check printed was a rotunda
with 475 inward triangles in it — the building the same critic had ranked as the module's worst
frame, whose cause neither of us had found by reading source or by measuring pixels. **Both halves
were verified this round, by hand, in a scratch edit that was then reverted** (§4.12).

**What did not get done: the kit row is still a display row.** It stands on paving now instead of
grass and it has two cameras of its own instead of a frame of the promenade, but the Panorama window
is still a teal box and the Double door still a flat leaf. It is round 1's finding 11, open for three
rounds, and it is named first in §5 rather than dressed up here.

---

## 0b. Round 2 — what changed and what it is worth

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
| 11  | Kit pieces are ten slabs on a lawn                                                    | open  | round 2's §5 item 9 — still a display row, not a merchant's yard. Round 3 gave it paving and two cameras and it is still open, §5 item 1                                                                         |
| 12  | The spill's dusk curve was wired to a value the shader ignores                        | fixed | `StandardMaterial` ADDS its emissive texture to `emissiveColor` instead of multiplying, so the ring drew the glow tile at full strength at every hour; the texture is gone and the colour is the fade (§4.10)    |
| 13  | The spill was drawn over whatever stood in front of it                                | fixed | `renderingGroupId = 1` clears the depth buffer; the ring is back in group 0, where alpha meshes already sort after opaque ones (§4.10)                                                                           |
| 14  | `pnpm test:game` went red on `{"building":2}` the day the demo park got its buildings | fixed | a kind gets its owner in the **sim** runtime and this module had none; there is one now, and it earns its keep (§4.11)                                                                                           |

**The two that failed the module were the same class of bug, and the check I wrote after round 1's
own winding bug could not see either of them.** §4.1 measured _roof planes_, because `roofs.ts` says
in a comment that a gable end is "wall, not roof" — so the check exempted the surface that was about
to break. Round 2 replaced it with two checks and called them **"checks with no categories in them at
all". ~~That sentence was false and is withdrawn.~~** It was true of §5c, which walks every triangle
in the build against its own normal. It was not true of §5d: that check took its reference from
`blueprint.masses`, so it judged only triangles standing within 0.1 m of a mass's plan prism, and
**12,323 upright triangles over 2,650 m² — eleven times the area that failed round 1 — were judged by
nothing.** The critic proved it rather than arguing it, by turning every dormer front in the
catalogue inward and watching the suite answer `66000/66000 checks passed`. Round 3 closed the hole
and, in the same commit, stopped claiming it does not exist: what is not covered is now **counted,
printed and asserted** (§4.12), which is the only form of that claim a reader can check.

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
| `selftest.mjs` | 66,020 checks in ~2 s, no browser.                                                              |

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

Five styles, eight blueprints and ten palette entries ship built in, written as the JSON a pack would
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

**Twenty items when this was photographed, twenty-one now**, all enabled, all localized. Ten are the
kit pieces the two bundled packs already declared and that nothing had ever drawn — Brick wall €24,
Plaster wall €20, Arched window €32, Double door €36, Slate roof €30, Timber floor €12, Stone column
€15, Concrete wall €22, Flat roof €26, Panorama window €42. The rest come from this module's pack —
Ticket hall €42,000, Grand pavilion €96,000, Clock tower hall €54,000, Market hall €61,000, Rotunda
€33,000, Terrace house €21,000, **Shop terrace (round 3)**, Guest services €26,000, Glass canopy
€9,000, Arched wall €3,200, Oculus wall €3,400. The tab has not been re-photographed since
`shop-terrace` was added, so the twenty-first item is asserted from `pack.ts` and the selftest's
catalogue walk rather than from the DOM — which is a weaker claim than the rest of this section and
is marked as one.

So the blueprints **are** reachable through `buildingSchema`, and no request to `tools` is needed.
The mechanism: a blueprint is a `buildings[]` entry with `category: 'blueprint'` whose `procedural`
names the `buildingBlueprints` record, so `palette.ts` sees an ordinary schema entry and takes the
footprint from `def.size[0]`/`def.size[2]` and the ghost height from `def.size[1]`. That makes those
three numbers a promise about geometry that nothing in core checks — this module checks its own
(§3, "declared size") and `requests/buildings.md` §6 records that a pack written by anybody else can
still lie.

---

## 3. What I verified

```
node scripts/game-shot.mjs --url=http://localhost:3001 --showcase=buildings \
  --cam=overview,close,ground --tod=09:00,18:30,23:00 --out=.game-render/buildings-r3-final
```

1280 × 720, WebGL2 through SwiftShader, `medium` preset, **`localhost:3001`, the dev server** —
which is the server every figure below came from unless the line says otherwise, and it is worth
naming because the production server on `:3100` is a build from before this round's code — which is
**checked rather than assumed**: `.game-render/buildings-r3-prod/1200-rot.png` is the `rot` camera
against `:3100`, and it still has round 2's white drum in it, from a `.next` built at 16:02 against a
commit landed at 20:14. That frame is worth keeping for its own sake: the same camera against two
live servers, the bug in one and the fix in the other, with nothing but the build between them. Every PNG in the tables below was opened with the Read tool and looked at. Round 3's sets:

| directory                                 | what is in it                                                                                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.game-render/buildings-r3-final/`        | the nine gauntlet frames, taken after the last code change in this round                                                                                                                                                               |
| `.game-render/buildings-r3-insp/`         | the same cameras BEFORE §4.15's fix — kept for the torn kit yard in its `1200-kit.png`                                                                                                                                                 |
| `.game-render/buildings-r3-kit/`          | five inspection cameras at noon, taken after the last change of this round: the two kit aisles, `rot`, `facade`, `inn`                                                                                                                 |
| `.game-render/buildings-r3-settled/`      | the 23:00 `ground` control at `--wait=20000` (§4.13)                                                                                                                                                                                   |
| `.game-render/buildings-r3-night/`        | two A/Bs at 23:00 — the sky term (§4.14) and the two pooled point lights                                                                                                                                                               |
| `.game-render/r3-drum-before/`, `-after/` | the rotunda at noon with the ring wound both ways (§4.12)                                                                                                                                                                              |
| `.game-render/_r3-crops/`                 | every crop cited below, cut with `sharp` and nearest-neighbour so no resampling invents detail: the drum before and after at 3×, the drum wide at 3×, the kit-yard tear at 2.5×, the rotunda at `close` at 4×, and the two night crops |
| `.game-render/buildings-r3-prod/`         | one frame from `:3100`, the pre-round production build, for the same reason                                                                                                                                                            |

**Round 2's vintage note about the night frames is withdrawn, because the thing it warned about is
fixed.** It read: _"the light pool re-picks on a 0.45 s clock and needs several seconds to settle,
which is longer than `game-shot.mjs` waits, so no harness frame in this report has a pooled lantern
lit in it at all."_ That was true and it made every night frame of this module for three rounds a
frame of the wrong thing — the critic measured the standard 23:00 street 28 % darker in the near-wall
band than what a player sees. The pool re-sorts on a camera **jump** now as well as on its clock, and
the proof is a control rather than a promise: `buildings-r3-final/2300-ground.png` at the harness's
default 1.2 s and `buildings-r3-settled/2300-ground.png` at 20 s **differ in 32 pixels, all of them
the animated HUD clock, and in 0 pixels of the scene** (§4.13). The nine frames below are frames of
this module.

### The frames

| File                                                                                         | What is actually in it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildings-r3-final/0900-overview.png`                                                       | The street from 116 m, reframed (§0 row 6): brick terraces with blue-grey mansards down both sides, the clock tower, the ticket hall, the rotunda's terracotta cone and its **drum with arched openings in it**, the market hall's barrel vault, the teal guest-services pavilion, the grand pavilion closing the vista. Three fifths of the judged frame is still lawn.                                                                                                                                                                                                                                                                                                                                                  |
| `buildings-r3-final/0900-close.png`                                                          | The clock-tower block at 44 m. The gable end is solid brick with courses in it (round 1's hole, closed in round 2). Three dormers read as flat dark rectangles on the slope, which is still true and still weak. The rotunda's drum at the left edge now has a drum on it rather than a white polygon — checked at 4× (`_r3-crops/close-rotunda-4x.png`): one arched opening reads fully and two more as slivers, the facets there being almost edge-on to this camera, with the plinth course running under all of them.                                                                                                                                                                                                 |
| `buildings-r3-final/0900-ground.png`                                                         | Eye level. **The shopfront is the new thing**: a dark green fascia over a glazed two-light window on a stallriser, on the near two buildings of the west terrace — `g`, the bay the pattern language has had since round 1 with nothing using it. Brick courses, sashes with glazing bars, sills, string courses, quoins.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `buildings-r3-final/1830-overview.png`                                                       | Dusk from 116 m; lit windows scattered, four cupolas alight, the shop windows the brightest thing at street level, the sky holding red.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `buildings-r3-final/1830-close.png`                                                          | The best frame the module has, and unchanged in kind from round 2: warm panes at three or four brightnesses, three lit dormers, the tower lantern, the clock dial legible on the elevation a street visitor sees.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `buildings-r3-final/1830-ground.png`                                                         | The street at dusk. The two shopfronts on the left are lit sheets of amber at eye level — the one thing in the set that reads as a place that trades.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `buildings-r3-final/2300-overview.png`                                                       | Night. **The roofs read.** The mansards, the hipped roofs and the barrel vault sit as blue-grey slate against dark grass instead of dissolving into it (§4.14). The bright band at the lower right, checked at 4× (`_r3-crops/night-lamp-pool-4x.png`), is the east terrace's **shopfront**, not a lamp pool — a first-round caption would have called it a lamp and been wrong.                                                                                                                                                                                                                                                                                                                                          |
| `buildings-r3-final/2300-close.png`                                                          | Night on the clock tower: individually varied panes with glazing bars inside them, a warm wash on the brick around each, the lit clock face, the tower lantern, the rotunda's drum lit at the left edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `buildings-r3-final/2300-ground.png`                                                         | The receding street of lit windows with the shopfront glowing on the left, and the pavement in front of it lit — **in the standard frame, at the harness's default wait**, which no night frame of this module has had before (§4.13). How much of that light is the two real lamps and how much the spill decal is measured rather than eyeballed: A/B in "what the numbers say", and the answer is "less than it looks".                                                                                                                                                                                                                                                                                                |
| `buildings-r3-kit/1200-rot.png`                                                              | The rotunda from `rot`. **This is the caption the round-2 critic caught the report lying in, so it is written off the frame in front of me, at 3× where the words can be checked** (`_r3-crops/drum-wide-3x.png`): three facets face this camera and each carries one round-arched opening with a pale voussoir surround, a keystone at the crown and glazing bars behind it; below them a plinth course runs round the drum, above them a dark eaves band under the pantiles; then the conical terracotta roof and the glazed lantern with its finial. What the same camera drew on round 2's winding is `_r3-crops/drum-before-3x.png` — and, because it is still serving, `buildings-r3-prod/1200-rot.png` on `:3100`. |
| `_r3-crops/drum-before-3x.png`                                                               | The bug at 3×, and it is not a blank wall — it is a **see-through** one. You are looking through the near facets at the inside of the far side of the drum: its arches from behind as ghost lines, its floor, and the paving beyond. That is what "a featureless pale sheet" is at 1× from 30 m.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `_r3-crops/drum-after-3x.png`                                                                | The same crop with the ring wound the other way: plinth, arch, keystone, glazing bars, cornice, and each facet at its own angle to the sun.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `buildings-r3-kit/1200-facade.png`                                                           | Two metres from a terrace's **flank** wall in shade — the elevation a terrace shows its neighbour, so it is domestic sashes and not the shopfront. Bricks, mortar joints, sills, two string courses, glazing bars. The only frame in which any of those is more than a pixel, and the frame §5.4 is about: at 160 px/m the mortar joints are soft.                                                                                                                                                                                                                                                                                                                                                                        |
| `buildings-r3-kit/1200-inn.png`                                                              | The extensibility exhibit — the showcase pack's inn: the first floor oversailing the ground floor with its shadow under it, a wing swung 35° off the block, pantiles, three chimneys and two dormers in the roof. All of it JSON, and nothing in `lib/game/buildings` knows the pack exists. (Round 2's caption also named an oculus in the gable; this camera does not see that elevation, so it is not claimed here.)                                                                                                                                                                                                                                                                                                   |
| `buildings-r3-kit/1200-kit.png`                                                              | The west aisle of the kit row, three-quarters on: a brick wall, a plaster wall with an arched window, a stone column, a slate roof and a flat roof, standing on a clay-paver aisle with a grass verge. A merchant's yard rather than ten objects dropped on a lawn — and the first frame at this camera that is a picture of the pieces rather than of the promenade.                                                                                                                                                                                                                                                                                                                                                     |
| `buildings-r3-kit/1200-kit-east.png`                                                         | The east aisle. Also where §5.1 is visible: the Panorama window is a dark teal box and the Double door a flat brown leaf on a white frame, exactly as the round-2 critic wrote.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `buildings-r3-insp/1200-kit.png`                                                             | **Kept as the before.** The same camera with round 3's first attempt at the yard in it: a `plaza` laid over the promenade, the two surfaces coplanar and torn into each other down the middle of the frame. Crop: `_r3-crops/kit-yard-zfight.png` (§4.15).                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `buildings-r3-night/2300-ground-pool-{on,off}.png`                                           | The pooled-light A/B, and the frame that makes the honest version of finding 3 checkable: with the two lamps off the near paving band drops from mean 35.3 to 31.5 and everything past about fifteen metres moves by half a luma. See "what the numbers say".                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `buildings-r3-night/2300-overview-sky-{on,off}.png`                                          | The sky-term A/B. With it off, every roof in the frame is black and the street's silhouette dissolves — the round-2 critic's finding 4, reproduced on this build. With it on, the roofs are slate. The lawn is identical in both to the decimal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `buildings-r3-final/2300-ground.png` vs `buildings-r3-settled/2300-ground.png`               | The settle control. 1.2 s against 20 s: 32 pixels differ in the image, **0 of them in the scene**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `r2-park/1200-overview.png`, `r2-park/pad-grand-pavilion.png`, `r2-park/pad-ticket-hall.png` | Round 2's demo-park frames, unchanged and still accurate — the two pad buildings, their fit and their aprons. Nothing this round touched them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### What the numbers say

From a throwaway Playwright probe that reads `window.__parkfan_game.scene()` and the module's own
`stats()`, because `report.json` gives only whole-scene figures and a module's share cannot be read
out of it.

- **The budget figure is 128 draw calls at 09:00 `overview`, and it is what an A/B says.** Disabling
  `api.meshes()` in the running page takes the whole scene from **179 draw calls / 442,534
  triangles** to **51 / 67,146**, so this module is **128 draw calls and 375,388 triangles**, i.e.
  **10.7 % of the 1,200-call budget**. It was 120 / 330,958 / 10.0 % in round 2 over 23 buildings;
  the round added two street plots and one blueprint, and the eight calls are what those cost. The
  cascades are core's mechanism; the geometry going through them three more times is this module's,
  so it counts here. At 23:00 `ground` the same A/B reads **100 → 43, i.e. 57 calls** — night is
  cheaper because the shadow generator has no sun to run.
  _(dev server, probe reading `window.__parkfan_game.metrics()` either side of the toggle.)_
- **25 buildings → 22 batches → 62 drawn meshes**, in nineteen distinct types. Per type it is **1 to
  5**: kit (always), glass, lit windows, sign, spill ring. The five terrace-and-shop plots are two
  batches and five matrices, so a street of twenty would still be two.
- **98,092 triangles drawn, 80,360 unique.** The gap is what instancing buys: the same geometry drawn
  more than once.
- **441 windows, of which 254 are lit** after dark, out of one emissive material per colour, plus
  **25 light sites that a pool of two point lights draws from** at `medium` (`LIGHT_POOL` was 1 for
  three rounds — round-2 critique finding 3). `stats().activeLights` reads **2** at 23:00 in both the
  `overview` and the `ground` pose, 2.5 s after the camera is set.
- **The night frame is settled at the harness's default wait, and that is a control rather than a
  claim.** `buildings-r3-final/2300-ground.png` (`--wait=1200`, the gauntlet's own invocation) against
  `buildings-r3-settled/2300-ground.png` (`--wait=20000`): **32 pixels differ by more than 2 in any
  channel, 0 of them outside the HUD**, and the near-wall band (x 0–380, y 100–420, the left terrace)
  reads mean 69.7 / sd 80.4 / p5 12.6 in both. Round 2's pair at the same crop: 48.6 standard against
  68.7 settled (§4.13).
- **The two pooled lights are worth less than the frame suggests, and that is the honest version of
  finding 3.** At 23:00 `ground` the pool picks `buildings-spill-0` at (11.0, 4.29, 74.0), intensity
  9, range 9, and `buildings-spill-1` at (11.1, 4.53, 65.1), intensity 7, range 10 — both on the east
  terrace. Disabling both (`buildings-r3-night/2300-ground-pool-{on,off}.png`) lifts the near paving
  band (x 340–975, y 560–630) from **mean 31.5 to 35.3**, i.e. +12 %, and the mid-street band
  (x 430–760, y 420–500) from **36.9 to 38.5**, +4 %; the far end of the street, the east arcade and
  the west shopfront's own pavement all move by **0.4–0.6 luma**, which is nothing. So the pool is
  now settled, aimed and twice the size it was — and what a night street in this module actually
  looks like is still lit windows plus the additive spill decal, with two small pools of real light
  on the ground near whatever the camera is standing by. That is §5 items 5 and 6, and it is the
  reason they are still on the list after the round that fixed finding 3.
- **The sky term lifts the roofs and nothing else.** A/B'd by disabling the light alone at 23:00
  `overview` (`buildings-r3-night/2300-overview-sky-{on,off}.png`): a mansard slope at
  (560,440)–(680,500) goes **mean 26.4 → 35.9, p5 15.1 → 29.9**; the terrace's brick wall at
  (600,520)–(700,580) goes **49.6 → 58.4, p5 11.8 → 20.1**; the lawn at (40,250)–(230,560) reads
  **19.8 both ways, to the decimal** (§4.14).
- **The rotunda's drum, before and after the winding fix**, measured on the drum band (x 490–800,
  y 388–452) of `r3-drum-{before,after}/1200-rot.png`: **mean 130.6 → 88.7, p95 220.2 → 186.3, p5
  65.4 → 19.8**. The p95 reproduces the round-2 critic's 220.0 to 0.2. The sunlit paving beside it
  (x 845–935, y 330–360) reads **143.2 mean / 149.9 p95 in both frames, byte for byte** — the change
  is the rotunda's own geometry and nothing else in the frame moved.
  **And the obvious metric for "featureless" says the opposite, which is why it is written down
  here:** mean gradient magnitude over that band goes **11.65 → 9.43**, i.e. the broken drum had
  _more_ edge energy than the fixed one. It was never blank. It was see-through — the near facets
  were back-faces and culled, so the band was full of the far side's arches, its floor and the paving
  beyond, all of it high-frequency. "Featureless pale sheet" is what that looks like at 1× from 30 m,
  and `_r3-crops/drum-before-3x.png` is what it is.
- **Atlas: 386 ms**, sixteen tiles at 144² × three maps, on the main thread, **and only when the
  first building is placed** (§4.7). Build cost for all 25 buildings: **148 ms**.
- **Texture: 576 × 576 × 3 maps = 3.98 MB, about 5.3 MB with mipmaps** at `medium`; 768² and ~9.4 MB
  at `high`. One atlas for every building of every style in the park.
- **`overview` is 60.8 % lawn, down from 71.8 %.** Fraction of the frame outside the HUD panel, the
  top bar and the toast that classifies as grass (g > 1.12 r and g > 1.25 b), on
  `buildings-r3-final/0900-overview.png` against `critic-b2-dev/0900-overview.png`. The reframe and
  the two new east-side plots are worth eleven points and the frame is still three fifths grass
  (§5.3).
- **Sim tick 0.00 ms** on all nine shots; the soak harness's mean over 3,600 ticks with every module
  in it is 1.22 ms against a 6 ms budget, max 42.0.
- **Zero console errors, zero hydration warnings**, `ok: true`, nine shots, in
  `.game-render/buildings-r3-final/report.json`. The only two warnings are the `bufferSubData` pair
  that every scene in this game reports (`requests/buildings.md` §5).

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
→ **66,020/66,020 checks, ~2 s.** What it proves that a frame cannot:

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
- **Nothing in the catalogue is inside out — and what the check cannot reach is counted rather than
  claimed.** "winding" walks all **70,387** triangles of every blueprint, every kit piece and the
  synthetic pack and asserts each one against the vertex normal it was authored with: **0 inverted**.
  "outward faces" (§5d) takes **every upright triangle in the build** — `|ny| ≤ 0.35`, whatever it
  stands on — and asserts it looks out of a solid it stands on: **38,237 triangles over 8,897 m²
  judged, 0 m² facing in**. The reference for "which way is out" comes from the code that lays each
  solid down (`Surface.solids`, filled by `addBox`, `addPrism`, `addBand`, `addTube`, `boxLocal` and
  the mass itself), not from `blueprint.masses`, which is what round 2 got wrong.
  **The residue is a check of its own**: **248 triangles over 132.4 m² stand on no recorded solid at
  all — 1.6 % of the upright area — and a second assertion caps that at 2 %.** They are the pieces
  built from raw quads that stand clear of every volume: the fanned soffit inside an arch head, the
  slats in a louvre, the treads of a flight of steps. A kit piece that invents a solid out of
  `addQuad` makes that number rise and fails this line, instead of quietly widening the blind spot.
  Round 2's uncovered figure was **12,323 triangles over 2,650 m²** and nothing in the suite said so;
  the number came from the critic.
  **Verified by breaking it on purpose, twice, in scratch edits that were reverted** (§4.12): the
  critic's own demonstration (`roofs.ts`, dormer face quad's `back:` flag flipped, every dormer front
  in the catalogue pointing into its own roof) now answers **✗ 32 triangles, 16.2 m², named as
  `terrace-house` and `shop-terrace`** where round 2 answered `66000/66000 checks passed`; and
  round 2's own drum winding put back answers **✗ `rotunda: 475 triangles, 117.2 m²`**.
- **The declared `size` matches the geometry** for all eight blueprints within 8 %, apron and kerb
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
is a check with a hole in it, and the hole is where the bug lives.

**Round 2 wrote that sentence and then made the same mistake one layer down.** Its replacement §5d
had a category in it too — it judged only what stood on a mass's plan envelope — and the sentence
"no categories in them at all" is withdrawn (§0). §5d judges every upright triangle in the build now,
and the residue it cannot reach is a printed number under an assertion rather than a claim (§4.12).

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

### 4.12 The rotunda was inside out a second time, in a different subsystem, and the check that found it had to be widened first

**This is the round, so it is worth telling in the order it happened.**

The round-2 critic ranked the rotunda's drum as this module's worst frame — _"a featureless pale
sheet in which no render texture, no arch and no shading reads"_, p95 luma 220 against sunlit paving
at 155 — and ruled out the two obvious causes: disabling the rotunda's `:glass` mesh changed 0 scene
pixels, and 1,083 rays through the plan found 2 that missed the far side, 0.2 %. They could not say
what it was. Neither could I, from the source. The report's own frame caption said "an octagonal drum
with an arch on every facet"; the critic opened that file and found the white blob.

The same critic's other finding was that §5d judged only triangles standing within 0.1 m of a mass's
plan prism, and demonstrated the hole by turning every dormer front in the catalogue inward — the
class of bug that failed round 1, on a surface lit in three of nine frames — while the suite answered
`66000/66000 checks passed`. **Fixing that found the drum in the first run.**

The widened check takes its reference from the code that lays each solid down rather than from
`blueprint.masses`. `Surface.solids` is filled by `addBox`, `addPrism`, `addBand`, `addTube`,
`boxLocal`, the mass itself and — declared next to the quads, because it is the only place that knows
— the dormer box in `roofs.ts`. Two consequences beyond the dormers: a kit piece nobody has written
yet is covered by being built out of those primitives, and **a drum is recorded as the polygon it is
drawn as, not as the circle its `size` names.** That second one is the whole thing: an octagon's
facet stands **0.61 m inside its own circumradius at the midpoint**, so under round 2's cylinder
envelope all eight facets of every round mass fell outside the 0.1 m band and were judged by nothing.

The first run of the widened check printed `parkfan-architecture:rotunda: 475 triangles, 117.2 m²`.

`roundFrames` walked its ring by **increasing** angle, so `right` ran the other way and `right × up`
pointed at the middle of the drum. Every wall panel, every reveal, every arch and every bay of every
round mass was built inside out, and `framePoint`'s `out` recessed where it should have projected.
What that draws is not a hole: with the near facets culled you see the drum's own far side, lit from
within, with all its modelling on the other face — arches as ghost lines, the floor, the paving
beyond. `_r3-crops/drum-before-3x.png` is that, and `-after-3x.png` is a plinth course, a round-arched
opening with a voussoir surround and glazing bars, and a cornice.

**The same building had already been inside out once, in §4.1, and that was a different bug.** §4.1
was `addPrism`'s own facets — the drum's _geometry_. This is `roundFrames` — the _facades_ built onto
those facets, one subsystem up. Neither of the two checks written after §4.1 could see it: §5b
measures roof planes and a drum's wall is not one; §5c compares each triangle against the normal it
was authored with, and `addQuad` derives the normal **from** the winding, so an inside-out facade
panel is a perfectly self-consistent triangle. It took a check that asks the third question — which
way is out relative to the SOLID — asked of every upright triangle rather than of a category.

**Both halves were verified by hand this round, in scratch edits that were then reverted.**

| put back                                                                                                                                      | what the suite does                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the critic's demonstration: `roofs.ts` dormer face quad, `back:` flag flipped, every dormer front in the catalogue pointing into its own roof | **RED**: `✗ nothing standing on a solid faces into it — 32 triangles, 16.2 m²`, named per blueprint (`terrace-house` 16 / 8.1 m², `shop-terrace` 16 / 8.1 m²). Round 2: `66000/66000 checks passed`. |
| round 2's `roundFrames` ring order                                                                                                            | **RED**: `✗ … 475 triangles, 117.2 m²`, `parkfan-architecture:rotunda`                                                                                                                               |

Both edits were reverted and the tree checked back to `git diff --stat` empty on those two files
before anything else in this round was measured. **The widening is not cosmetic**, and if it had
been, that would have been this round's finding instead.

### 4.13 Every night frame of this module for three rounds was a frame of the wrong thing

The critic read the pool straight off the running page at 23:00 `ground`: 0 active lights after
1.2 s, 1 after 4 s picking a cupola 100 m away, and the wall lantern only after about **ten seconds**
of wall clock under SwiftShader. `game-shot.mjs` waits 1.2 s. The near-wall band of the standard
frame measured mean luma 39.3 against 54.4 settled — **28 % darker than what a player sees** — and
round 2's own report says as much about itself in a paragraph, which is not the same as fixing it.

Two things were wrong and only one of them is the harness's.

**The pool is too small.** `LIGHT_POOL.medium` was **1**, against the 24 light sites the critic
counted in this showcase (25 now, with two more plots on the street). It is **2** now (`high` 3,
`ultra` 4). The ceiling is real and it is worth writing down: `kit` and
`glass` carry `maxSimultaneousLights = 6` and the sun is one of them, so four is as far as this can
go without a shader permutation nobody has measured.

**And the pool only re-sorted on a clock.** `POOL_INTERVAL` is 0.45 s of `onRender(dt)`, and under
software GL at 0.5–0.9 fps that is one or two frames — so the lamp it had picked was the lamp for
wherever the camera stood _before_. A camera that has jumped 40 m has not moved a bit; it is
somewhere else. `POOL_JUMP` (4 m) re-sorts at once when the camera has moved further than that,
which is the harness's `setCamera` between shots and, in the game, any jump to a camera preset.

The proof is a control, not an argument: the gauntlet's own 23:00 `ground` frame at `--wait=1200`
against the same shot at `--wait=20000` **differs in 32 pixels, all of them the animated HUD clock,
and in 0 pixels of the scene**; the near-wall crop reads mean 69.7 / sd 80.4 / p5 12.6 in both.
`stats().activeLights` reads 2 at 23:00 in both camera poses, 2.5 s in. **No extra `--wait` is
needed and none is used in the invocation at the head of §3.**

### 4.14 The night roofscape was black, and an emissive would have repainted the whole street

Round 2 fixed the roofs for daylight (`#454b54 → #6f7783`) and only for daylight; after dark the
mansards, the barrel vault and the pyramids were indistinguishable from the grass, which is the
largest surface in every overview frame and the one the street's silhouette is made of.
`buildings-r3-night/2300-overview-sky-off.png` is that frame on this build.

**The first attempt was a small emissive on the `kit` material and it was wrong in a way worth
recording**: one material draws walls and roof alike, so it lifted the roof _and_ the wall together —
the whole street milky, the facade's own range gone with it. (That attempt was measured in the
session before the container restart, on the `overview` framing this round then replaced, so its
figures are not reproducible against anything in `.game-render/` today and are deliberately not
quoted here; what survives is the reason, and the reason is structural.) The fix has to be
**directional**, because the thing being modelled is the sky: a `HemisphericLight` pointing up,
`groundColor` black, so an up-facing slate takes it and a vertical brick wall barely does — which is
what the A/B below measures on the shipped build.

`includedOnlyMeshes` scopes it to this module's meshes, because the terrain, the paths and the rides
have their own modules and their own opinion about the night — and that is measured, not asserted:
across the A/B the lawn reads **19.8 both ways, to the decimal**, while a mansard slope goes
26.4 → 35.9 (p5 15.1 → 29.9) and a brick wall 49.6 → 58.4 (p5 11.8 → 20.1). Intensity is 0.10 at full
dark, faded in with `night`; at 0.22 the roof reached a moonlit slate reading brighter than the lit
windows on the floor below it.

### 4.15 The kit yard laid a second paved surface over the promenade, and a plaza does not clip a path

Round 1's finding 11 — _"kit pieces are ten slabs on a lawn"_ — was open for three rounds. The first
attempt at closing it was one `plaza` from [-13.5, -9] to [13.5, 29] under the whole row, which is
the shape the eye wants and lays a second surface straight over the 10 m promenade running up the
middle of it. `buildings-r3-insp/1200-kit.png` came back with the promenade's grey slabs and the
yard's clay pavers **torn into each other in interleaved patches down the centre of the frame**, two
coplanar surfaces fighting for the depth buffer (`_r3-crops/kit-yard-zfight.png`, 2.5×).

`paths/layout.ts` has a `plazaClip` and it did not fire here; path against path clips correctly,
which is why the 6 m cross walk has run through the promenade since round 2 with no seam. Rather than
reach into another module's clipping to find out why, the yard is **two `path` aisles** flanking the
promenade, 6 m each, one under each row of 4 m pieces standing on their centreline at x = ±8.5, with
0.5 m of grass either side of the promenade's kerb. It stays out of the depth fight instead of trying
to win it, and it is content: `showcase.ts`, no `buildings` code.

**And the `kit` camera was photographing the street.** With a row on each side of a 10 m promenade, a
camera on the centreline looking north puts paving through the middle of the frame and five of the
ten pieces outside it — which is what that preset has produced for three rounds, the round-2 critic's
finding 6 in miniature. There are two presets now, `kit` and `kit-east`, each looking along one aisle
from 20° off its axis so the near piece is three-quarters on and the four behind it step back in the
same pose. It took four attempts, and the reason is in the report because it will save the next
person the same four: `bearing` puts the camera at `target + d·(−sin b, ·, cos b)`, so the sign is
the opposite of the one you assume, and getting it wrong once parked the camera inside a kit piece
and once inside the market hall.

## 5. What is weak, ranked

Round 3. Of the round-2 critique's ten findings, seven are closed and photographed (§0), one is
partly closed and two are open below. Four of the entries here are this module's own and are in no
critique.

1. **The kit row is still a display row, and that is round 1's finding 11 open for three rounds.**
   It stands on a paved aisle now instead of grass and it has two cameras of its own instead of a
   frame of the promenade (§4.15), so the pieces can at last be judged — and judged, two of them
   fail: in `buildings-r3-kit/1200-kit-east.png` the **Panorama window is a dark teal box** and the
   **Double door a flat brown leaf on a white frame**. The round-2 critic called them the last place
   in the set that reads as programmer art and put it at half an hour of `showcase.ts`. It is not
   half an hour — a door leaf wants panels, a stile and a rail, and a panorama window wants mullions
   and something behind the glass — but it is `kit.ts` content and no new architecture.
2. **The dormers read as flat dark rectangles on the slope.** `buildings-r3-final/0900-close.png`, at
   44 m: three dormers on the clock tower's roof and each is a dark quad. They have cheeks, a face, a
   pitched cap and a window, and none of it separates at that distance because the face is in shade
   and nothing outlines it. A dormer wants a cheek in a lighter tone, or a bargeboard, or a sill that
   catches the sun. The geometry is there; the reading is not.
3. **`overview` is 60.8 % lawn.** Reframing and moving two plots to the east side bought eleven
   points (71.8 % in round 2), and the frame is still three fifths grass with the buildings in a band
   across the middle. The street is 34 m wide and 110 m long and the preset has to see all of it;
   what would actually fix it is more content on the west side, not another camera angle.
4. **The atlas is 160 px/m at the preset the harness runs.** A 0.9 m brick tile at 144 px against the
   art bible's 256 for mid-ground; `high` is 213 and `ultra` 249. `buildings-r3-kit/1200-facade.png`
   is where it shows — at two metres the mortar joints are soft. Raising it costs boot time and
   memory linearly, and the honest fix is generating the atlas off the main thread, which is a
   `Worker` this module does not have.
5. **The night spill is a decal, and its strength is a number chosen by looking.** Eight quads of
   vertex-coloured falloff on a flat wall: it does not turn a corner, it does not fall on the ground
   under a window, it does not know the wall's normal, and a reveal's own soffit gets nothing. Its
   peak, 0.72, is defensible in the frames it was measured in and has no physical argument behind it.
   The right answer is one real light per lit facade, and this module now has **two**.
6. **The pool is 2 and the ceiling is 4.** `maxSimultaneousLights = 6` on `kit` and `glass` with the
   sun taking one is the wall; past that is a shader permutation nobody in this project has measured.
   Twenty-five light sites still share two lamps, so what a night street mostly has is the decal
   above, and the two real lights are for whatever the camera is standing next to. Measured: turning
   both off costs the near paving **3.8 luma of 35.3** and everything past about fifteen metres
   **half a luma** — the honest size of what finding 3 bought, and the reason this entry survived the
   round that closed it.
7. **The buildings have no interiors and the doors do not open.** Every opening is backed by a flat
   dark quad 70 mm behind the glass. It reads correctly from outside at every camera the game uses,
   and it will read as a lie the first time one goes through a door.
8. **`round` masses only take polygons, and there is no dome.** A rotunda is an octagon and a cone; a
   real one is a cylinder and a hemisphere. The eight roof forms have no dome, no gambrel, no
   sawtooth, no bell-cast mansard. Each is a `roofs.ts` function and a schema line, but a pack cannot
   add one.
9. **§5d's residue is 132.4 m² and its limitation is coincident envelopes.** 248 upright triangles
   stand on no recorded solid — arch soffits, louvre slats, stair treads, all built from raw quads —
   and they are counted, printed and capped at 2 % rather than skipped in silence. Separately, where
   two masses' plan boundaries land on the same plane a correct outward face of one is on the
   envelope of the other and the check cannot say which it belongs to; the selftest's own watermill
   fixture was moved 2 m off the coincidence rather than the tolerance being widened.
10. **The `flat` roof form still measures 62 % of its area facing up** in §5b's roof check. That is a
    closed parapet box with a real underside rather than a bug, but it means one check is looser for
    that form than I would like.
11. **The `sim` has an empty tick, and a building still costs nothing and does nothing.** It indexes
    footprints and doors and that is all: no upkeep, no power draw, no capacity, nothing a guest can
    enter. Nothing calls it yet either — `guests` and `paths` do not know it is there.
12. **Nothing checks a frame, and three rounds of findings have been frame-only.** `selftest.mjs`
    walks 70,387 triangles and could not see a material ignoring its own fade, a mesh in the wrong
    rendering group, a light pool that had not settled, or two coplanar paved surfaces tearing into
    each other. Every one of those was found by opening a PNG. A cheap version exists — shoot two
    frames and assert what does and does not move between them — but it needs a browser, so it
    belongs with `game:bundle` and `game:teardown` rather than in the self-test. **This is the
    largest structural gap the module has.** The round-2 critique's instruction — widen §5d before
    doing anything else — was worth following literally for that reason, and it paid this round:
    §4.12 is a defect three rounds of frames and two rounds of checks had missed, found in the first
    run after the check stopped exempting a category.
13. **The showcase street is enclosed enough that inspection cameras get blocked.** The east side is
    behind the terrace from every western viewpoint; the showcase pack's inn had to be moved to its
    own plot to be photographable at all, and this round's first `kit-east` attempt parked the camera
    inside the market hall.
14. **Two atlas slots are nearly unused.** `canvas` and `copper` were added to fill a 4 × 4 grid and
    nothing in the shipped pack names them. They cost about 12 % of the atlas generation time to
    produce a surface no frame in this report contains.
15. **The aprons are hard-edged paving mats.** Every isolated building sits on a rectangle or polygon
    of paving that meets the lawn on a straight line with a 0.15 m kerb and nothing else. At overview
    they read as coloured shadows under the buildings. It is content (`ground.apron`), and a verge or
    a gravel margin would break the line.

## 6. Requests

`docs/game/requests/buildings.md`: the two demo-park calls with their measured fit, now placed (§1),
the `package.json` line for the self-test (§2), the `Registry.name` finding (§3), a core teardown
error that is not a leak (§4), the two harness warnings that belong to nobody (§5), the unchecked
`buildings[].size` promise (§6), why i18n has nothing to do yet (§7), and the two lines in
`SimRuntime.createModules` that let a module own an entity kind without a sim (§8) — the one that
turned `pnpm test:game` red for everybody and cost a whole file to work around.

Round 3 adds two, neither blocking: **§9**, a `paths` plaza that does not clip a path crossing it,
which is §4.15's finding written up for the module that owns the mechanism rather than worked around
in silence; and **§10**, a `--hud=0` for the harness, because every gauntlet frame in this project
spends a quarter of its width on a panel and this module's `overview` was re-aimed around it.
