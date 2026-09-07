# camera — builder report

The park camera a person drives, the framing helpers other modules aim with, and the preset
catalogue the screenshot harness asks for by name. Folder: `lib/game/camera/` (10 TypeScript files,
2,497 lines, plus a 739-line selftest). Nothing outside it was touched except this report and
`docs/game/requests/camera.md`.

It replaces `FALLBACK_PRESETS` in `core/host.ts`, which existed because this module did not, and
which every screenshot in the project up to now was taken with. The fallback stays where it is: the
harness seam tries `handles.get('camera')?.api.preset(name)` first and falls back only when this
module answers `false`, so a scene with no camera module — or with one that failed to build — still
has seven working framings.

**It creates nothing.** Zero meshes, zero materials, zero textures, zero lights, zero draw calls,
and — measured by grep and confirmed in the running scene — zero runtime Babylon imports: the five
`@babylonjs/core` lines in the whole folder are `import type`.

## What exists

| File            | Lines | What it owns                                                                                                                                        |
| --------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pose.ts`       |   403 | The maths. Babylon's spherical formula re-derived from source, the leash, `clampPose`, screen rays, rigid rotate/scale about a pivot, damping.        |
| `controller.ts` |   368 | The drive loop: goal pose + displayed pose, grab-the-world pan, orbit and zoom about the cursor, momentum, the terrain-follow channel.                |
| `input.ts`      |   293 | Pointer / wheel / keyboard / touch → intents. One Pointer Events path for mouse, trackpad, pen and phone. Edge scroll.                                |
| `main.ts`       |   513 | The Babylon glue: drives the scene's `ArcRotateCamera`, adopts outside writes, the public API, follow sources, view persistence.                      |
| `manifest.ts`   |   298 | Presets as content: the seven built-ins, the parser, the `cameraPresets` pack category, `poseFromPreset`.                                             |
| `anchors.ts`    |   202 | What a preset points at: `park:*`, `plot:`, `entity:`, `kinds:`, `xz:`, plus a table modules can add to. Chains with `\|`.                            |
| `types.ts`      |   172 | The vocabulary, and the two authoring conventions (`bearing`, `pitch`) that exist so nobody writes `beta = PI/3.4` again.                             |
| `view-state.ts` |   102 | Where the pose is remembered, and the argument for why that is not `world.modules`.                                                                   |
| `showcase.ts`   |    71 | `/game?showcase=camera`: terrain with relief, plus three presets that make the leash and the ground floor photographable.                             |
| `index.ts`      |    75 | The `GameModule` and the pure re-exports. No `sim` half.                                                                                              |
| `selftest.mjs`  |   739 | 114 checks over the pure half. Wired into `pnpm test:game` as `test:game-camera` by the integrator after this was written.                            |

### Public API

```ts
// ctx.module<CameraMainApi>('camera')  — import the type from '@/lib/game/camera/main'
preset(name, opts?): boolean          // false for an unknown name → the harness falls back
presets(): CameraPresetDef[]
registerPreset(entry): CameraPresetDef        // same schema as a pack's `cameraPresets` entry
anchor(chain): AnchorSample | null            // 'kinds:shop | plot:coaster | park:centre'
registerAnchor(prefix, resolve): () => void
focus(target, opts?): boolean                 // eases; picks a distance from how big the thing is
follow(id | null, opts?): boolean
following(): string | null
mode(): 'free' | 'follow'
registerFollowSource(fn): () => void          // trains will use this
pose(): CameraPose
setPose(partial, opts?): void
screenToGround(clientX, clientY): Vec3 | null // for the build tools
bounds() / setBounds(patch)
controls() / setControls(patch)                // pan/orbit buttons, edge pan, enable
forget(): void                                 // drop the remembered view
stats(): CameraStats
```

Emits `camera:mode` (`{ mode, target }`) on every mode change.
Owned world state: **none**. `world.modules` has no `camera` key, verified on the running game.

### Presets, and how a pack adds one

The seven the harness names — `overview`, `entrance`, `close`, `ground`, `coaster`, `pool`,
`night` — are entries in `CAMERA_PRESET_MANIFEST`, and a content pack replaces or adds to them by
dropping objects under a `cameraPresets` key:

```jsonc
{ "id": "lookout", "anchor": "kinds:coaster | plot:coaster | park:centre",
  "height": 10, "bearing": 200, "pitch": 20, "frameRadius": "auto", "fill": 0.5 }
