# terrain — critic, round 1

Module: `lib/game/terrain/` (12 files, 2,651 lines) · showcase `/game?showcase=terrain` · also the
ground under every frame of the default demo park · commit `1311098`.

Frames taken by me with `scripts/game-shot.mjs` into `.game-render/critic-terrain/`,
`critic-terrain-0900/`, `-1200/`, `-1830/`, `-2200/` (showcase, all 12 tod × cam combinations) and
`.game-render/critic-tpark-0900/`, `-1200/`, `-1830/`, `-2200/` (demo park). Every PNG named in §3
was opened and looked at. The 12-shot single-page run aborts on the harness's own "promise was
garbage collected" after 4–5 shots — every run below is one `tod` at a time, which does not.

Numbers come from those `report.json` files and from four scripts I wrote and left beside them:
`.game-render/terrain-probe.mjs` → `terrain-probe-park.json` (budget per camera, mesh census, slope
and paint histograms, apron profile, IBL state, pack extensibility, save round-trip),
`terrain-probe2.mjs` → `terrain-probe2-park.json` (LOD selection per chunk, shadow render lists,
the world edge projected against the apron's own profile), `terrain-edge.mjs` / `terrain-edge2.mjs`
→ `terrain-edge.json` (column scan for the sky→land step) and `terrain-patch.mjs` (tone spread of a
named rectangle).

**Weighted total: 6.04. FAIL** (pass is 8.5), and it fails a hard gate as well: extensibility is
**4.0**, under the floor of 5. Terrain claims no pack category, reads no manifest and switches its
seven ground layers out of a `switch (layer)` in `textures.ts` — the same hole `scenery` and
`paths` were failed for, one notch worse, because there is not even a `registerStyle`-shaped seam
to close.

What is genuinely strong and should not be touched: the LOD really works (147,456 → 24,192
triangles at `overview`, an 83.6 % cut, `terrain-probe2-park.json` → `lod.overview`), the save
round-trips byte-identical at 748,982 bytes, and the surfaces have real tone — the grass measures
an **85.1 % p5–p95 luminance spread** where the `paths` flagship concrete measured 2.9 %.

## 1. Scores

| #   | Axis                  | Weight | Score | One sentence                                                                                                                                                                                                                                                          |
| --- | --------------------- | -----: | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % |   6.8 | Grass, rock and the night hold up (85.1 % / 82.1 % tone spread, legible silhouettes at 22:00), but the world ends in a hard 78-row step at `overview`, the escarpment's top edge is a straight retaining wall, and the showcase's only eye-level camera is 55 % sand. |
| 2   | Fidelity              |   20 % |   6.2 | The technique is right (triplanar cliff, skirts not stitching, water emitted only where the land dips) and the landform is not: one slope break at 26° with nothing between lawn and cliff, no erosion, no talus, no wet band at the waterline.                       |
| 3   | Extensibility         |   20 % |   4.0 | No `registerPackCategory`, no manifest read anywhere in 2,651 lines, a `switch (layer)` over indices 0–5 in `textures.ts`, and the texture array is built once in `main()` from a compile-time `LAYER_COUNT`. **Below the gate.**                                     |
| 4   | Budget and behaviour  |   15 % |   6.0 | LOD earns its keep and chunking is right, but the shadow proxy is 32,768 triangles drawn into 3 cascades — 98,304 per frame, **33.9 % of the demo park's 290,262 at `overview`** — and terrain is 64 of the 100 meshes the colour pass draws.                         |
| 5   | Determinism and state |   10 % |   9.3 | No `Math.random`, no wall clock in anything reachable from the sim, save → load → save byte-identical with `heights` and `paint` deep-equal; the one wrinkle (two copies of `world.terrain`) is documented and holds.                                                 |
| 6   | Honesty of the report |    5 % |   2.5 | There is no report. `docs/game/reports/terrain.md` does not exist, nor does the `docs/game/requests/terrain.md` that `env-probe.ts` cites in its own docblock; the docblocks are candid but two of their claims are contradicted by frames.                           |

**6.8 × 0.30 + 6.2 × 0.20 + 4.0 × 0.20 + 6.0 × 0.15 + 9.3 × 0.10 + 2.5 × 0.05 = 6.035 → 6.04.**

## 2. Hard gates

| Gate                                                | Command                                                                                                                    | Result                                                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Console errors / hydration warnings                 | `node scripts/game-shot.mjs [--showcase=terrain] --tod=<one> --cam=overview,close,ground --wait=6000 --timeout=180000` × 6 | **PASS** — `err=0 warn=0 hyd=0` in all six `report.json` written (`critic-terrain-0900/-1200/-1830/-2200`, `critic-tpark-0900/-1200`), 18 shots. Both probes also logged 0 (`errors: []`).                               |
| Barrel import                                       | `grep -rn "from '@babylonjs/core'" lib/game/terrain/`                                                                      | **PASS** — no hits                                                                                                                                                                                                       |
| `window` / `document` / `navigator` at module scope | `grep -rn "window\.\|document\.\|navigator\." lib/game/terrain/*.ts`                                                       | **PASS** — no hits anywhere, not just at module scope. `performance.now()` appears three times and is guarded with `typeof performance !== 'undefined'` in `textures.ts`.                                                |
| Coupling                                            | `grep -rn "from '\.\./" lib/game/terrain/*.ts`                                                                             | **PASS** — 10 imports, every one `import type … from '../core/types'`. Nothing imports a sibling module at all; `environment` is reached through `ctx.module('environment')`.                                            |
| `npx tsc --noEmit`                                  | as written                                                                                                                 | **PASS** — exit 0, clean                                                                                                                                                                                                 |
| `npx eslint lib/game/terrain`                       | as written                                                                                                                 | **PASS** — exit 0, no output                                                                                                                                                                                             |
| `npx prettier --check lib/game/terrain`             | as written                                                                                                                 | **PASS** — "All matched files use Prettier code style!"                                                                                                                                                                  |
| `pnpm test:game`                                    | as written                                                                                                                 | **PASS** — exit 0. Note: it contains **no terrain assertion**; the 21 named checks are all `paths`, and the soak's terrain content is `sampleHeight` used by other modules. `lib/game/terrain/` ships no `selftest.mjs`. |
| Extensibility ≥ 5                                   | see §4.3                                                                                                                   | **FAIL — 4.0.** This alone fails the module.                                                                                                                                                                             |
| Touched only its own folder                         | answered by the integrator                                                                                                 | **PASS**                                                                                                                                                                                                                 |

## 3. The frames I looked at

Showcase — all twelve, opened one by one.

| File                                                                                                  | What is actually in it                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-terrain-0900/0900-overview.png`                                                               | Meadow with large pale sand blotches, the grey escarpment running diagonally, the lake as a dark navy band top-left, and a **flat brown plate** filling the horizon left of the lake. Land ends against sky in a hard line at ~row 237.        |
| `critic-terrain-0900/0900-close.png`                                                                  | The escarpment as a light-grey wall with vertical striation and a 6–10 px green rim along a nearly straight top edge; the outcrop at left is a symmetric cone with one apex; the dirt trail crosses the meadow with visibly stepped 2 m edges. |
| `critic-terrain-0900/0900-ground.png`                                                                 | Eye level: a sand plain filling the bottom 55 %, the cliff at left, the cone in the middle. **No lake, no causeway, no terrace, no wood deck** — the shoreline is behind the camera.                                                           |
| `critic-terrain-1200/1200-overview.png`                                                               | As 09:00 with a higher sun; the water plane's far edge is a hard straight line with tan apron beyond it. Sand patches read as bald ground rather than beach.                                                                                   |
| `critic-terrain-1200/1200-close.png`                                                                  | The module's best frame: grass with real clumping, a damp dark band down the middle of the trail, mottled rock. The grass↔rock seam is 2–3 px wide with nothing between saturated green and grey.                                              |
| `critic-terrain-1200/1200-ground.png`                                                                 | Noon sand plain with strong wind-ripple relief; escarpment reads as a smooth quarry ramp, outcrop as a cone with a green skirt.                                                                                                                |
| `critic-terrain-1830/1830-overview.png`                                                               | Sunset sky over a completely flat-lit landscape: no cast shadow anywhere, no warm side on any slope. (Not terrain's fault — see §4.6.)                                                                                                         |
| `critic-terrain-1830/1830-close.png`                                                                  | Dark green sheet and a dark grey mass; surface texture barely readable. The module's weakest hour.                                                                                                                                             |
| `critic-terrain-1830/1830-ground.png`                                                                 | The sand's ripple relief has gone flat; the plain is a uniform grey-green under a red-orange sky.                                                                                                                                              |
| `critic-terrain-2200/2200-overview.png`                                                               | Night: silhouettes hold, the escarpment has a dark moonlit face, the sand reads pale grey, the lake dark navy with a faint sheen. Honest night, not dimmed day.                                                                                |
| `critic-terrain-2200/2200-close.png`                                                                  | Moonlit meadow with the grass tile just readable, clean cone and cliff silhouettes, moon in frame.                                                                                                                                             |
| `critic-terrain-2200/2200-ground.png`                                                                 | The sand's ripple relief is **more** readable under moonlight than at 18:30; stars, clean escarpment silhouette.                                                                                                                               |
| `.game-render/crop-jetty.png` (3× crop of `critic-terrain-1200/1200-overview.png` at 480,300–800,420) | The concrete terrace is a ~22 × 12 px pale rectangle, the causeway a thin brown line into the water, and the meadow carries a **regular diamond lattice** — see §4.5.                                                                          |

Demo park — the ground under every other module's frame.

| File                                  | What is actually in it                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-tpark-1200/1200-overview.png` | Rolling green parkland with tree shadows landing correctly on the ground, paths legible, lake top-left. The land ends in a hard sky/land step at rows 231–251 with the true horizon 78 rows above it. |
| `critic-tpark-1200/1200-ground.png`   | Eye level on the promenade: the grass verges are a flat bright green with no readable tile at 3–10 m, hard-edged against the kerb.                                                                    |
| `critic-tpark-1830/1830-close.png`    | Dusk plaza, lamps lit, and **nothing in the frame casts a shadow** — proof the 18:30 flatness is the sun being down, not the ground.                                                                  |
| `critic-tpark-2200/2200-overview.png` | Night park: dark rolling ground with lit paths; the sky/land step is soft here (Δ 0.025–0.082 linear against 0.1768 at noon).                                                                         |

## 4. What to fix, ranked

### 4.1 Extensibility: a pack cannot add a ground layer, and nothing claims the key (the gate)

`grep -rn "registry\|pack\|manifest" lib/game/terrain/*.ts` returns **nothing**. Core landed the
seam this needs — `packManifestSchema` is `.passthrough()`, `Registry.registerPackCategory` claims a
key, `unclaimedPackKeys()` reports the rest — and `paths` and `track` both took it. Measured live in
`terrain-probe-park.json` → `packs`: the claimed categories at boot are exactly
`pathStyles→paths`, `pathMaterials→paths`, `trackElements→track`. I then registered a pack after
boot carrying `groundLayers` and `terrainLayers`; both come back in `unclaimedPackKeys()`
(`afterKeys`) and nothing in the terrain changes.

The catalogue is a `switch (layer)` over `case 0` … `case 5` plus a `default` for wood
(`textures.ts:106`), with `NORMAL_STRENGTH` a 7-element literal beside it and `LAYER_COUNT = 7` a
`const` in `heightfield.ts`. Even if a late registration existed it could not take effect:
`createTerrainTextures` builds `count * 4 * LAYER_COUNT` bytes of albedo and surface array once, in
`main()`, and never again.

The splat rule is in the same state. `CLIFF_SLOPE_START` / `CLIFF_SLOPE_FULL` are two module
constants pushed into the shader UBO; there is no per-park, per-theme or per-pack way to say "this
park's rock starts at 20°". A theme that wants a chalk downland and a theme that wants an alpine
park get the same two numbers.

To be fair to the module: the _rendering_ path is genuinely data-driven — the shader indexes a
texture array by the paint byte and blends four neighbours, and `LAYER_COUNT` drives the build loop.
Nothing switches on a content id at draw time. Replacing `shadeLayer`'s switch with a table of layer
descriptors and claiming a `groundLayers` category would move this axis from 4.0 to something like
7.5 without touching the shader. That is why it is 4.0 and not 3.0. It is still under the gate.

### 4.2 The shadow proxy is a third of every triangle the demo park draws

`terrain-probe-park.json` → `census.groups`: `terrain-shadow-proxy` is one mesh of **32,768
triangles** (stride 2 over a 256-resolution park). `terrain-probe2-park.json` → `shadows`: there is
one `CascadedShadowGenerator` on `sun`, **3 cascades**, 2048 map, whose render list holds 52 meshes
totalling 43,352 triangles — of which the proxy is 32,768, i.e. **75.6 % of everything the sun's
shadow map draws**. Three cascades × 32,768 = 98,304 triangles per frame.

The demo park submits **290,262** triangles at `overview` (`critic-tpark-1200/report.json`, same at
09:00). The proxy is **33.9 % of that**, for a mesh the camera never sees.

Proved a second way, independently of the render list: the terrain showcase at the same camera
measures **141,340** triangles at both 09:00 and 12:00 and **43,038** at 18:30 when the sun is down
(`critic-terrain-0900/`, `-1200/`, `-1830/report.json`). The difference is **98,302** — three copies
of 32,768 to within two triangles.

The proxy has no LOD and no per-cascade variant, so cascade 0, which covers roughly the nearest
30 m, is handed the whole 512 m park at full proxy density. Cascade 2 gets the same mesh again. The
argument in `main.ts` for casting from the proxy rather than from the 64 chunks is right — one mesh
per cascade instead of 64 — but "one mesh" was allowed to mean "one mesh at one resolution for all
three cascades". A stride-4 copy for cascades 1–2 alone would take 98,304 → 32,768 + 2 × 8,192 =
49,152, a **16.7 % cut in the demo park's whole triangle count** for one extra mesh.

Second budget line, smaller but the same shape: terrain is **64 of the 100 meshes** the colour pass
draws at `overview` (`terrain-probe-park.json` → `cameras.overview`: `terrain.meshes` 64,
`activeMeshes` 100) — 62 chunks, the apron and the lake, each its own draw call because they share
one material but are separate meshes. Against 145 total draw calls in that frame, and a 1,200 budget
for a game of twenty-four modules, terrain wants a merge of the far-LOD chunks.

Credit where it is due: the LOD is the best-argued thing in the module and it works.
`terrain-probe2-park.json` → `lod.overview`: 62 chunks in frustum resolve to 2 at level 0, 18 at
level 1 and 42 at level 2, **24,192 triangles drawn against 147,456 if all were level 0** — an
83.6 % cut, over camera distances of 115–646 m. `close` draws 28,864, `ground` 32,256. The cost is
53,248 triangles of resident vertex buffers (the l1 + l2 copies) that are never drawn, which is a
fair trade.

### 4.3 The world's edge — confirmed, and it is not what either earlier critic thought

Confirmed to the digit. `terrain-edge2.mjs` on `critic-tpark-1200/1200-overview.png`, column
x = 620: the largest luminance drop between rows 100 and 420 is at **row 231**, sky **0.4257**
linear (sRGB 172/175/176) → land **0.2377** (sRGB 114/141/111) six rows down. That is the
environment critic's 0.4257 → 0.2377 exactly. The same scan on
`critic-terrain-1200/1200-overview.png` returns the identical pair at the identical row, because it
is the same apron in both scenes. Step rows across the frame run 231–251.

The true horizon: `terrain-probe2-park.json` → `edgePick.horizonRow720` = **153.1**, projected from
the live camera at (163.8, 98.9, −283.7) looking at (0, 8, 0) with a 51.57° vertical fov. The park
boundary along that azimuth projects to row **281.4** (`edgePick.alongAzimuth`, distFromOrigin 256).
So: horizon 153, step 231, boundary 281 — the two earlier critics' 153 / 228–240 / 268, confirmed
independently.

Their arithmetic on planting is right too. A 20 m tree on the boundary, 440 m from the camera,
subtends 2.6° = 36 rows, so it tops out at 281 − 36 = **245** — below the step at 231, exactly as
the demo-park builder said. To reach the step you need ~28 m; to cover the apron's own rim (row
188.1) you need ~52 m. Planting is not the answer.

