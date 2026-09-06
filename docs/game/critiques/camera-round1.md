# camera — critic, round 1

Module: `lib/game/camera/` (10 files, 2,497 lines, plus a 739-line selftest) · showcase
`/game?showcase=camera` · also every framing every screenshot in this project is now taken with ·
commit `c0f4c7e`.

**Weighted total: 8.38. FAIL by 0.12** (pass is 8.5), no hard gate failed.

**Disclosure, because it changes how much this grade is worth.** The camera builder died on the
account session limit during its own verification; the integrator finished the verification, wrote
the report's Verification section, corrected three numbers in the report body that were wrong, and
added the opening framing described in §4.1. The same integrator is writing this critique. It is
not an independent grade and no independent grade exists on this branch — every critic fan-out died
the same way. Read the numbers, not the score.

## 1. Scores

| #   | Axis                  | Weight | Score   | One sentence                                                                                                                                                             |
| --- | --------------------- | -----: | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | **8.2** | It draws nothing, so it is graded on what its framings make: `ground` is the most park-like image in the project and `overview` finally has a horizon in it — and two of the seven presets frame bare ground. |
| 2   | Fidelity              |   20 % | **7.5** | Grab-the-world pan, orbit and zoom about the cursor, momentum, terrain follow and an eye leash are all implemented against the right reference — and **nobody has ever driven this with a hand**. |
| 3   | Extensibility         |   20 % | **9.0** | Presets are content, the category is claimed and read at boot **and** on `onPack`, anchors and follow sources are both open registries, and a pack-supplied preset is the only pack content in this game that has been photographed. |
| 4   | Budget and behaviour  |   15 % | **8.8** | **0 meshes, 0 materials, 0 draw calls, 0 triangles, 0 runtime Babylon imports** and no sim half. No dispose/reboot leak measurement.                                     |
| 5   | Determinism and state |   10 % | **9.0** | No owned world state at all — `world.modules` has no `camera` key — the pose lives in `localStorage` and is skipped under `?harness=1`, so it cannot make two runs disagree. |
| 6   | Honesty of the report |    5 % | **8.0** | An unusually complete "what is not verified" section, and two decisions argued against themselves — against three numbers that were simply wrong on arrival. |

**8.2 × 0.30 + 7.5 × 0.20 + 9.0 × 0.20 + 8.8 × 0.15 + 9.0 × 0.10 + 8.0 × 0.05 = 8.38.**

## 2. Hard gates

| Gate                                    | Command                                                | Result                                                                           |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Console errors / hydration warnings     | 4 harness runs, 13 shots, plus 4 probes                   | **PASS** — `errors 0 · hydration 0` everywhere; the two showcase warnings are terrain's |
| Extensibility ≥ 5                       | §4.2                                                      | **PASS — 9.0**                                                                    |
| Barrel import                           | `grep -rn "^import .*@babylonjs" lib/game/camera/`        | **PASS** — 5 lines, **0 of them a runtime import**                                |
| `window`/`document`/`navigator` at module scope | reviewed; DOM is reached only inside `main`/`input` | **PASS**                                                                          |
| `pnpm test:game` / `test:game-camera`   | as written                                                | **PASS** — 92 checks green; the selftest is 114 checks                            |
| `npx tsc --noEmit` / `eslint`           | as written                                                | **PASS** — exit 0 both                                                            |

## 3. The frames I looked at

All seven presets at 12:00 with `--step=900` (`.game-render/cam-presets/`), `night` again at 23:00,
the three showcase presets, and the boot pose before and after §4.1. Thirteen frames, every one
opened.

| preset     | draw calls | triangles | what it frames                                                                       |
| ---------- | ---------: | --------: | -------------------------------------------------------------------------------------- |
| `overview` |        210 |   422,534 | the whole park, lake right of centre, horizon and sky in the top third                |
| `entrance` |        260 |   794,886 | the gate at the bottom edge and the street receding — the best composition of the seven |
| `close`    |        323 | 1,290,243 | a plaza at reading distance, guests and benches legible                                |
| `ground`   |        339 | 1,373,581 | eye level down the main street: kerbs, lamps, benches, shops both sides               |
| `coaster`  |        214 |   809,955 | **woodland and empty ground** — there is no coaster in the demo park                  |
| `pool`     |        239 |   591,462 | the lake, filling about a third of the frame                                          |
| `night`    |        252 |   797,690 | the forecourt from above; at 23:00 it is lamp pools, one lit shop and stars            |

