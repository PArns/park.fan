# pools — builder report

`lib/game/pools/` · showcase `/game?showcase=pools` · 17 TypeScript files, 5,565 lines, plus a
655-line self-test of 80 checks. Entity kind `pool`. Nothing outside the folder was touched except this file and
`docs/game/requests/pools.md`.

---

## 1. What exists

A pool is a **basin plan**, a **depth profile**, a **tile style** and an **edge treatment**, and all
four are manifest entries. On top of that: coping, a deck with its furniture, steps and handrails,
underwater niche lighting, and a water surface with a caustic net on the tile under it.

### The files

| File            | What is in it                                                                                |
| --------------- | -------------------------------------------------------------------------------------------- |
| `index.ts`      | The `GameModule`. Worker-safe: Babylon only through `await import('./main')`.                |
| `types.ts`      | The vocabulary — every field a manifest can set.                                             |
| `manifest.ts`   | The `pools` pack category, the zod schemas, and the built-in catalogue **as manifest JSON**. |
| `geom.ts`       | Outlines, depth profiles, areas, volumes, the local/world frame. Pure, node-runnable.        |
| `build.ts`      | The basin in vertices: floor, wall, waterline, coping, deck, steps, rails, light niches.     |
| `surfaces.ts`   | The vertex sink, and the winding rule (§4.1).                                                |
| `furniture.ts`  | Six deck items: lounger, parasol, lifebuoy post, towel box, planter, ladder.                 |
| `textures.ts`   | Every surface map, generated at boot: nine patterns, plus caustics and two ripple normals.   |
| `materials.ts`  | PBR materials per tile style and per edge treatment, and the day/night pass.                 |
| `water-mesh.ts` | The water surface, pure arrays (so the self-test can measure what is dry).                   |
| `water.ts`      | The water material and the splash rings.                                                     |
| `excavate.ts`   | Cutting the basin out of the heightfield.                                                    |
| `resolve.ts`    | Entity + manifest → `ResolvedPool`, shared by both threads.                                  |
| `entity.ts`     | `makePoolEntity` — how `demo-park` places one without a renderer.                            |
| `main.ts`       | The renderer: merge, night rig, queries, the public API.                                     |
| `sim.ts`        | Temperature, clarity, bathers, the water bill, the excavation command, the save.             |
| `showcase.ts`   | Eleven basins and a runtime-registered content pack.                                         |
| `selftest.mjs`  | 80 checks.                                                                                   |

### The content vocabulary

A pack's `pools` key holds four arrays. Nothing in this module switches on a pool id — it switches
on an algorithm, which is the line `rides` draws at its eleven shapes:

- **`shapes`** — `outline` is one of `rect`, `ellipse`, `stadium`, `lobed` (a lagoon), `polygon`
  (an explicit plan in unit space, resampled to `segments` so a six-corner plan still gets a usable
  grid). `depth.profile` is one of `flat`, `slope`, `dish`, `beach` (zero entry), `channel` (a lazy
  river or a slide run-out). Plus `entry`, `entryYaw`, `role`, `deckDensity`, `water` (m³/h) and
  `cost`.
- **`tiles`** — `pattern` is `mosaic` | `ceramic` | `slate` | `pebble` | `lanes`, with `tileMetres`,
  a colour list (a tile picks one by a hash of its own cell), `grout`, the `waterline` band colour,
  `roughness`, `relief`, `glaze`, the water body's tint and the colour and strength of that pool's
  underwater lamps.
- **`edges`** — `coping` is `rolled` | `square` | `deck-level` | `none`, `deck` is `concrete` |
  `timber` | `stone` | `sand` | `none`, with widths, colours and whether it carries handrails.
- **`deck`** — a furniture `shape`, a weight, a clearance and a palette.

Six basins, six tile styles, four edge treatments and five deck items ship built in — written as
the JSON a pack would carry and run through `registerPools()`, the very function a pack goes
through, so a pack can express anything the built-ins can and a pack that redefines `lagoon`
overwrites it by id.

### Public API

