# environment — critic, round 2

Module: `lib/game/environment/` (14 files) · showcase `/game?showcase=environment` · also the sky,
sun, moon, fog, IBL, weather and wetness under every other frame · commit `974911e`.

Round 1 (`environment-round1.md`) graded **7.50** against 8.5, all hard gates passing. Round 2
fixed a core bug that had hidden the entire weather system, scaled the weather fog by intensity, and
corrected three of its own claims in place.

**Weighted total: 7.72. FAIL** (pass is 8.5), no hard gate failed.

The finding of this round is not in the module: **no picture of rain existed anywhere in this
project, and the reason was the harness rather than the game.** That is fixed here, and the first
frame of rain in the repo is `.game-render/env-rain-visible/1200-ground.png`. What it shows is the
module's real remaining problem.

Who graded this: the integrator, for the reason in `terrain-round2.md`. Note that the running dev
server was mid-`tools` development while these frames were taken, so a build bar appears at the
bottom of the demo-park shots. It overlays nothing this critique measures.

## 1. Scores

| #   | Axis                  | Weight | R1  | R2      | One sentence                                                                                                                                                                     |
| --- | --------------------- | -----: | --: | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | 7.4 | **7.6** | Overcast and rain are reachable at last and the light under them is right — and now that the rain can be photographed, it covers **0.17 %** of the frame and reads as drizzle.  |
| 2   | Fidelity              |   20 % | 7.5 | **7.9** | The weather fog is held to the same arithmetic as the clear-day fog now: half-contrast at 1,525 m clear, 771 overcast, 664 rain, 605 storm. Still no ozone term.                |
| 3   | Extensibility         |   20 % | 6.8 | **6.8** | Untouched and re-measured: `grep -rn "registry\|registerPackCategory\|packs()" lib/game/environment/*.ts` returns **0 hits** across 14 files.                                    |
| 4   | Budget and behaviour  |   15 % | 7.8 | **7.8** | Unchanged; still no leak measurement. Rain costs particles the frame can afford (1,560 capacity, 716–959/s).                                                                    |
| 5   | Determinism and state |   10 % | 9.0 | **9.0** | Unchanged.                                                                                                                                                                      |
| 6   | Honesty of the report |    5 % | 7.0 | **8.6** | Three of its own numbers corrected **in place rather than deleted**, with the wrong reading named; the core bug described precisely enough that I could re-verify it from the URL. |

**7.6 × 0.30 + 7.9 × 0.20 + 6.8 × 0.20 + 7.8 × 0.15 + 9.0 × 0.10 + 8.6 × 0.05 = 7.72.**

## 2. Hard gates

| Gate                                | Command                                                                     | Result                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Console errors / hydration warnings | six harness runs (clear / rain / storm × demo park and showcase)             | **PASS** — `errors 0 · warnings 0 · hydration 0` in every report; probes `errors: []` |
| Extensibility ≥ 5                   | §4.3                                                                          | **PASS — 6.8**, unmoved                                                       |
| `pnpm test:game` / `tsc` / `eslint` | as written                                                                    | **PASS** — exit 0                                                             |

## 3. What the weather actually does now, measured from the URL

`.game-render/_probe/env-r2.mjs`, demo park, noon, `ground` camera:

| `?weather=` | `fogDensity` | exposure | `env-rain` | live particles | emit rate |
| ----------- | -----------: | -------: | ---------- | -------------: | --------: |
| (none)      |     0.000368 |    1.954 | stopped    |              0 |        10 |
| `rain`      |     0.000845 |  **3.6** | started    |          1,375 |       716 |
| `storm`     |     0.000927 |  **3.6** | started    |          1,104 |       959 |

The round-2 fix is real: the URL flag reaches the module, the fog moves, the particles run. Two
things the table says that the report does not:

- **Exposure is pinned at `EXPOSURE_MAX` (3.6) under both rain and storm, at noon.** That is the
  open issue `STATUS.json` records for 18:30 and 22:00, and it turns out to apply in daylight the
  moment the sky is overcast. A clear noon sits at 1.954, so the auto-exposure has 84 % of its range
  above the value it actually uses and hits the ceiling as soon as anything dims the sky.
- **Rain and storm differ by 10 % of fog and 34 % of emit rate and by nothing else I can measure.**
  Half-contrast 664 m against 605 m is a 9 % difference. A storm should not be a shower with more
  drops.

## 4. Findings