## 4. Findings

### 4.1 The module was inheriting a framing with no horizon in it

Measured with a probe rather than read: with nothing remembered to restore, the module adopted
whatever `core/renderer.ts` had set the camera to — **93.7 m up, 33.75° down, `horizonRow` −138**,
which puts the horizon off the top of a 720-row frame. `/game` opened on a park with no sky in it,
and no screenshot in this project could show that, because the harness always applies a preset
before it shoots.

That is precisely the failure this module publishes the arithmetic for
(`horizonRow(pitch, fov, height) = height/2 · (1 − tan pitch / tan(fov/2))`), and the module was
sitting inside it. `main()` applies `overview` now when there is nothing to restore: **105.8 m,
15.5°, `horizonRow` 153.3**, and `.game-render/_probe/boot-pose.png` opens with a horizon and a
third of the frame sky. A remembered view, a showcase's direct write and `?cam=` each still win,
verified after the change.

### 4.2 Extensibility: the only pack content in this game anybody has looked at

Four modules claim a `registerPackCategory` — `groundLayers`, `pathStyles`, `trackElements`,
`cameraPresets` — and until this round no bundled pack carried an entry for any of them. A camera
preset is the one of the four that is **additive and immediately visible**: it needs nothing to be
built with it and `--cam=<id>` frames it. `neon-lagoon` now ships one, the running game reports
**8 presets instead of 7** with `unclaimedPackKeys()` still `[]`, and
`.game-render/packpreset/1200-lagoon.png` is the frame.

Beyond presets: anchors are a prefix table any module can add to and are chained with `|` so a
preset degrades instead of failing; follow sources are a stack consulted newest-first, so `trains`
will shadow the stand-in for the ids it claims and leave the rest alone. Nothing in the folder
switches on a preset id or a content id.

### 4.3 Nobody has ever driven this camera

This is the fidelity axis and it is the honest cap on it. A headless harness has no mouse: pan,
orbit, zoom, momentum, edge scroll and the whole of `input.ts` are covered by 900 frames of
synthetic input in the selftest and by nothing else. Follow mode has never followed anything that
moves, because `trains` does not exist. Touch, WebGPU and a high-DPI display are all untested.

The selftest is unusually good for what it does cover — the pivot of an orbit staying on its pixel
to 1e-6 of NDC, the eye leash over 288 extreme poses, 900 frames of hostile input never putting the
eye under the ground — and none of that is the same as a person dragging the world.

### 4.4 It costs nothing, and that is measured rather than asserted

`stats()` in the running game: `meshes: 0, materials: 0`. `world.modules` has no `camera` key. The
five `@babylonjs/core` lines in the folder are all `import type`. There is no `sim` half.

The one thing it does reach into: `ArcRotateCamera._checkLimits()` runs inside `Camera.update()`
whether or not inputs are attached, so the renderer's `lowerBetaLimit`/`upperBetaLimit`/radius
limits would clamp this module's own leash arithmetic. It opens them in `main()` and restores them
in `dispose()` — a module writing another module's object, documented and filed as request §3. No
dispose/reboot leak measurement exists.

## 5. What round 2 should do, in order

1. **Have a person drive it**, on a desktop and on a phone, and write down what is wrong. Everything
   else in this module is verified and this is not.
2. **`MainContext.camera` and `.canvas`** (request §2), so the module stops guessing at
   `scene.activeCamera` and `engine.getRenderingCanvas()`.
3. **A dispose/reboot leak measurement**, which is the budget axis's one gap.
4. **Anchors for `coaster` and `pool` that fall back to something worth looking at** rather than to
   bare ground — or accept that those two presets are placeholders until `track` and `pools` put
   entities in the demo park.