`ctx.module<PoolsMainApi>('pools')` (from `@/lib/game/pools/main`):

```ts
catalogue(): PoolShapeSpec[];        tiles(): PoolTileSpec[];   edges(): PoolEdgeSpec[];
registerContent(packId, block): number;      // a manifest fragment at runtime
create(spec: PoolSpec): string;              remove(id: string): void;
pools(): ResolvedPool[];                     pool(id): ResolvedPool | undefined;
poolAt(x, z): string | null;                 // the water, not the deck
depthAt(x, z): number;                       // metres over that point, 0 outside
waterYAt(x, z): number | null;               // world Y of the surface
splashdown(id?): { id, x, y, z, depth } | null;
splash(x, z, strength?): boolean;            // rings on the surface
meshes(): AbstractMesh[];  focus(id);  stats(): PoolMeshStats;
```

`ctx.module<PoolsSimApi>('pools')` on the worker mirrors the queries and adds `capacity(id)`,
`state(id)`, `enter(id)`, `leave(id)` and `stats()`.

Pure exports from `@/lib/game/pools` (worker-safe, Babylon-free): `makePoolEntity`, `resolvePool`,
`poolShape`/`poolTile`/`poolEdge` and the whole catalogue, `attachPoolContent`, `buildPool`,
`buildWaterMesh`, `excavatePool`, `outlinePoints`, `depthAtUnit`, `poolVolume`, `toLocal`/`toWorld`.

### Owned state, commands, events

- Entity kind **`pool`**; `entity.data` is `PoolEntityData` (shape, tile, edge, size, depth,
  freeboard, role, heated, deckDensity, `splashdownFor`).
- `world.modules.pools` — per-pool `{ temperatureC, clarity, swimmers, levelOffset }`, written by
  the worker only, serialised in sorted key order and rounded so the round trip is exact.
- Commands: `pools:excavate`, `pools:heat`, `pools:level`.
- Events: `pools:changed { id, type }`.
- Frame stats: `pools.count`, `pools.waterM3`, `pools.swimmers`, `pools.capacity`.

---

## 2. What `flumes` needs, and it is all here

`flumes` depends on this module and will read this section and nothing else.

**Landing a slide.** `splashdown()` with no argument returns the deepest point of the deepest pool
whose `role` is `splashdown`, in world metres, with the depth there:

```ts
const pools = ctx.module<PoolsMainApi>('pools');
const land = pools?.splashdown(); // { id, x, y, z, depth } — y is the WATER surface
```

Pass an id to ask about one basin. The built-in `runout-lane` is the shape for it: a `channel`
profile, 0.55 m at the banks and 1.0 m down the centreline, 8 × 18 m by default, `deck-level-grate`
edge. It takes a size override, so a wide raft slide's run-out is
`create({ shape: 'runout-lane', size: [12, 22], ... })`.

**Making one.** A flume that wants its own basin creates it and records the link:

```ts
const id = pools.create({
  shape: 'runout-lane',
  x,
  z,
  yaw,
  size: [10, 20],
  depth: 1.1,
  splashdownFor: flumeEntityId, // stored on the entity; nothing else reads it
});
```

`create` dispatches `entity:add`, so the basin is world state and survives a save. It also digs its
own hole in the heightfield (§4.2), so the flume does not have to sculpt anything.

**Is this point in a pool.** `poolAt(x, z)` → the id or `null`; `depthAt(x, z)` → metres of water
over the point, 0 outside; `waterYAt(x, z)` → the world Y of the surface, or `null`. All three are
about the **water**, not the deck, and all three answer correctly over a zero-entry beach shelf
(the shelf is dry tile and reports 0). The same three exist on the sim side, so a rider's landing
can be validated in the worker rather than on the main thread.

**The splash.** `splash(x, z, strength)` puts an expanding ring on the surface at that point and
returns `false` if the point is not in a pool. Eight rings are pooled and reused; nothing allocates
after boot. `strength` is 0.2–3 and scales the final radius (0.4 m → about 11 m at 3).