**But "more apron" is not the answer either, and that is the part nobody measured.** The apron
already runs 1,500 m past the boundary (`SURROUND_REACH`, 12 rings, 3,840 triangles; the
`terrain-surround` bounding box is −1756…+1756 in `terrain-probe-park.json` → `edge.surroundBB`).
Its rim projects to **row 188.1** along the view azimuth and **184.7** at 2,400 m along the camera
ray. The step is at 231. So the visible edge is **not** the apron running out — it is between 800 m
(row 244.4) and 1,000 m (row 227.5) from the camera (`edgePick.alongRay`), which is
`DOME_RADIUS = 900` in `lib/game/environment/sky-dome.ts:43`. The sky dome is drawn at the camera
and occludes everything beyond it, so five of the twelve apron rings — every ring past 666 m,
1,600 of the surround's 3,840 triangles — are built, uploaded and drawn every frame into a depth
region the dome already owns.

So, judged as asked:

- **More apron: zero benefit, and it is already 856 m too long.** Shortening `SURROUND_REACH` to
  ~950 m is a free 1,600 triangles and removes nothing a camera can see. This is terrain's, and it
  is a two-line change.
- **A distance fade into the sky colour: the only thing that closes the seam, and terrain can do
  it.** The module already owns a fragment injection point that writes `surfaceAlbedo`
  (`splat-material.ts`, `CUSTOM_FRAGMENT_BEFORE_LIGHTS`); fading the ground toward the horizon
  colour over the last few hundred metres is a handful of lines in a shader it already maintains,
  and it does not need environment to change anything.
