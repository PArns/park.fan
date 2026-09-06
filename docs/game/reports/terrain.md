# terrain — module report

Heightfield, chunked meshes with LOD, the splat material and its seven ground layers, the surround
apron, the shadow proxy, brush editing and the raycast the build tools pick against.
Folder: `lib/game/terrain/` (13 files).

> **This report did not exist until round 2, and that is the first thing it has to say.** The
> round-1 critique (`docs/game/critiques/terrain-round1.md`) graded the module at **6.04 with
> extensibility at 4.0 — under the 5.0 floor, so a hard-gate failure, the first in this gauntlet**
> — and scored honesty at **2.5**, which is what a missing report earns. `docs/game/requests/
terrain.md` did not exist either, though `env-probe.ts` cites it by name. Both are written now,
> by the integrator; the module's own builder was one of the twenty that never started when the
> first fan-out died on the account session limit.

## What exists

| File                          | What it owns                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `heightfield.ts`              | `TerrainData`, sampling (`sampleHeight`/`sampleNormal`/`samplePaint`/`sampleSlope`), the brush, `LAYER_*`. Pure, worker-safe. |
| `manifest.ts`                 | The seven ground layer recipes as **data**, `registerGroundLayer`, `attachGroundLayers`. New in round 2.                      |
| `chunks.ts`                   | 8×8 chunks × 3 LODs, the surround apron, the shadow proxy.                                                                    |
| `material.ts` / `textures.ts` | The splat material and its layer texture arrays, generated from noise.                                                        |
| `landscape.ts`                | `generateShowcaseLandscape` — the terrain the showcase and the tests run on.                                                  |
| `noise.ts`                    | `fbm2`, `ridgedFbm`, `tileableFbm`, `valueNoise`. Public since `demo-park` needs them.                                        |
| `env-probe.ts`                | A ground-colour probe for the IBL. **Dead code** — see below.                                                                 |

## Round 2 — what the critique asked for

**Extensibility, 4.0, under the floor.** The finding was blunt: this module touched `registry`,
`pack` and `manifest` nowhere at all; a pack registered after boot carrying `groundLayers` came
back in `unclaimedPackKeys()` and changed nothing; the catalogue was a `switch (layer)` over
indices 0–5 with twenty-one colour constants beside it.

The split now is the one `paths/manifest.ts` already uses, and it is the one that is actually true
of a procedural surface: **the pattern is an algorithm and stays in code** — wind ripples along one
axis, eight boards across a tile, ridged creases — while **the colours, the roughness and the
relief are numbers and come from a manifest**. `attachGroundLayers` claims the category, walks
`registry.packs()` and subscribes to `onPack`; both are needed, because `onPack` fires on
registration and the bundled packs are registered before any module is built.

A pack can **retint a built-in in place** — by id, so the paint array's indices keep meaning what a
save written last week says they mean — or **add one past the built-ins**. `LAYER_COUNT` stays at 7
and that is a stated limit rather than an oversight: the splat weights are a paint index in a
`Uint8Array` and the layer maps are one texture array sized at build time, so an eighth _drawn_
layer is a change to the array and the shader. A recipe naming a pattern this build does not have
is named and skipped, not thrown, so one bad entry cannot take the other six down. Pinned by
`pnpm test:game-registry`:

    grass dark before: [0.227, 0.329, 0.125] → after: [0.42, 0.36, 0.16]
    layer count: 7 → 8 (laterite added; the entry with pattern "nope" skipped by name)
    unclaimed keys: []

**The shadow proxy was 33.9 % of the whole frame.** Stride 2 over a 256-cell heightfield is 32,768
triangles, rendered once per cascade: 98,304 of the demo park's 290,262 at `overview`. The critic
proved it twice — the render list came out 75.6 % proxy, and the showcase's 141,340 triangles at
noon against 43,038 at 18:30 differ by 98,302. The single largest item in the game's triangle
budget was a mesh nobody can see.

Stride 4 now (3 on `ultra`, which can afford contact hardening and a 620 m cascade range). A quad
every 8 m on a 512 m park keeps every feature this proxy exists to cast — the demo park's hills are
50 to 140 m across — and loses only detail finer than a shadow map's own texel. Measured at
`overview`: **290,262 → 216,534 triangles, −73,728, −25.4 %, at an unchanged 145 draw calls**, and
the frame is indistinguishable from the one before it.

## What is weak or missing, ranked — all measured by the round-1 critic, none fixed

1. **The world's edge, and both fixes previously recorded for it were wrong.** The apron already
   runs to **1,756 m** and projects to screen row 188; the visible step is at row 231 and 900 m out,
   which is `DOME_RADIUS` in `sky-dome.ts`. So **more apron cannot help** — 1,600 of the surround's
   3,840 triangles are already permanently occluded by the dome — and planting needs 28–52 m, not
   the 65 m the demo-park builder estimated. `STATUS.json` carried "more apron, or a distance fade"
   against this module for three rounds and half of that was false. The one lever that works is a
   distance fade in the fragment injection point terrain already owns; the fog alternative needs
   2.9× the density and belongs to `environment`.
2. **The slope rule has one break and it is in the wrong place.** 1.22 % of the park is ≥26° and
   ever sees rock, while **17.39 % sits between 10° and 26° and is drawn as flat lawn**. (This also
   corrects the demo-park critique, which blamed a 17° cut slope on a planting refusal: nothing
   refuses to plant at 17°, `scatter.ts` fades from 38.7°.)
3. **`env-probe.ts` is dead code in every scene that loads `environment`** (`probeAlive: false`),
   and the two modules disagree twice about what the ground looks like: environment's IBL ground
   ramp is 5.2° of arc against terrain's own dropped 27°, and its colour (normalised
   0.881/1/0.619) matches the _showcase's_ measured 0.850/1/0.574 but not the demo park's
   0.536/1/0.305. Terrain holds the paint histogram (72.2 % grass, 0 % rock) and the layer albedos
   and publishes neither.
4. **Two docblock claims are contradicted by the frames.** The rock outcrop is documented as broken
   up and is still a cone. `ground()` is documented "pickable" and measures `isPickable: false` —
   and on `low` it returns the apron, which has a 512 × 512 m hole where the park is.
5. **No critic has re-graded any of this.** The numbers above are the integrator's own
   measurements, taken with the same harness, and they are not a grade.

## Requests for core

`docs/game/requests/terrain.md`.