**What is deliberately NOT here.** No spray particles (that is `effects`), no rider physics, no
water-level animation from an arriving raft. A flume that wants the surface to react beyond a ring
should ask for it rather than reach into this module's meshes.

---

## 3. What I verified, and what I actually saw

Every PNG below was opened and looked at. `--showcase=pools` at three times of day × three cameras,
1280 × 720, WebGL2 through SwiftShader, `medium` preset (the harness machine).

### The frames

| File                                | What is in it                                                                                                                                                                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pools-final/0900-close.png`        | The lagoon in morning light: a pale zero-entry shelf at the near end going to deep blue at the far one, a stone deck ring with slab joints and a 1.5 % fall, loungers, a red lifebuoy post, handrails at the steps. It reads as a lido.                                                      |
| `pools-final/1830-close.png`        | The same at dusk with the niche lamps just lit — the caustic net has taken over from the sun and the deck is going blue.                                                                                                                                                                     |
| `pools-final/2300-close.png`        | Night: the lagoon is a cyan shape with a moving caustic net on the floor, the plunge pool glows on its timber deck behind it, and the deck around both carries the spill.                                                                                                                    |
| `pools-final/1830-ground.png`       | The lap pool from the deck: lane lines on the floor, the waterline band on the wall, six niche lamps as bright points, a lounger and two planters on the stone paving.                                                                                                                       |
| `pools-final/2300-ground.png`       | The same at night. The one frame that shows the underwater lighting doing its job.                                                                                                                                                                                                           |
| `pools-final/0900-overview.png`     | The whole lido from 400 m: eleven basins spread over about 200 m. Small in frame — see §5.9.                                                                                                                                                                                                 |
| `pools-final/2300-overview.png`     | The same at night, and the one frame that shows the lamp colour is content: the terrace pool glows amber (`#ffcf8a`, from the showcase pack), the whirlpool orange, the rest cyan — all from their own tile styles, all readable at 400 m.                                                   |
| `pools-demo-park/1200-overview.png` | The demo park, as a regression check. Boots clean (**0 errors, 0 warnings**, 141 draw calls, 519,770 triangles) and the reserved `water-park` pad at (112, 50) is **empty ground** — this module may not edit `lib/game/demo-park/`, so the exact call to fill it is `requests/pools.md` §4. |

### What the numbers say

Measured by asking the running scene rather than by counting source — a throwaway Playwright probe
that reads `window.__parkfan_game.scene()` and sums the meshes, materials and textures whose names
start with `pool-`. (The harness's own `report.json` gives only whole-scene figures, so a module's
share of a frame cannot be read out of it.)

- **Eleven basins → 40 meshes, of which 32 are drawn** (the other eight are the idle splash rings)
  **— 43,096 triangles, 31,507 vertices.** Every pool in the park is merged into one mesh per
  material, so the count follows how many LOOKS a park has and not how many basins: tile, coping,
  deck, water and glow per style/edge, plus three shared (`metal`, `fabric`, `timber`) however many
  pools there are. The wall shares the floor's mesh unless the tile style has lane markings.
- **Draw calls in the frame: 117 at `overview`, 73 at `close`, 50 at `ground`** — the whole scene,
  of which this module is **32**. Against the game's 1,200 budget that is **2.7 %** for a water park
  with eleven basins in six tile styles and five edge treatments; the demo park's reserved plot wants
  three basins in one or two looks, which is about eight.
- **Triangles: 43,096 for the module** against 109,036 in the whole `overview` frame. The biggest
  single mesh is `pool-metal` at 3,432 — the handrails, ladders, lounger frames and parasol poles of
  eleven pools, in one draw call.
- **32 materials, 51 textures**: 21 at 288², 15 at 202², 12 at 173², two 256² ripple normals and one
  160² caustic map — about **11 MB** before mipmaps. That is the honest cost of six tile styles ×
  (albedo, normal, ORM) plus coping and deck per edge treatment. A park with two looks pays about
  fifteen textures.