- **Raising the scene fog instead: environment's, and expensive.** The fog is EXP2 at density
  0.000368 (`terrain-probe-park.json` → `edge.fog`), which at 900 m is only 10 % opaque. Solving
  0.198·f + 0.577·(1−f) = 0.4257 for the measured land, measured sky and the scene's own fog colour
  (0.535, 0.587, 0.602) gives f = 0.399, i.e. a density of **0.001065 — 2.9× what it is now**. That
  fogs the whole park, not just the horizon, and is the wrong lever.

The seam is therefore **shared**, and terrain owes the half it has not done. `environment` already
moved to meet it: `sky-model.ts:338–347` says in so many words that the dome paints haze below the
horizon _because_ "at the `overview` preset the terrain's far edge sits ~75 px below the true
horizon". That is this exact 78 rows. One module has adjusted for the other and has not been
adjusted for back.

### 4.4 The IBL ground terminator: the two do not agree, and terrain has no say

`terrain-probe-park.json` → `ibl` on the demo park: `sceneEnvironmentTexture: "env-ibl"`,
`groundReflection: null`, `probeAlive: false`. So `env-probe.ts` — 152 lines of procedural sky cube
written as a stand-in — is handed back the moment environment's cube exists, which is every scene
that loads the environment module, including the terrain showcase. It is dead code in practice.