```

`registry.registerPackCategory('cameraPresets', 'camera')` claims the key so
`unclaimedPackKeys()` stops reporting it, and the module reads it **both** by walking
`registry.packs()` at boot and by subscribing to `onPack` — the trap four earlier modules fell
into, because `onPack` fires on registration and the bundled packs are registered at `host.boot()`
step 2, before any module's `main()` at step 5.

Nothing in the module switches on a preset id or a content id.

## Two decisions worth arguing with

### 1. It drives the renderer's camera instead of making its own

`core/renderer.ts` builds the `DefaultRenderingPipeline` — ACES tone mapping, FXAA, bloom, the
vignette — and the SSAO2 pipeline **bound to that camera object**. A camera module that created a
fresh camera and set `scene.activeCamera` would render a park with no tone mapping and no
anti-aliasing, and the frame would read as a lighting regression rather than a camera bug. Measured
on the running scene with this module active, `scene.activeCamera._postProcesses` still holds
`highlights, horizontal blur, vertical blur, bloomMerge, imageProcessing, fxaa`.

Five other modules would break with it too: `terrain`, `environment`, `paths`, `scenery` and
`shops` stage their showcases by writing `scene.activeCamera as ArcRotateCamera` directly
(`camera.alpha = …; camera.target.set(…)`), and against a `FreeCamera` those are four properties
nobody reads.

The consequence is that this module has to **adopt** a pose written from outside rather than fight
it: every frame it compares the camera against what it last wrote, and a difference becomes the new
goal. Last write wins, whoever wrote it. `showcase.ts` deliberately writes the camera directly at
the end of staging, so the showcase is also the test of that path.

The argument against: a photo mode with its own depth of field, or a minimap, would want a second
camera, and this module would then be driving whichever camera happened to be active when `main()`
ran. The honest fix is core handing the camera over in `MainContext` beside `lights` — filed as
request §2.

### 2. The pose is not world state, and `ARCHITECTURE.md` §4 says it is

The module table lists `modules.camera` ("last view") as this module's owned world slot. That is the
wrong side of the line, for three reasons, in order of how expensive each would be to discover
later:

1. **It would not work.** `world.modules` is serialised by `serializeWorld()` in the **worker**,
   from the worker's copy — `host.boot()` calls `cloneWorld(world)` before `init`. The camera exists
   only on the main thread. A pose written into the main thread's `world.modules.camera` would be
   read by nothing and saved by nothing, and would look exactly like a working feature. That is the
   shape of the `?weather=` bug core documents in `finishBoot`, and of `env-probe.ts` being dead
   code for a round.
2. **Axis 5 asks that owned state be written by exactly one side.** A pose changes on every mouse
   move; routing that through a command into the tick log to satisfy the rule would put dozens of
   entries a second into `world.log` for something no simulation reads.
3. **A save is shared.** Loading somebody else's park should not teleport the reader to wherever
   that person's mouse was.

So it lives in `localStorage`, keyed by world name and seed, and is skipped entirely when
`?harness=1`, `?showcase=` or `?cam=` is present. That guard is the load-bearing half:
`scripts/game-shot.mjs` always sets `harness=1`, so a restored pose can never make two runs
disagree — which is the failure this would otherwise introduce into every critique in the project.
`api.pose()` / `api.setPose()` stay public, so `persistence` can put a view in a save slot if it
ever wants one.

## What is measured, and how

### The angles, and the bug this module is downstream of

`core/host.ts`'s preset docblock records two rounds spent reading a frame with no horizon in it as
evidence about the sky, because Babylon's `beta` is the angle from **+Y**. This module authors
presets in `bearing` (compass degrees from north, north = −Z) and `pitch` (degrees below the
horizon) and derives `alpha`/`beta`, and it publishes the arithmetic that would have caught the bug
in one line:

```
horizonRow(pitch, fov, height) = height/2 * (1 - tan(pitch) / tan(fov/2))
```

At `fov = 0.9` the vertical half-angle is 25.78°. `horizonRow(15.52°)` is **153.3** of 720 — the
number the host docblock quotes — and `horizonRow(37.06°)`, the old `overview`, is **−70**: off the
top of the frame, no horizon, no sky, at any time of day. `stats()` reports the current value for
exactly that reason. The fallback's `coaster` and `pool` are both at 30° down, i.e. −70 as well; the
versions here are at 20°, horizon row 88.7.

## Verification

**Who ran this.** The builder died on the account's session limit part-way through its own
verification, with the module, this report and `requests/camera.md` already written. Everything
below was re-run from scratch by the integrator, and every frame named here was opened and looked
at. Three numbers in the body above were wrong when that happened and are corrected in place: the
folder is 2,497 TypeScript lines and a 739-line selftest (not 2,492/734), and there are **five**
`@babylonjs/core` lines in it, not three — all five still `import type`, which is the claim that
mattered.

### Commands

| command                                             | result                                    |
| --------------------------------------------------- | ----------------------------------------- |
| `pnpm test:game-camera` (the selftest)               | `✓ camera selftest: 114 checks clean`     |
| `pnpm test:game`                                     | 92 green checks, exit 0                   |
| `npx tsc --noEmit`                                   | clean                                     |
| `npx eslint lib/game/camera`                         | clean                                     |
| `grep -rn '^import .*@babylonjs' lib/game/camera/`   | 5 lines, 0 of them a runtime import       |

### The running game, asked rather than read

`.game-render/_probe/cam-probe.mjs` against `/game?harness=1&speed=0&engine=webgl2`, which is the
only way to check the four claims a screenshot cannot show:

| claim                                     | measured                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| the module builds                         | `failedModules: []`                                                       |
| it owns no world state                    | `Object.keys(world.modules)` = `['demo-park', '__ids']`                    |
| it claims its pack category               | `registry.unclaimedPackKeys()` = `[]`                                      |
| the seven presets are live                | `presets()` = overview, entrance, close, ground, coaster, pool, night      |
| the fallback seam works                   | `preset('does-not-exist')` → `false`, `preset('overview')` → `true`        |
| it drives the pipeline's camera           | `ArcRotateCamera`, post-processes `highlights … imageProcessing, fxaa`     |
| it creates nothing                        | `stats().meshes` = 0, `stats().materials` = 0                              |
| the harness never restores a pose         | `Object.keys(localStorage)` = `[]` under `?harness=1`                      |
| the build tools' hook answers             | `screenToGround(640, 400)` = `(−21.89, 0.30, 37.92)`                       |
| console                                   | 0 errors                                                                  |

### The seven presets, photographed

Demo park, 1280×720, WebGL2 under SwiftShader, `--step=900` (park minute 764), `--tod=12:00`,
`.game-render/cam-presets/`. **0 console errors, 0 warnings, 0 hydration warnings** over the run.

| preset     | draw calls | triangles | what the frame shows                                                             |
| ---------- | ---------: | --------: | -------------------------------------------------------------------------------- |
| `overview` |        210 |   422,534 | the whole park with the lake right of centre, horizon and sky in the top third    |
| `entrance` |        260 |   794,886 | the gate at the bottom edge, the forecourt, the main street receding to the north |
| `close`    |        323 | 1,290,243 | a plaza at reading distance, guests and benches legible, canopies over the frame  |
| `ground`   |        339 | 1,373,581 | eye level down the main street: kerbs, lamps, benches, both rows of shops         |
| `coaster`  |        214 |   809,955 | woodland and empty ground — **there is no coaster**, see requests §6              |
| `pool`     |        239 |   591,462 | the lake, framed and filling about a third of the frame                           |
| `night`    |        252 |   797,690 | the forecourt from above (this is a framing; the time of day is a separate axis)  |

`night` again at `--tod=23:00` (`.game-render/cam-night/`, 125 draw calls / 168,182 triangles):
lamp pools along the promenade, one lit shop, stars, 33 guests left in the park. The two presets
that frame nothing are honest failures of the world and not of the module — `world.entities` holds
`path`, `scenery` and `shop` and nothing else, so `kinds:coaster` and `kinds:pool` resolve through
their chains to a reserved plot and to the lake.

### The showcase

`/game?showcase=camera`, `.game-render/showcase-camera/`. Each of the three presets is registered
through the module's own public `registerPreset()`, so a frame arriving at all is the extensibility
path working: `presets` goes 7 → 10 in `stats()`.

- **`leash-out`** (the camera at the target leash, looking away from the park) **shows the world
  ending**: the showcase landscape's patch edge stands as a cliff and the water slab is cut off in
  mid-air. That is what this frame exists to answer, and the answer is no — on this terrain. On the
  demo park the same test passes, because its apron runs to 1,756 m and the far edge fades into
  haze well before the dome. Recorded as an open issue rather than claimed as a pass.
- **`floor`** (a nearly horizontal camera with its target on the ground, on relief): the eye stayed
  above ground and the frame is a wide landscape, which is `clampPose`'s ground rule holding.
- **`top`** (pitch 84°): a near-vertical map view, i.e. the opened beta limit.

Two WebGL warnings — `INVALID_VALUE: bufferSubData: buffer overflow`, twice — appear in this
showcase. They are **not** this module's: `--showcase=terrain`, which shares
`generateShowcaseLandscape` and has no camera module doing anything, logs the identical pair.
Filed against `terrain`.

And the showcase's direct write to `scene.activeCamera` still wins after boot — measured with no
`?cam=`, the pose is `target [0, 6, 10], alpha −1.2083, beta 1.22, radius 260`, which is
`showcase.ts` line for line. That is the adopt path, tested.

### One thing the verification changed

The probe caught the module inheriting the renderer's opening pose: **93.7 m up, 33.75° down,
`horizonRow` −138** — the horizon off the top of the frame and a park that opens with no sky in it,
which is the exact failure this module publishes the arithmetic for. It was not visible in any
screenshot in the project because the harness always applies a preset. `main()` now applies
`overview` when there is nothing remembered to restore: **105.8 m, 15.5° down, `horizonRow`
153.3**, and the frame (`.game-render/_probe/boot-pose.png`) opens with a horizon and a third of it
sky. A remembered view, a showcase's write and `?cam=` all still win over it, each verified after
the change.

### What is not verified, and why

- **Nobody has driven this with a hand.** A headless harness has no mouse: pan, orbit, zoom,
  momentum and edge scroll are covered only by the selftest's 900 frames of synthetic input. The
  first person to open `/game` on a desktop is the first real test of `input.ts`.
- **Follow mode has never followed anything that moves.** `trains` does not exist; the `track:`
  stand-in was not photographed.
- **Touch, WebGPU and a high-DPI display** are all untested here — headless Chromium under
  SwiftShader is none of them.
- **fps is meaningless in every number above.** SwiftShader renders at 1–2 fps whatever the scene;
  draw calls and triangle counts are real.