- **Sim tick: 0.00 ms** reported at every shot, against the 6 ms budget for all modules. The sim
  does four floating-point integrations per pool per tick and nothing else.
- **Boot: 16.4 s** in the final run against **8.5 s** for the `--showcase=terrain` control — but that
  run had two other agents' renders on the same box, and an earlier uncontended run of the same tree
  booted in 8.4 s. What is real is that seventeen texture sets are generated on the main thread
  before the first frame, and at the first sizes that was enough to trip the host's 8 s worker-ready
  timeout and raise "the simulation did not start" **while the worker was running perfectly well
  behind it** (`metrics().tick` was 199 and `failedModules` empty). Halving the caustic generator's
  work and trimming the map sizes cleared it.
- **Zero console errors, zero hydration warnings** in `pools-final/report.json` (`ok: true`).
- **`pnpm test:game` green**, including the 48-park-hour soak (mean 2.78 ms/tick).

### Two warnings that are not this module's

`report.json` carries two `WebGL: INVALID_VALUE: bufferSubData: buffer overflow` warnings. They are
in `.game-render/control-terrain/report.json` too, taken as a control against `--showcase=terrain`
with no pools loaded at all. Not mine, and named here so a critic does not have to find that out.

Earlier runs also carried two page **errors** — `Failed to execute 'measure' on 'Performance'` and
`Should not already be working` — which are the `Registry.name` shadowing bug written up in
`requests/pools.md` §2. They appear in the terrain control identically and they are **intermittent**:
`pools-r1` and `pools-r2` have them, `pools-r3` and `pools-final` do not, on the same tree. That is
worth a critic knowing, because it means the "zero console errors" hard gate can pass or fail on one
commit depending on the run.

### The self-test

`node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/pools/selftest.mjs`
→ **80/80 checks, ~1.4 s.** What it proves that a frame cannot:

- 20,504 triangles across the whole catalogue, **0 reversed** against the scene's winding rule.
- The excavation clears the tile at **310 interior sample points** of a rotated lagoon, worst
  clearance **0.90 m**, and running it a second time moves **0 samples**.
- A pack registered before `attachPoolContent` and one registered after both land; a deliberately
  broken entry beside a good one is named and skipped and the good one survives.
- The same input builds byte-identical geometry and the same deck; a different seed does not.
- The lagoon's water surface is **353 m² of a 400 m² plan — 12 % dry shelf**, and the same plan with
  a flat floor is wet corner to corner.
- Volume by integration is 370 m³ where the naive half-box says 340, **8 % out**, and the 32-step
  integration agrees with a 128-step one to under 2 %.
- Four pools in a `SimRuntime`: 1,033 m³, 37 m³/h, 258 bathers; a whirlpool reaches 36 °C over six
  park hours and an unheated lagoon does not; `serializeWorld` twice is byte-identical.
- Core no longer lists `pools` in `unclaimedPackKeys()` — the category is claimed, so a typo in a
  manifest (`poolz`) is a line in the console rather than a silently empty catalogue.

`pnpm test:game` is green end to end (save round-trip, registry, lint over 249 files, i18n, track,
paths, shops, camera, tools, trains, rides, and the 48-park-hour soak at mean 2.78 ms/tick).

---

## 4. What went wrong, and what the fix was

Four of these were found by looking at a picture or by a check, not by reading the code.

### 4.1 The first render had no paving in it at all, and nothing said so

`FRONT_FACE_SIGN = -1` in this scene: a front-facing triangle's `cross(v1 − v0, v2 − v0)` points
**away** from the visible side. `paths/mesh.ts` and `terrain/chunks.ts` both carry that note, both
after paying for it. Every ring in this module — the floor, the coping, the deck — came out with the
opposite winding to the wall, so about 4,300 deck triangles faced the ground and were back-face
culled. The geometry was in the scene with the right vertex count and there was no error anywhere:
`pools-probe1/1200-ground.png` is a pool sunk in a grass trench with no deck of any kind around it,
and it took a frame to notice because the excavation ramp underneath looked like a design choice.