That matters because the two hemispheres disagree, in both colour and hardness:

|                                                              | ground colour (linear) | normalised        | ramp                             |
| ------------------------------------------------------------ | ---------------------- | ----------------- | -------------------------------- |
| `environment/sky-model.ts:188`                               | 0.0370, 0.0420, 0.0260 | 0.881 / 1 / 0.619 | dy 0.03 → −0.06, **5.2° of arc** |
| `terrain/env-probe.ts` (dropped)                             | 0.0665, 0.0700, 0.0525 | 0.950 / 1 / 0.750 | up 0 → −0.4545, **27° of arc**   |
| measured, `critic-tpark-1200/1200-overview.png` lower 45 %   | 0.0907, 0.1692, 0.0516 | 0.536 / 1 / 0.305 | —                                |
| measured, `critic-terrain-1200/1200-overview.png` lower 45 % | 0.2901, 0.3412, 0.1957 | 0.850 / 1 / 0.574 | —                                |

(`terrain-edge.json` → `groundMeanLinear` / `groundMeanNormalised`; the park figure includes tree
canopy, which is what actually bounces light there.)

Two readings, both fair:

1. **The knife edge is environment's.** Its ramp is 5.2° of arc against terrain's own 27°, which is
   why it shows as a hard line on a mirror ball. Terrain's dropped stand-in was five times softer
   and would not have.
