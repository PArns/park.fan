# paths — critic, round 1

Module: `lib/game/paths/` · showcase `/game?showcase=paths` · also every walk, street and plaza in
the default demo park (20 `path` entities) · commit `6ee3fd2`.

Frames taken by me with `scripts/game-shot.mjs` into `.game-render/critic-paths/`,
`critic-paths-0900/`, `-1200/`, `-1830/`, `-2200/` (showcase) and `.game-render/critic-pp-0900/`,
`-1200/`, `-1830b/`, `-2200/` (demo park), plus five junction/edge framings of my own through the
scene handle into `.game-render/critic-paths-sc-detail/` and `critic-paths-detail/`, plus six crops
in `.game-render/critic-paths-crops/`. Every PNG named in §3 was opened and looked at.

Numbers come from those `report.json` files and from four probes I wrote and left beside them:
`.game-render/paths-probe.mjs` → `paths-probe.json` (light census, per-material light slots,
albedo read back off the GPU, `paths` api stats, per-camera budget, pack extensibility, save
round-trip), `paths-probe2.mjs` → `paths-probe2.json` (vertex-colour buffers, per-mesh triangle and
bounding-box census), `paths-probe3.mjs` (finds real crossings from the world's path entities and
aims the camera at them), `paths-probe4.mjs` → `paths-probe4.json` (light slots and texture cost at
`low` / `high` / `ultra`).

**Weighted total: 6.26. FAIL** (pass is 8.5). No hard gate is failed; extensibility sits at exactly
5.0, which is the floor, not clearance. The engineering under this module is the best-argued in the
game so far — the junction clip, the derived-not-saved graph and the byte-identical save are all
right — and the thing it actually draws, a walking surface, is its weakest part: measured off the
GPU, the flagship concrete has a **2.9 % tone spread across the four slabs that exist before the
texture repeats every 2 m**, which is the "one colour with a grid drawn on it" its own docblock
says it exists to prevent.

## 1. Scores

| #   | Axis                  | Weight | Score | One sentence                                                                                                                                                                                                        |
| --- | --------------------- | -----: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % |   6.5 | The kerb section and the demo park's night promenade are real, and the network is the most legible thing in the 22:00 overview — but every walking surface is a flat tone with a grid on it, measured at 2.9–6.5 %. |
| 2   | Fidelity              |   20 % |   5.8 | No camber, no crossfall, no gutter, no drainage anywhere in 4,293 lines, an 8 m avenue has two vertices across its width, and the 8/6/4 m hierarchy renders as a width number and nothing else.                     |
| 3   | Extensibility         |   20 % |   5.0 | Internals never switch on a style id and the `registerStyle` seam really builds a new style live, but a pack carrying `pathStyles` changes nothing: both catalogues live in TypeScript.                             |
| 4   | Budget and behaviour  |   15 % |   6.0 | 8 draw calls of 248 is grouping done right, but 50.4 % of the module's triangles are kerb, there is no LOD at all, and the graph rebuild measures 11.2–12.9 ms against a 6 ms whole-sim budget.                     |
| 5   | Determinism and state |   10 % |   9.5 | No `Math.random`, no wall clock reachable from the sim, save → load → save byte-identical at 749,761 bytes, and the graph is genuinely derived rather than stored.                                                  |
| 6   | Honesty of the report |    5 % |   6.0 | Eleven ranked weaknesses of which I confirmed seven independently — spoiled by claiming a green selftest that is red at HEAD and a per-cell tint the texture does not have.                                         |

**6.5 × 0.30 + 5.8 × 0.20 + 5.0 × 0.20 + 6.0 × 0.15 + 9.5 × 0.10 + 6.0 × 0.05 = 6.26.**

## 2. Hard gates