The fix is not "reverse those four loops". `SurfaceBuilder.tri` now **derives the winding from the
vertex normals** every builder already writes for the shading, so a call site cannot get it wrong.
The self-test walks all 20,504 triangles of the catalogue and asserts it.

### 4.2 A basin under a heightfield is invisible, and the pit is not a box

A heightfield is a surface, so the ground spans the pool's plan at grade and hides everything under
it. The park samples every **2 m**, and a point just inside the wall is interpolated from samples up
to 2 m away — so a hard-edged pit leaves the ground poking back through the tile near the edge, and
a pit dug three metres wider puts the rim outside the deck and gives every pool a visible trench.

What works is a ramp measured against the deck: full pit depth to 1.6 m past the wall, back to grade
by the deck's outer edge, so the whole transition is under something opaque. The deck's outer skirt
is `maxDepth + 1.6` deep for the same reason. Worst clearance under the tile, measured at 310 points
of a rotated lagoon: **0.90 m**.

It also has to be **idempotent**, because the renderer digs its own copy of the world at boot and the
`pools:excavate` command digs the worker's afterwards. The first version read the current height as
its grade reference, so a second application treated the pit as the new grade and sank the ramp
another metre — 42 samples moved on an identical second call, which the self-test caught and no
screenshot would have.

### 4.3 The deck laid exactly on grade, and the water was above the beach

Two measurements from `pools-probe2`:

- The deck ring at y = 0 z-fought the turf along its entire outer edge. It stands `DECK_LIFT` = 50 mm
  proud now, with the skirt hiding what is under it.
- **A zero-entry beach that stops at depth zero is under water.** The coping stands a deck-fall plus
  the lift above grade and the water sits a freeboard below the coping, which put the shelf 28 mm
  under the surface: **3 % of the lagoon's plan was dry** where a quarter of it should have been. The
  `beach` profile now starts 120 mm PROUD of the pool's grade — bounded by the coping, so the apron
  never becomes a step out of the pool — and crosses the water line at 45 % of the shelf. Measured
  after: **12 % dry**, about 2.2 m of tile you can stand on.

### 4.4 Lane lines up the wall, and a white hole where a lamp should be

Both found by looking:

- `pools-r1/1830-ground.png`: the competition pool's lane markings, drawn on the wall's arclength,
  came out as a dark vertical band every 2.5 m all the way round the basin. A lane line is painted on
  a floor. The wall has its own material now (`materials.tileWall`), identical to the floor's for
  every pattern but `lanes` — and where the two materials are the same, so is the mesh, so it costs
  nothing on ten of the eleven basins.
- `pools-r3/2300-ground.png`: with the pooled point light a quarter of a metre under the surface and
  a lumen scale of 5, the near end of the lap pool was a blown white hole and the **grass in front of
  it carried a specular streak from a light that is under water**. A point light 300 mm from tile is
  an inverse-square blowout. It is 1.3 m off the wall and 0.55 m down now, at scale 2.2.

### 4.5 The caustics were camouflage

At an emissive of 0.34 over a mosaic whose five blues differed by a lot, the net stopped reading as
light on tile and started reading as mottled paint — the two were fighting for the same frequency
band. The palette is tighter (five blues within about 15 %), the per-chip tint is 0.14 rather than
0.22, and the day emissive is 0.20. Compare `pools-probe2/1200-close.png` with
`pools-final/0900-close.png`.

---

## 5. What is weak, ranked and honest

1. **The caustic net is uniform.** It is one scrolling texture at one strength over the whole basin,
   so at night the light is as bright twelve metres from a lamp as it is beside it. Real underwater
   lighting falls off, and the frame would gain more from that than from anything else on this list.
   The fix is a per-vertex attenuation term from the niche positions, baked into the floor's vertex
   colour at build time — but vertex colour multiplies **albedo** in Babylon's PBR and not emissive,
   so it needs either a material plugin or a second emissive-masked surface. Not attempted.