2. **The colour is a statement about terrain that terrain never made.** Environment's ground is
   normalised 0.881 / 1 / 0.619 — almost exactly the terrain **showcase's** measured 0.850 / 1 /
   0.574, and nothing like the demo park's 0.536 / 1 / 0.305: 1.64× too much red and 2.03× too much
   blue relative to green. The IBL is tuned to a sandy escarpment showcase and used over a wooded
   park. Terrain knows the answer and does not publish it: `terrain-probe-park.json` →
   `terrain.paintHistogram` gives the demo park as 72.2 % grass, 14.6 % meadow, 7.5 % concrete,
   3.9 % dirt, 0.9 % sand, 0.9 % wood, **0 % rock**, and the per-layer albedos are right there in
   `textures.ts`. A one-line `api.groundAlbedo()` on `TerrainMainApi` — the mean of the layer
   albedos weighted by the paint histogram — would let environment stop guessing. That is terrain's
   half and it is cheap.

### 4.5 The splat: one slope break, and 17.4 % of the park is on the wrong side of it

Checked against the slopes the demo park actually produces, per cell, from
`terrain-probe-park.json` → `terrain.slopeBinsDeg5` (65,536 cells at 2 m):

| slope |   0–5° |  5–10° | 10–15° | 15–20° | 20–25° | 25–30° | 30–35° | 35–40° | 40–45° | 45–50° |  >50° |
| ----- | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | ----: |
| cells | 32,346 | 20,982 |  8,255 |  1,836 |  1,247 |    365 |    208 |    139 |    119 |     39 | **0** |