| Gate                                            | Command                                                                                                  | Result                                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings             | `node scripts/game-shot.mjs [--showcase=paths] --tod=… --cam=overview,close,ground --wait=6000` × 10     | **PASS** — `err=0 warn=0 hyd=0` in all eight `report.json` written, 24 shots. Two early runs aborted on the harness's own "promise was garbage collected"; both were re-taken one `tod` each. |
| Barrel import                                   | `grep -rn "from '@babylonjs/core'" lib/game/paths/`                                                      | **PASS** — no hits                                                                                                                                                                            |
| `window`/`document`/`navigator` at module scope | `grep -rn "window\.\|document\.\|navigator\." lib/game/paths/*.ts`                                       | **PASS** — no hits anywhere, not just at module scope                                                                                                                                         |
| Coupling                                        | `grep -rn "from '\.\./" lib/game/paths/*.ts`                                                             | **PASS** — 6 imports, all into `core` (`types` ×5, `world` ×1). Terrain is reached through `ctx.module<TerrainLike>('terrain')`, never by import.                                             |
| `npx tsc --noEmit`                              | as written                                                                                               | **PASS** — exit 0, clean                                                                                                                                                                      |
| `npx eslint lib/game/paths`                     | as written                                                                                               | **PASS** — exit 0, no output                                                                                                                                                                  |
| `npx prettier --check lib/game/paths`           | as written                                                                                               | **PASS** — "All matched files use Prettier code style!"                                                                                                                                       |
| `pnpm test:game`                                | as written                                                                                               | **PASS** — exit 0; soak 576 ticks, mean 0.05 ms/tick, `reachabilityMeasured: true`, `unreachableQueues: 0`                                                                                    |
| Module selftest                                 | `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/paths/selftest.mjs` | **FAIL, but not a listed gate** — `✗ paths selftest: 1 failed`, exit code 1, 4 runs of 4. See §4.7.                                                                                           |
| Teardown / leak                                 | `node scripts/check-game-teardown.mjs`                                                                   | **PASS** — 3 dispose/reboot cycles, ≤1 live engine context, handle removed, 0 console errors (`.game-render/teardown.json`)                                                                   |
| Extensibility ≥ 5                               | see §4.3                                                                                                 | **PASS by 0.0** — 5.0                                                                                                                                                                         |
| Touched only its own folder                     | answered by the integrator; `git status --porcelain` empty at grading                                    | **PASS**                                                                                                                                                                                      |

## 3. The frames I looked at