2. **Caustics also appear on the dry part of the wall**, above the waterline, and on a zero-entry
   shelf. The band is small (30–120 mm of wall on most edges) and I judged it below the cost of a
   third material per style. It is visible if you look for it in `1830-ground.png`.
3. **No refraction and no reflection probe.** What is here is the depth-tinted alpha over a real
   tiled floor plus a two-layer animated normal and `useRadianceOverAlpha`, which is the cheap
   approximation the brief allows. A `RefractionTexture` is a full scene re-render per pool per
   frame to bend a floor that is already drawn in focus 1.5 m down; I did not measure it because I
   did not build it, and that is the honest statement.
4. **A horseshoe pool cannot be drawn.** The polar grid needs a plan that is star-shaped about its
   centroid. Every generator here respects that (`lobed` clamps its lobe depth at 0.45 of the
   radius) and an explicit `polygon` that is not is **warned about by name** rather than drawn inside
   out — but a pack that wants a doughnut has to build it as two pools. A general triangulator would
   remove the limit; this module does not have one.
5. **The deck ring follows the basin's plan and cannot be edited.** A real lido's paving is a shape
   somebody drew, and here it is always the pool's outline offset outward by a manifest width. Two
   pools 4 m apart get two decks with a strip of grass between them rather than one terrace.
6. **No LOD.** 43 k triangles for eleven basins is affordable and none of it goes away at distance.
   The niche geometry and the deck furniture are the obvious first cut.
7. **Nothing swims.** `capacity`, `enter`, `leave` and the `swimmers` count exist and are tested, and
   no guest has ever used them, because the guests module has no swimming behaviour. The temperature
   and clarity integrations have therefore only been exercised at zero load.
8. **Boot cost.** Eleven basins in six tile styles generate 51 textures on the first frame. It is a
   one-off and the harness boots in 8–17 s, but a park that uses every style at once pays it before
   the first frame rather than progressively.
9. **The showcase is small in `overview`.** That preset is a fixed 400 m from the park centre; the
   lido is spread over 200 m to compensate and still occupies about a tenth of the frame. The module
   is not judged well at that distance and I would rather say so than pretend the frame is the point.
10. **`ground` at 09:00 shows a shadowless scene.** The harness runs `medium`, which has no cascaded
    shadow map, so nothing this module draws casts one in any of these frames. The shadow casters are
    wired (`metal`, `fabric`, `timber` go to `environment.addShadowCaster`) and have never been seen
    working.

---

## 6. Decisions worth recording

- **The built-in catalogue is manifest JSON, not TypeScript records.** It goes through the same
  parser a pack does, so it cannot express anything a pack could not. That is what makes the
  extensibility claim checkable rather than asserted.
- **A parse failure is per entry, not per pack.** One unreadable shape used to take the whole pack's
  pools with it. A pack authored against a newer build has to stay loadable — the same reasoning
  behind `Registry.unclaimedPackKeys` warning rather than throwing.
- **Furniture placement is a hash of (entity id, index), not an `Rng`.** A stateful generator makes a
  rebuild depend on how many pools were rebuilt before it; a pure function gives the same deck
  whatever order the world announces entities in.
- **Two passes at boot: resolve every pool against untouched ground, then dig.** Digging lowers the
  heightfield, so a pool resolved after its neighbour has been excavated would read the neighbour's
  pit floor as its own grade and sink by the depth of the pool next door.
- **Nothing re-grounds on `terrain:changed`.** The pool has already dug its own hole, so the ground
  under its centre _is_ the pit floor; asking again would sink the basin by its own depth, and again
  on the next edit.
- **The water material is `envExempt`, the tile is not.** Water owns its look and animates its own
  albedo against the sky; a pool deck should darken in the rain like every other paved surface.
- **The lake was read before a line of this was written.** Same two-scale scrolling ripple normal,
  same depth-in-the-vertex-colour trick, same "the body colour follows the sky so a night frame is
  not daytime green". What differs is a property of a contained pool: no swell (no fetch), a much
  gentler absorption ramp (a chlorinated pool at 2 m still shows its tile), a wall instead of a
  shore, and a floor it can light.