The material blends rock over `smoothstep(1−cos 26°, 1−cos 45°)`. On this park that means:

- **1.22 % of cells are ≥ 26°** and get any rock at all; **0.06 % are ≥ 45°** and get it at full
  strength. The module's flagship visual feature — a triplanar cliff blend with its own 7 m tile —
  touches roughly one hundredth of the ground it ships under. In the showcase it is everywhere; in
  the game it is a rounding error.
- **3.44 % of cells (2,255, ≈ 9,020 m²) sit in 17–26°** and **17.39 % (11,396 cells, ≈ 45,584 m²)
  sit in 10–26°**, every one of them drawn as flat lawn.

I have to correct the demo-park critic on the cause, though the finding stands. "Too steep for
grass" is not true of any rule in the tree: `scenery/scatter.ts:240` thins planting from
`maxSlope × 0.55`, and the species' `maxSlope` values are 0.4–0.9, i.e. the fade starts at 38.7° at
the earliest. Nothing refuses to plant at 17°. What is true is simpler and worse: **the module's
whole slope response is one switch.** It ships seven layers and the slope rule uses exactly one of
them. There is no thin-soil, scree or bare-earth band between lawn and cliff, and `dirt` — which
already exists, is already in the array, and is exactly the right colour — is used only where a
generator paints it by hand. A second, gentler ramp blending `dirt` in from ~12° to ~26° would put
something on 17 % of the park that currently has nothing, and would cost no new texture, no new
uniform and no new draw.

Two smaller splat findings from the frames:

- **The apron takes the paint's edge row under CLAMP addressing, and the showcase's own edge is
  underwater.** `landscape.ts` paints `LAYER_DIRT` below −2.6 m; the showcase's south boundary is
  lake bed; so ~700 m of horizon in `critic-terrain-0900/0900-overview.png` and
  `1200-overview.png` is a flat brown plate, measured sRGB 133/128/122 with a 61.1 % spread
  (`terrain-patch.mjs`, rect 60,245–430,275). This is the exact failure `demo-park/landform.ts:281`
  documents and works around with `if (norm > PARK_HALF - 8) return LAYER_GRASS`. The workaround
  lives in the consumer; the module's own showcase has the bug. Clamping the splat sample to the
  park and fading the apron to a neutral far-field colour belongs here.
- **The LOD-2 chunks show their triangulation.** `.game-render/crop-jetty.png` (3× crop of the
  1200 overview) shows a regular diamond lattice across flat meadow at a pitch of ~16 px in the
  original, which is 8 m at 400 m through a 51.57°/720 px frame — the stride-4 vertex spacing.
  `chunks.ts` argues, correctly, that normals must come from the full-resolution heightfield at
  every LOD so shading does not jump at a threshold; but it _point-samples_ that field at 8 m
  spacing, so each big triangle inherits one sample of 2 m relief and Gouraud interpolation draws
  the mesh. The fix is to filter rather than point-sample — average `sampleNormal` over the LOD's
  own footprint — not to go back to strided normals.

### 4.6 The frame, hour by hour — and one thing that is not terrain's fault