### 4.1 Nobody could photograph rain, and it was the harness

`scripts/game-shot.mjs` reported 1,375 live rain particles and produced a frame with no rain in it,
which is exactly the shape of the bug round 2 had just fixed one layer down. It is not that bug
again. Babylon ages particles by `updateSpeed × scene.getAnimationRatio()`, and that ratio is the
**real frame delta** — under SwiftShader this game renders one frame every 1–3 seconds, while a
raindrop lives 1.15–1.5 s. Every drop was born and expired inside a single update.

An hour was nearly spent on a false finding here: the first probe read the emitter at
`(−193, 115, 334)` with the camera at `(0, 3, 149)` and it looked exactly like a rain rig that had
stopped following the camera. It has not — `precipitation.follow()` runs every frame from
`onRender`, and the position I read was the **boot** camera pose, two frames stale on a renderer
producing a frame every three seconds. `.game-render/_probe/rain-follow.mjs` samples it over 22
seconds and shows the emitter arriving at the camera between frame 6 and frame 8.

The harness has a `--particles=<seconds per frame>` flag now, off by default: it pins every particle
system's `updateSpeed` against the animation ratio so one rendered frame advances the field by a
fixed amount, and `--particle-frames=<n>` builds it up before the shot. `--particles=0.1
--particle-frames=14` is 1.4 s of rain, which is one full particle lifetime, so what it photographs
is the steady state and not a transient (steady-state count is `emitRate × mean lifetime` ≈ 930,
against the ~1,000 measured). It costs those frames in wall clock and it is opt-in, because the
result is a particle field of a stated age rather than a frame of the game running.

### 4.2 And this is what the rain looks like

`.game-render/env-rain-visible/1200-ground.png` (showcase, so the scene is static and the diff is
clean) against the same shot without the flag: **1,567 pixels differ by more than 6 of 255 — 0.17 %
of the frame**, mean delta 13.4, max 125.

Nought point one seven per cent. In the demo park
(`.game-render/env-storm-visible/1200-ground.png`, a **storm**) the drops are visible as pale
streaks against the dark canopies and read as light drizzle. The fog, the exposure and the flat
overcast light are all doing their job and the precipitation itself is not there.

The drops are 0.07–0.14 m billboards at alpha 0.42, emitted in a 30 × 30 m box 26–30 m up. At
steady state that is under a thousand of them spread over the near field. Rain in a game frame is
usually much denser near the lens and drawn as an elongated streak; this is a scatter of dots.

Not a defect the module hid — it is a defect nobody could see until now, and it is the single
largest thing between this module and a pass.

### 4.3 Extensibility has not moved and is now the module's cap

Round 1: "not one number in this module is data-driven: no `registry`, no pack schema, nine tuning
tables in TypeScript." Re-measured across all 14 files: **0 hits** for `registry`,
`registerPackCategory` or `packs()`. Meanwhile `terrain`, `paths`, `track` and `camera` all claimed
a category in the same period, and `neon-lagoon` now ships a `cameraPresets` entry that is
photographed.

A pack that wants a foggier autumn, a different sky tint or its own weather odds cannot express any
of it. The obvious category is the weather table — the Markov chain's odds and the per-weather fog,
exposure and particle numbers are exactly the shape `groundLayers` took.

### 4.4 A faint seam in the overcast sky, measured rather than squinted at

At `x = 636–638` the overcast sky carries a vertical discontinuity down the whole band: mean
column-to-column step **0.56–0.61 of 255** against ~0.2 for neighbouring columns, worst single pixel
3.1. That is about 1 % contrast — visible only because it is perfectly straight and hundreds of rows
long. It is in both rain frames and both showcase frames and is absent from clear skies (the same
scan on a clear noon returns 0.03 and no preferred column), so it belongs to the cloud layer rather
than to the dome's geometry.

## 5. What round 3 should do, in order

1. **Make the rain look like rain.** Streaked drops, far more of them near the camera, and a storm
   that differs from a shower by more than 34 % of emit rate. This is the frame axis and it is now
   photographable, so it can be iterated on properly for the first time.
2. **Unpin the exposure.** 3.6 is `EXPOSURE_MAX` and it is reached at noon under overcast; the
   curve is wrong somewhere, not the ceiling.
3. **A `weather` pack category**, which is the whole extensibility axis and the one the four other
   modules have already shown how to build.
4. **The cloud layer's seam**, once 1 is done — it is a 1 % defect and the least of these.