| File                                              | What is actually in it                                                                                                                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-paths/0900-ground.png`                    | Standing on the 8 m concrete avenue. Near-white paving to the horizon, hairline joints following the curve, a legible kerb section on the right, grass beyond. Blown out: the surface is brighter than the sky's lower band.                                      |
| `critic-paths/0900-close.png`                     | The paver plaza from ~90 m: a flat salmon-pink octagon with a lumpy dark kerb ring. No paver reads. The boardwalk stub at the left edge is cut off square.                                                                                                        |
| `critic-paths/0900-overview.png`                  | From 340 m the whole showcase is a ~500 px smear of ribbons in an empty field. The report says this is on purpose and it is still what it is.                                                                                                                     |
| `critic-paths-1200/1200-close.png`                | The same plaza at noon, and the tiling repeat is unmistakable — a regular diagonal weave across ~90 m. Measured over a 500×230 patch: 16×16-block luminance sd **2.16**, block range **10.4/255**.                                                                |
| `critic-paths-1830/1830-ground.png`               | **The showcase's best frame.** Dusk, the concrete finally has a value structure, the right-hand kerb reads as three distinct faces, joints run to a vanishing point. Still dead flat across 8 m.                                                                  |
| `critic-paths-2200/2200-ground.png`               | Moonlit. Dim blue-grey concrete under a starfield, joint grid survives, kerb still readable. Honest and it holds; this module owns no lights and draws none.                                                                                                      |
| `critic-pp-0900/0900-ground.png`                  | **The best frame the module appears in.** The demo park's main street: dappled tree shadow across grey paving, kerbs both sides running to a vanishing point, the pink market square in the mid-distance. Most of what makes it good is scenery's and terrain's.  |
| `critic-pp-0900/0900-close.png`                   | The fountain square from ~90 m: a granite-sett plaza that has dissolved to a uniform blue-grey speckle, no sett, no band course, no radial pattern around the fountain, and no visible kerb along its left edge.                                                  |
| `critic-pp-2200/2200-ground.png`                  | Night promenade. **One lamp lights the paving** — the left kerb is cream, the right kerb navy, from the same row of lamps. ~30 further lamp heads glow and light nothing on the ground.                                                                           |
| `critic-pp-2200/2200-overview.png`                | The park at 340 m at night, and the path network is the **most legible thing in the frame** — pale ribbons tracing the layout through the trees. The module's strongest structural showing.                                                                       |
| `critic-paths-sc-detail/junction1-top.png`        | 26 m above an 8 m avenue crossing a 4 m paver walk at 82.6°. The paver surface and both its kerbs stop exactly on the avenue's edge line. **Two granite kerb fragments are left lying inside the concrete cap**, the upper one running nearly the full 8 m width. |
| `critic-paths-sc-detail/junction2-top.png`        | Same height, 6 m promenade × 6 m service road at 81.3°. **Clean**: asphalt cut on the concrete's edge line, kerbs stopping square, paving running through. The cap band is visibly brighter than the ribbon on both sides.                                        |
| `critic-paths-sc-detail/junction2-eye.png`        | The same crossing from 13 m away at eye height, and it is the frame that hurts: the ribbon is a **concrete plank lying on a lawn** with a vertical side wall, and the promenade's far end simply stops in mid-air with a raw square cut.                          |
| `critic-paths-detail/junction1-top.png`           | Demo park, 26 m over (−117.6, 63.2): the asphalt service road and a clay-paver walk **overlap coplanar for their whole length at 8.1°**, with the paver walk's kerb running down the middle of the road. The report's weakness 11, shipped in the default scene.  |
| `critic-paths-detail/junction1-eye.png`           | Unusable — I aimed the camera at an absolute y that put it under the terrain. Listed because it was taken; the re-aim with a terrain sample is `critic-paths-sc-detail/junction2-eye.png`.                                                                        |
| `critic-paths-crops/sc0900-slabs-sunlit.png` (3×) | The sunlit avenue's near field. A uniform fine speckle like plaster, **no perceptible tone difference between slabs**, and the joints visibly waver — a 1-texel line under anisotropic minification.                                                              |
| `critic-paths-crops/pp0900-slabs.png` (2.6×)      | The demo park's promenade in tree shadow: a uniform blue slab with a thin dark grid on it. Nothing of the bump map, the aggregate or the per-slab tint survives out of direct sun.                                                                                |
| `critic-paths-crops/pp0900-plaza-join.png` (3×)   | Promenade running into the market square. The material change is clean and straight, no gap, no z-fight — and the promenade's kerb terminates in a blunt square end at the boundary, the report's weakness 5.                                                     |
| `critic-paths-crops/sc1200-plaza-3x.png` (4×)     | The paver plaza magnified: a dusty-pink noise field. **The running bond has completely dissolved** — no paver, no joint, no bond. Carpet, not brick.                                                                                                              |
| `critic-paths-crops/junction-cap-4x.png` (4×)     | Junction 1 magnified. The clip is exact where it works, and the two orphan kerb stubs lying across the middle of the avenue are unambiguous.                                                                                                                      |

## 4. What I measured myself

### 4.1 The assigned finding — confirmed, with the mechanism, and the scenery critic's version is one word too strong

Measured at 22:00 in the demo park (`paths-probe.json`, `paths-probe4.json`). The scene holds
**5 lights** at `medium`, and `scene.requireLightSorting` is `true`, so `mesh.lightSources` comes
back sorted by `renderPriority`:

```
sun            DirectionalLight  prio 0   intensity 0.000
sky            HemisphericLight  prio 0   intensity 0.100
env-moon-light DirectionalLight  prio 0   intensity 0.000
scenery-lamp-0 PointLight        prio -1  intensity 63.0
scenery-lamp-1 PointLight        prio -1  intensity 63.0
```

All eight `path-*` materials carry `maxSimultaneousLights = 4` (nothing in `materials.ts` sets it,
so it is Babylon's `PBRMaterial` default), against `6` in `lib/game/scenery/materials.ts:96` and
`lib/game/track/materials.ts:60`. The consequence, read off `mesh.lightSources` per path mesh, is
identical for all eight: `used = [sun, sky, env-moon-light, scenery-lamp-0]`.

So **one lamp does reach the paving** — the scenery critic's "never the path it stands on" is
wrong by exactly one light, and `critic-pp-2200/2200-ground.png` shows it: the left kerb is lit
cream and the right kerb is navy from the same row of lamps. What is true, and worse than the
version I was handed, is the shape of it across the presets (`paths-probe4.json`):

| preset   | lamps in the pool | path slots | lamps admitted to a path | admitted to scenery |
| -------- | ----------------: | ---------: | -----------------------: | ------------------: |
| `low`    |                 0 |          4 |                        0 |                   0 |
| `medium` |                 2 |          4 |                    **1** |                   2 |
| `high`   |                 4 |          4 |                    **1** |                   3 |
| `ultra`  |                 6 |          4 |                    **1** |                   3 |

The number does not move, because three of the four slots are spent before any lamp is considered.
**The disparity widens with the preset**: at `ultra` a player pays for six point lights and the
paving renders one of them. `low` is defensible — there is nothing to admit. `medium`, `high` and
`ultra` are not.

Two of those three occupied slots are **contributing nothing at 22:00**: `sun` and `env-moon-light`
are both enabled at `intensity 0.000` and both take a slot on every material in the scene. Half of
the light budget of the largest-area surface in the frame is spent on lights that are off.

**What it costs to raise.** `material.maxSimultaneousLights = 6` in `materials.ts` — one line,
inside this module's own folder — takes a path from 1 lamp to 2 at `medium` and to 3 at `high` and
`ultra`, matching scenery exactly. It adds zero draw calls and zero triangles; it adds two
iterations of the PBR light loop to the fragment shader of 8 materials that cover roughly the
bottom half of a `ground` frame. I cannot price the fill rate here — SwiftShader makes the `fps`
in every `report.json` meaningless, as the brief says — but the permutation count does not change
(Babylon already compiles per light count) and the geometry cost is nil. The cheaper fix is not
this module's: a directional at `intensity 0` should not be enabled, and that would give paths 3
lamps at no shader cost at all.

### 4.2 The frame at ground level — the surfaces are the weak part of a well-built object

I read the generated albedo back off the GPU (`BaseTexture.readPixels()`, `paths-probe.json →
textures`) and took the mean sRGB luminance of the middle 60 % of each pattern cell, so joints do
not pollute the mean:

| material             | size | cells per tile | cell means                    | spread  | sd   |
| -------------------- | ---- | -------------: | ----------------------------- | ------- | ---- |
| `path-concrete-slab` | 512² |          2 × 2 | 185.9 / 188.7 / 189.8 / 191.4 | **5.5** | 2.02 |
| `path-clay-pavers`   | 512² |        10 × 10 | 135.4 … 152.2                 | 16.7    | 3.97 |
| `path-granite-sett`  | 512² |        18 × 18 | 136.3 … 163.3                 | 27.4    | 5.95 |

The flagship surface — the one the main street, the queue line and half the demo park are paved
with — has **four distinct slabs in the whole texture, spanning 5.5 of 255, i.e. 2.9 %**, and the
tile repeats every 2 m (`tileMetres: 2`, `uScale 0.5`, `SLAB_M = 1.0` → `cells = 2`). `textures.ts`
opens by saying per-cell tint is what stops a paved surface reading as "one colour with a grid
drawn on top, which is exactly what programmer art looks like". `critic-paths-crops/sc0900-slabs-sunlit.png`
at 3× is one colour with a grid drawn on top. The arithmetic explains it: `stone = base × (1 + tint × 0.26)`
with the per-cell term at ±0.25 gives ±6.5 % linear, which sRGB compresses to ±5 bytes out of 188.

The ranking above is also the ranking the eye gives the three surfaces, which is worth saying
plainly: the cobble street is the best-looking paving in the game and the concrete is the worst,
and the difference is 22 luminance steps of per-cell spread.

**The macro tint does not rescue it.** The vertex-colour buffers are real (`paths-probe2.json`:
`paths-concrete-slab` carries colours in 0.732–0.840, `paths-clay-pavers` 0.743–1.000), but on the
plaza at noon the rendered result over a 500×230 patch of `critic-paths-1200/1200-close.png` is a
16×16-block luminance sd of **2.16** and a block range of **10.4/255 — 4 %**. The report says the
macro is there "so the tiling does not read". The tiling reads and the macro does not.

**Where a path meets a plaza** (`critic-paths-crops/pp0900-plaza-join.png`): clean. The concrete
stops on a straight line, the pavers begin, no gap and no z-fight, and the plaza's kerb is
suppressed where the path lands. The promenade's own kerb ends in a blunt square section at that
line — the report's weakness 5, confirmed.

**Where a path meets grass** (`critic-paths-sc-detail/junction2-eye.png`): this is the one the
showcase loses. Nothing in this module touches the terrain, so `surfaceY = terrain.height + 0.07`
(`layout.ts:37`) plus a 0.13 m kerb puts the kerb top 0.20 m above the lawn along every metre of
every path. At eye height it reads as a concrete plank laid on grass with a vertical side wall.
The demo park hides this because `paintDemoTerrain`/`landform.ts` flattens the main-street corridor
first; the showcase, which is this module alone, does not.

The same frame shows there is **no end cap**: `buildRibbon` emits nothing at the first or last
station, so a path that simply ends leaves the surface, the kerb top and both kerb faces terminating
in a raw square section with grass visible under it.

**Where two paths cross** — I found the crossings from the world's own path entities and aimed the
camera at each (`paths-probe3.mjs`). Two of three are the report's claim exactly:

- `junction2-top.png` (6 m × 6 m, 81.3°) — the asphalt is cut precisely on the concrete's two edge
  lines, both kerbs stop square on that line, the concrete runs through, no seam, no overlap, no
  z-fighting. This is good work and it is what the report describes.
- `junction1-top.png` (8 m × 4 m, 82.6°) — the same, **except that two granite kerb fragments are
  left lying inside the concrete cap**, the upper one running nearly the full 8 m width of the
  avenue. `critic-paths-crops/junction-cap-4x.png` at 4× is unambiguous: they are the paver walk's
  kerbs, clipped partially and not at the avenue's edge. A guest walks down an 8 m avenue and
  crosses a 13 cm kerb lying across it. The report's weakness 5 describes a milder thing (a kerb
  that _stops_ square); what is there is kerb _inside_ the crossing.
- In both, **the cap band is visibly brighter than the ribbon on either side of it** — the macro
  vertex tint is discontinuous at the cap boundary, so every one of the demo park's 17 junctions is
  a pale patch across the path. The report claims the cap is "continued through the crossing, so
  the paving pattern runs through the junction instead of restarting inside it"; the _pattern_ does,
  the _tone_ does not.

And the demo park ships one crossing the module declines to treat as a junction at all:
`critic-paths-detail/junction1-top.png`, the asphalt service road and a paver walk overlapping
coplanar at **8.1°** at (−117.6, 63.2), with the walk's kerb running down the middle of the road.
The report predicts this case (weakness 11) as something "a player deliberately draws"; it is in the
default scene.

### 4.3 Extensibility — a pack carrying `pathStyles` changes nothing

Measured (`paths-probe.json → ext`), against the core mechanism the brief names:

```
packRegistered   true            (a schema-valid pack with a pathStyles key registers)
packKeptKey      true            (packManifestSchema passes the unknown key through)
unclaimed        [{ pack: "critic-paths-pack", key: "pathStyles" }]
stylesBefore     promenade, pavers, cobble, boardwalk, service-road, queue-line
stylesAfterPack  promenade, pavers, cobble, boardwalk, service-road, queue-line
resolvedFromPack false
```

`paths` calls `registerPackCategory` nowhere and touches `ctx.registry` nowhere — `grep -rn
"registry\|pack" lib/game/paths/*.ts` returns one hit outside `manifest.ts`, the string
`'core-classic'`. So this is not scenery's defect (a pack registered _after boot_ missing a
one-shot `buildCatalog`); a pack never reaches this module at any time. Both catalogues —
`PATH_STYLE_MANIFEST` and `PATH_MATERIAL_MANIFEST` — live in TypeScript, which is the rubric's own
description of a 3 on this axis.

Two further holes measured in the same run:

- **A style cannot bring its own material recipe.** `registerPathMaterial` is exported from
  `manifest.ts` but is not on `PathsMainApi`, so even the runtime seam can only recombine the six
  built-in recipes. My attempt was rejected: `path style "critic-new-mat": surface
"critic-does-not-exist" is not a known material`. Good error, wrong answer — a _new surface_ is
  precisely what the brief asks a manifest to be able to add.
- **`pathStyle(id)` silently falls back to `promenade`** for an unknown id (`manifest.ts`). A pack
  style that failed to load renders as concrete with no warning anywhere, which is the exact failure
  `unclaimedPackKeys()` was added to end.

What keeps this at 5.0 rather than below it:

- `mesh.ts`, `materials.ts` and `textures.ts` genuinely never switch on a style id. The generator
  switches on `recipe.pattern`, a manifest field. Materials are keyed by _recipe_, not by style, so
  the promenade and the queue line share one concrete. That is the half of the axis this module
  gets right and it is not a small half.
- `parsePathStyle` validates with the offending field named, on the same contract as `parsePack`.
- The seam works end to end, measured: `registerStyle({id:'critic-grit', …})` then `create()` took
  `layouts` 20 → 21 and `triangles` 48,144 → 49,306 with no new material built, live, after boot
  (`paths-probe.json → extBuild`).
- `registerPackCategory` landed at `951b3e2` (06:48), this module at `d86231e` (00:04) — the
  mechanism did not exist when the workaround was chosen, and `docs/game/requests/paths.md` asks
  for exactly it. That is honest. It is also no longer a reason: the fix is now entirely inside
  `lib/game/paths/`.

5.0 clears the floor by nothing. This is the axis that decides round 2.

### 4.4 Fidelity — the rubric names this module's gap by name

CRITIC.md's own example of a 10 on this axis is "a path is cambered and drains". It is not.
`grep -rni "camber\|crossfall\|cross slope\|drain\|gutter\|crown" lib/game/paths/*.ts` returns four
hits and all four are comments about the _kerb's_ buried skirt. The surface is one quad from left
edge to right edge (`mesh.ts`, the `emitQuad(surfaceGeo, [surf(i,true,…), surf(i,false,…), …])`
loop), so **an 8 m avenue has exactly two vertices across its width** — it cannot be crowned, and it
also cannot conform to anything between its two edges: a rise in the middle of a wide path is
interpolated over, not sampled.

The demo park drives a real hierarchy (`paths-probe.json → entityCensus`: 3 paths at 8 m, 3 at 6 m,
8 at 4 m, plus 6 plazas). The module renders it as a width and nothing else — the `promenade`
style's kerb is 0.28 × 0.13 m whether the ribbon is 8 m or 4 m, there is no width-dependent section,
no flare at a junction, no change of surface role with width. Two of the six styles differ by more
than a texture (`boardwalk`'s `crossGrain`, `queue-line`'s `stanchion`); the other four are a colour.

What is researched and right: the kerb has a genuine three-face section with the outer face dropped
0.35 m so a cross slope cannot open a gap; the boardwalk's planks run across the direction of
travel; a queue is a spline with stanchion posts drawn as thin instances (`postMesh`, one mesh) and sagging
belts; a plaza's kerb is suppressed where a path lands on it.

What is wrong at the surface: `asphalt-service` uses `pow(ridged(…), 14)` for cracks, and at 26 m
in `critic-paths-detail/junction1-top.png` it reads unmistakably as **camouflage**, not asphalt — a
maze of dark blobs on a road that in reality is nearly featureless at that scale. `clay-pavers`
dissolves to felt past ~30 m (`critic-paths-crops/sc1200-plaza-3x.png` at 4×). A 90 m fountain
square is one texture repeated ~45 × with no band course, no border, no radial pattern and no
change of module around the fountain (`critic-pp-0900/0900-close.png`).

### 4.5 Budget — good grouping, no LOD, and half the triangles are kerb

Per-mesh census (`paths-probe2.json → bbox`, demo park), summed:

| group     | meshes |  triangles | share      |
| --------- | -----: | ---------: | ---------- |
| surfaces  |      5 |     23,901 | 49.6 %     |
| **kerbs** |      3 | **24,243** | **50.4 %** |
| total     |      8 |     48,144 | 100 %      |

**Half of this module's geometry is a 28 cm wide, 13 cm tall strip along the edge.** The ratio is
structural, not incidental: `buildRibbon` emits 1 quad per metre for the surface and 6 (top, inner,
outer × 2 sides) for the kerbs, so a kerb costs **6 × the triangles per metre of the thing it edges**.
For the promenade and service road specifically the kerb is `4,280` triangles against `847` of
surface — **5.05 ×**. A third of every kerb's outer face is the 0.35 m skirt, which is underground
everywhere the terrain is not falling away.

Against the frame (`critic-pp-1200/report.json`, `paths-probe.json → perCamera`):

| camera     | frame draws | frame triangles | paths draws | paths triangles | paths share of tris |
| ---------- | ----------: | --------------: | ----------: | --------------: | ------------------: |
| `ground`   |         248 |       1,080,281 |           8 |          48,144 |               4.5 % |
| `close`    |         229 |       1,015,103 |           8 |          48,144 |               4.7 % |
| `overview` |         145 |         290,262 |           8 |          48,144 |          **16.6 %** |

8 draw calls is **0.67 % of the 1,200 whole-game budget** for one of twenty-four modules, and that
is genuinely good — the grouping by material earns it. The triangle figure is **identical in all six
camera × time rows I sampled**: there is no LOD, and because the 8 meshes each span the whole park
there is no frustum culling either, so at `close` the camera sees perhaps 5 % of the network and
submits 100 % of it. The exposure is worst at the camera where paving matters least.

Boot cost, off `mesh.metadata.pathsStats` (`paths-probe4.json`):

| preset   | texture size | `textureMs` | `rebuildMs` | `texelDensity` |
| -------- | -----------: | ----------: | ----------: | -------------: |
| `low`    |         256² |       434.5 |       641.9 |             85 |
| `medium` |         512² |     1,492.7 |     1,648.9 |            171 |
| `high`   |         768² | **3,784.8** |     3,955.8 |            256 |
| `ultra`  |         768² |     3,630.8 |     3,813.2 |            256 |

The demo park's whole boot is 10,014 ms at `medium` (`critic-pp-0900/report.json`); at `high` this
module's texture loop alone is **3.8 s of main-thread JavaScript**. `ultra` buys nothing over `high`.
No preset reaches the art bible's 512 px/m.

`graphStats().buildMs` measures **11.2 / 12.0 / 12.4 / 12.9 ms** across four runs on the demo park's
1,511 nodes / 4,022 edges — **twice the 6 ms whole-sim budget for one module's rebuild**. This is the
main-thread copy under SwiftShader and the worker runs the same pure code on a quieter thread, but
it is the number the harness wrote and the report's own 2.5–5 ms was taken the same way.

Adding one path to the demo park re-meshed everything: `rebuildMs` 209.3 ms for one `create()`
(`paths-probe.json → extBuild`), against the report's 85–93 ms for a network it calls "deliberately
oversized".

### 4.6 Determinism — the strongest axis, and it is not close

- `grep -rn "Math\.random\|Date\.now\|new Date" lib/game/paths/*.ts` — no hits.
- `performance.now()` appears only in `main.ts` (×3) and `textures.ts` (×2). `sim.ts` imports
  `layout`, `graph`, `types` and `core/types` and nothing else, so no clock is reachable from the
  worker. `graph.buildMs` is filled in by the renderer and stays 0 on the sim, deliberately.
- Save → load → save is **byte-identical at 749,761 bytes** (`paths-probe.json → determinism`).
- Owned world state is `{ gate: null }` — **13 bytes of JSON**. The graph really is derived and not
  stored, which is the thing most modules get wrong and this one argued for and then did.

### 4.7 Honesty — seven confirmed, four claims the frames or the harness contradict

Confirmed independently, with numbers above: texel density below the bible's 512 (85–256); a full
re-mesh on every edit (209.3 ms); kerbs ending in an open cut at a junction; style names in plain
English; near-parallel overlaps left coplanar; no path lamps; plaza uv not continuing a path's. That
is a better weakness list than the four modules graded before this one.

Contradicted:

1. **"`selftest.mjs` — 25 assertions, all passing."** It is 24 checks and one fails at HEAD:
   `✗ 20k queries stay inside one tick budget` at **16.29 / 8.15 / 16.17 / 6.28 ms** in four runs of
   four, against its own `check(… ms < 6 …)` at `selftest.mjs:284`, exit code 1. The report's
   "20,000 next() in 4.7–5.7 ms" is the number the gate was written around and I could not reproduce
   it once. The container is shared and the report says so; it does not say the test is red.
2. **"per-cell colour variation, so a paved surface is not one colour with a grid drawn on it."**
   Measured: 4 cells, 5.5/255 spread, 2.9 %, on the module's most-used surface. §4.2.
3. **"Macro variation … so the tiling does not read."** Measured: 4 % low-frequency variation on the
   plaza, and a repeat that is visible without magnification in `critic-paths-1200/1200-close.png`.
4. **"mesh rebuild 54.5 ms … 85–93 ms for a 3 km network"; "textures 1,628 ms"; "graph rebuild
   2.5–5 ms."** Measured on the demo park: 209.3 ms, 3,784.8 ms, 11.2–12.9 ms.

And one that is stale rather than wrong: weakness 4 says "the demo park has no paths". It has 20,
laid out in `1e87470`. The half of that weakness that survives is real and unstated — there is no
`queue` form entity anywhere in the demo park (`posts: 0`), so the soak's `✓ no unreachable queues`
still passes over an empty set.

## 5. What to fix, ranked

1. **Give the concrete a per-slab tone that a person can see, and more than four slabs before it
   repeats.** 5.5/255 of spread across 2 × 2 cells is the single biggest reason the best camera in
   the game looks like painted card. The per-cell term is `× 0.26` in `textures.ts`; the cobble
   gets 27.4 across 18 × 18 and looks like stone. Raising `cells` for `concrete` above
   `tile / SLAB_M` (a 4 m tile at 1 m slabs, or a hash over a wider period than one tile) costs
   nothing at boot and fixes the repeat at the same time.
2. **Take the kerb fragments out of the junction cap.** `critic-paths-sc-detail/junction1-top.png`:
   a 13 cm kerb lying across an 8 m avenue at one of two junctions I framed, and the demo park has 17. The clip works for the surface and for one of the two kerb pairs; the plane-selection
   heuristic in `emitQuad` ("a quad is one metre long and the slab between them is at least two")
   is the place to look.
3. **`maxSimultaneousLights = 6` in `materials.ts`.** One line in this folder, zero draw calls,
   zero triangles, and it takes the paving from 1 lamp to 3 at `high` and `ultra` — matching what
   scenery and track already ask for. §4.1.
4. **Camber the surface.** The rubric names it. Three vertices across instead of two, with the
   centre raised ~2 % of the half width, also fixes the wide-path conformance hole (an 8 m avenue
   currently interpolates the terrain between its two edges) and costs 1 extra quad per metre —
   which is still a sixth of what the kerb beside it spends.
5. **Read `pathStyles` off the pack manifest and claim the category.** `registerPackCategory('pathStyles', 'paths')`
   plus an `onPack` handler plus `registerPathMaterial` on the api. Measured today: a valid pack
   registers, core reports the key unclaimed, and `styles()` does not move. This is the axis at the
   floor and the fix is entirely inside `lib/game/paths/`.
6. **Halve the kerb's triangle cost.** 24,243 of 48,144 for a 28 cm strip; the outer face's 0.35 m
   skirt is underground wherever the ground is flat, and a straight run needs stations only where
   the ribbon curves. Freeing ~12 k triangles here pays for the camber in item 4 twice over.
7. **Give the module an LOD or a spatial split.** 48,144 triangles submitted identically at every
   camera, 16.6 % of the `overview` frame, and it grows linearly with park size with no relief.
8. **Fix the selftest or fix what it measures, and wire it into `pnpm test:game`.** It is red at
   HEAD, it exits 1, and nothing in CI runs it — which is how a report came to claim 25 green
   assertions.
9. **Emit an end cap on a ribbon**, and reconsider `SURFACE_LIFT`. A path that ends stops in
   mid-air (`critic-paths-sc-detail/junction2-eye.png`), and a path that does not sit in ground the
   module never cuts reads as a plank on a lawn everywhere the demo park has not flattened the
   corridor for it.
10. **Redraw the asphalt.** `pow(ridged, 14)` is camouflage at 26 m
    (`critic-paths-detail/junction1-top.png`), and asphalt is the one surface in the set that should
    be almost featureless.

## 6. Verdict

**FAIL — 6.26 weighted, against a pass mark of 8.5.**

No hard gate is failed and extensibility sits exactly on its floor at 5.0, so the module is not
failed on that clause either; it is failed on the total. The graph, the save, the junction clip and
the material grouping are all better than the module's grade, and none of them is what a player
looks at. What a player looks at is a walking surface with 2.9 % of tone variation in it, a plaza
whose macro variation measures 4 %, and a kerb that costs half the module's triangles — and, for the
one round-1 finding handed to me, exactly one of the six lamps a player pays for at `ultra`.