Strong: the grass at `close` measures mean linear 0.1193 with **sd/mean 26.1 % and a p5–p95 spread
of 85.1 %** (`terrain-patch.mjs`, `critic-terrain-1200/1200-close.png`, rect 520,460–900,620), the
cliff face 26.3 % / 82.1 % (rect 700,90–1100,200). Set against the 2.9 % the `paths` critic measured
on that module's flagship concrete, this is a surface and not a tinted plane, and it survives being
squinted at. Night holds: `2200-overview`, `2200-close` and `2200-ground` are all legible, with the
sand's ripple relief _better_ readable under moonlight than at 18:30.

Weak:

- **The sand.** 28.8 % spread against grass's 85.1 %, and it occupies the bottom 55 % of every
  `ground` frame — the flattest surface in the module is the one a visitor stands on.
- **The escarpment's silhouette.** In `1200-close.png` its top edge runs nearly straight for ~800 px
  under a uniform 6–10 px green rim. `landscape.ts` varies the rise and width along the line
  specifically so it does not read "as a retaining wall"; at the framings the module ships, it
  still does.
- **The outcrop is still a cone.** `landscape.ts`'s `bump()` docblock says the warping stopped it
  being "a traffic cone"; in `0900-close.png` and `1200-ground.png`, from two different azimuths, it
  is a symmetric peak with a single apex and a near-radial base. The frame wins.
- **The showcase's staging.** `showcase.ts` says the module has to answer for "the escarpment in the
  north, the meadow and terrace in the middle, and the lake in the south with a stone causeway
  running out into it", and places the `ground` preset at (0, 1.7, 120) _north of the shore_, so the
  one eye-level camera looks away from three of the four. Across all twelve showcase frames the
  concrete terrace and the wood deck appear only in the two overview shots, at ~22 × 12 px
  (`crop-jetty.png`). Two of seven paint layers are effectively unshown, and the water — 227 lines,
  its own material, baked depth ramp, two scrolling wave trains — is a dark band in the corner of an
  aerial shot.

**And one accusation I will not make.** At 18:30 the terrain is flat in all three cameras, with no
cast shadow and no warm side on any slope. That is not the ground: `critic-tpark-1830/1830-close.png`
shows a whole demo park at dusk — trees, lamps, benches, a fountain — in which **nothing casts a
shadow either**. The sun is below the horizon at 18:30 on this clock while the dome still paints a
sunset. It is environment's to answer, and terrain is not debited for it. The consequence for this
grade is that no frame at any hour shows this ground under a genuinely low sun, which is the light
that would test the normal maps hardest.

### 4.7 `ground()` is documented as pickable and is not, and on `low` it is not the park

`TerrainMainApi.ground()` says "The full-park proxy mesh: invisible to the camera, **pickable**, and
the sun's shadow caster. Use it for `scene.pick` predicates". Measured
(`terrain-probe2-park.json` → `api`): `groundMeshName: "terrain-shadow-proxy"`,
**`groundIsPickable: false`**. `scene.pick` with its default predicate cannot see it.

Worse, `main.ts` returns `meshes.shadowProxy ?? meshes.surround`, and `shadowProxy` is null on the
`low` preset (`chunks.ts`, `shadowProxy: ctx.quality.preset !== 'low'`). `terrain-surround` is a
ring built from the boundary outwards — its bounding box is ±1756 with a 512 × 512 hole where the
park is. So on `low`, the accessor documented as "the full-park proxy mesh" returns a mesh with no
geometry over the park at all. Nothing outside the module calls `.ground()` today
(`grep -rn "\.ground()" lib/game --include=*.ts` finds no caller outside `terrain/`), so this is
latent rather than live — which is why it is ranked here and not higher.

### 4.8 Boot cost, and the honesty of the missing report

`terrain-probe-park.json` → `brush.stats`: `textureMs` 488–560, `buildMs` 572–660. That is roughly
0.55 s of synchronous main-thread work — seven layers of 512² albedo + surface, plus the macro and
two water maps, plus 195 meshes' vertex data — inside a 10,581 ms demo-park boot
(`critic-tpark-0900/report.json` → `bootMs`). About 6 % of boot, but in one unbroken block, and it
is the first thing a cold start does.

The brush timings the module's docblock claims ("the difference between 1.5 ms and ~90 ms") I could
not verify and do not credit or debit: the rebuild is deferred to the next `onRender`, and under
SwiftShader a frame is ~1.6 s, so my measurements (727–1,393 ms) are frame time and say nothing
about the rebuild. That is a gap this module could close itself with a selftest; it has none.

On axis 6: **`docs/game/reports/terrain.md` does not exist.** Neither does
`docs/game/requests/terrain.md`, which `env-probe.ts` cites by name in its own docblock as where the
IBL was requested. Five other modules have both. There is therefore no "what is weak" section, no
list of failed rounds, and nothing for the next builder to read first. Against that: the docblocks
are unusually specific and several of their claims survived checking — the reversed winding, the
per-edge skirt derivation, the argument for full-resolution normals at every LOD, the reasoning for
an apron that rises rather than sinks, and the regex injection point for roughness are all real and
all correctly described. Two are contradicted by the artefacts (§4.6 the cone, §4.7 "pickable").
2.5.

## 5. Ranked list of what to fix

1. **Claim a pack category and move the layer catalogue out of TypeScript.**
   `registerPackCategory('groundLayers', 'terrain')`, a descriptor table replacing `shadeLayer`'s
   `switch (layer)`, and `CLIFF_SLOPE_START`/`FULL` per park rather than per module. Justification:
   extensibility is **4.0**, under the gate of 5, and this alone fails the module regardless of
   everything else. `terrain-probe-park.json` → `packs.afterKeys` shows core already reporting
   `groundLayers` as unclaimed.
2. **Give the shadow proxy an LOD.** 32,768 triangles × 3 cascades = 98,304 = **33.9 %** of the
   290,262 the demo park submits at `overview`; a stride-4 copy for cascades 1–2 takes that to
   49,152, a 16.7 % cut in the whole frame's triangle count.
3. **Fade the ground into the horizon colour, and shorten the apron to the dome.** The sky/land step
   is 0.4257 → 0.2377 linear across 6 px at row 231 with the true horizon at 153. The apron reaches
   1,756 m and the dome cuts it at 900 m, so 1,600 of its 3,840 triangles are permanently occluded;
   more apron cannot help and 28–52 m of planting is not plantable. The fade belongs in the fragment
   injection point the module already owns.
4. **A second slope ramp between lawn and cliff.** 17.39 % of the demo park's cells (11,396 of
   65,536, ≈ 45,584 m²) sit between 10° and 26° and are drawn as flat lawn; only 1.22 % ever see any
   rock. The `dirt` layer is already in the array.
5. **Clamp the splat sample to the park and neutralise the apron's colour.** The showcase's own
   overview has ~700 m of brown horizon (sRGB 133/128/122) because the boundary paint row is lake
   bed; `demo-park/landform.ts:281` already carries the workaround this module should not need.
6. **Publish a ground albedo for the IBL.** Environment's lower hemisphere is normalised
   0.881/1/0.619 against the demo park's measured 0.536/1/0.305; terrain holds the paint histogram
   and the per-layer albedos and exposes neither.
7. **Filter the LOD normals instead of point-sampling them.** The stride-4 triangulation is visible
   as a 16 px diamond lattice on flat meadow at `overview` (`crop-jetty.png`).
8. **Re-stage the showcase.** Turn the `ground` preset to face the lake, or move the shore; two of
   seven layers and the entire water system appear in no eye-level frame at any of the four hours.
9. **Fix `ground()`**: set `isPickable = true` on the proxy or correct the docblock, and do not fall
   back to the apron on `low` — it has a 512 × 512 m hole where the park is.
10. **Merge the far-LOD chunks and add a selftest.** Terrain is 64 of the 100 meshes the colour pass
    draws at `overview`; and `pnpm test:game` contains no terrain assertion, which is why the
    docblock's 1.5 ms / 90 ms brush claim has never been checked by anything.

## 6. Verdict

**FAIL — 6.04 weighted, and extensibility 4.0 is under the hard gate of 5.**

This is not a weak module. The determinism is the best in the game so far, the LOD is right and
measured, the grass and rock have more tone in them than anything `paths` or `scenery` put on the
screen, and the night frames hold. What fails it is that the ground is a fixed set of seven layers
with a single slope rule welded into TypeScript, and that a third of the demo park's triangle budget
goes to one invisible mesh drawn three times. Both are fixable without touching the shader, and both
are worth a round two.
