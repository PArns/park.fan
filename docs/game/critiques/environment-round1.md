# environment — critic, round 1

Module: `lib/game/environment/` (14 files, 3,262 lines) · showcase `/game?showcase=environment` ·
commit `951b3e236d8aee5c6bbe9c47b83af1a8f9e12035`.

Frames taken by me with `scripts/game-shot.mjs` into `.game-render/critic-environment/` (showcase,
4 times × 3 cameras), `.game-render/critic-environment-park/` (the demo park, where this module is
in every frame) and `.game-render/critic-environment-rain/`. Every PNG named in §3 was opened with
the Read tool and looked at. Numbers come from those three `report.json` files, from pixel probes
over the PNGs with `sharp`, from `sky-model.ts` run under
`node --experimental-strip-types --import ./scripts/register-path-alias.mjs`, and from two
Playwright probes of the live scene (`scene()`, `metrics()`, `dispatch()`, the dome's vertex colour
buffer) whose output is in the scratchpad as `envprobe.json`. The probe scripts were deleted after
the run; `git status --porcelain` is empty.

**Weighted total: 7.50. FAIL** (pass is 8.5). Every hard gate passes and extensibility clears the
5.0 floor. Two things carry the grade down: the sky's own numbers are right about a sky nobody
looks at (the model is measurably good above 20° and the three shipped camera presets never point
there), and `?weather=rain` renders a clear noon — the boot path into this module's weather is
dead, which I only found because I diffed the PNGs.

## 1. Scores

| #   | Axis                  | Weight | Score | One sentence                                                                                                                                                                           |
| --- | --------------------- | -----: | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % |   7.4 | Dusk and night are genuinely photographic (blue sky-lit paving, warm lamps, a correctly-sized moon, readable silhouettes) and noon from the two down-looking cameras is a grey wash.   |
| 2   | Fidelity              |   20 % |   7.5 | Preetham, Henyey-Greenstein, blackbody sun, moon phase and a seasonal Markov chain are all real and named — and the model has no ozone term, so twilight crosses through green.        |
| 3   | Extensibility         |   20 % |   6.8 | The public API is clean and nothing reaches past a sibling, but not one number in this module is data-driven: no `registry`, no pack schema, nine tuning tables in TypeScript.         |
| 4   | Budget and behaviour  |   15 % |   7.8 | 7 owned meshes and 7 of 145 draw calls, with the sun's cascades adding +40 calls / +133,702 triangles at noon — a defensible 3.9 % of the 1,200 budget; no leak measurement exists.    |
| 5   | Determinism and state |   10 % |   9.0 | No `Math.random`/`Date.now`/`performance.now` anywhere, rng state serialised and restored, and two separate browser sessions produced a byte-identical 2,764,800-byte frame.           |
| 6   | Honesty of the report |    5 % |   7.0 | Both open items confirmed at the numbers claimed and three of four fix claims verify exactly in the running scene — against one wrong fog figure and three things it does not mention. |

**7.4 × 0.30 + 7.5 × 0.20 + 6.8 × 0.20 + 7.8 × 0.15 + 9.0 × 0.10 + 7.0 × 0.05 = 7.50.**

## 2. Hard gates

| Gate                                            | Command                                                                 | Result                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console errors / hydration warnings             | three `scripts/game-shot.mjs` runs + two Playwright probes              | **PASS** — `errors 0 · warnings 0 · hydration 0` in `critic-environment/report.json`, `critic-environment-park/report.json` and `critic-environment-rain/report.json` |
| Barrel import                                   | `grep -rn "from '@babylonjs/core'" lib/game/environment/`               | **PASS** — no hits; every Babylon import is a deep path                                                                                                               |
| `window`/`document`/`navigator` at module scope | `grep -rn "window\.\|document\.\|navigator\." lib/game/environment/`    | **PASS** — no hits anywhere in the folder, not just at module scope                                                                                                   |
| Coupling                                        | `grep -rn "from '\.\./" lib/game/environment/`                          | **PASS** — 15 imports, all into `core` (`types`, `sun`, `rng`); core has no barrel and `track` imports it the same way                                                |
| `npx tsc --noEmit`                              | as written                                                              | **PASS** — exit 0, no output                                                                                                                                          |
| `npx eslint lib/game/environment`               | as written                                                              | **PASS** — exit 0, no output                                                                                                                                          |
| `npx prettier --check lib/game/environment`     | as written                                                              | **PASS** — "All matched files use Prettier code style!"                                                                                                               |
| `pnpm test:game`                                | as written                                                              | **PASS** — track selftest 95 checks clean; soak 576 ticks, 9/9 assertions, `✓ save round-trips after the run`, `✓ no non-finite numbers`                              |
| Extensibility ≥ 5                               | see §4.3                                                                | **PASS** — 6.8                                                                                                                                                        |
| Touched only its own folder                     | answered by the integrator; `git status --porcelain` empty after my run | **PASS**                                                                                                                                                              |

## 3. The frames I looked at

Twelve opened with Read; several more probed numerically only and named as such.

| File                                                           | What is actually in it                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `critic-environment/1200-close.png`                            | The plaza from ~35 m: pillars throwing hard directional shadows, the sphere sweep reading across roughness, the mirror ball carrying the sky. Above it a sky that goes 137/165/177 at the top of frame to 168/172/174 at the horizon — a 1.16:1 luminance range and no blue left by the horizon.                                                         |
| `critic-environment/1200-overview.png`                         | The showcase at ~340 m: the promenade is ~2.3 % of the frame, so this preset is really a terrain-and-sky shot. Terrain edge at y≈237 against sky at y≈229: linear luminance **0.4257 → 0.2377 across 8 px**, no transition. The world visibly ends.                                                                                                      |
| `critic-environment/0900-ground.png`                           | The best evidence for the sky model: at eye height the sky **is** blue — 77/116/149 at y=120 (linear blue:red 4.05) grading to 146/155/159 at the horizon, a 1.93:1 luminance range. Sun-to-shade on the plaza is 3.6:1 and the shade is blue (linear b:r 3.6 in shadow against 1.20 in sun). Sun highlight in the mirror ball sits on the correct side. |
| `critic-environment/1830-close.png`                            | Warm rim light on the pillar caps, the mirror ball reflecting a full sunset gradient, spheres lit warmly on the sun side. Above the pink band the sky is olive (155/161/140 at y=60, linear b:r 0.80).                                                                                                                                                   |
| `critic-environment/1830-overview.png`                         | Azimuthal falloff proven: pink/red on the sun side at frame right through purple-blue at frame left. Below the terrain edge the dome is a dull purple-brown — haze, not a black band, so the sub-horizon fix holds.                                                                                                                                      |
| `critic-environment/1830-ground.png`                           | The most informative frame in the set. The mirror ball shows the whole IBL: blue zenith, a thin bright orange band exactly on the horizon, and a flat dark ground hemisphere under a knife-edge terminator. In the sky behind it the blue→pink crossover passes visibly through green.                                                                   |
| `critic-environment/2200-close.png`                            | Deep blue night, stars, a ~10 px moon disc at (703, 74). Pillars, plaza, spheres and hedges all hold their silhouettes and the spheres keep their hue. `ART_BIBLE.md` §2 satisfied on the showcase.                                                                                                                                                      |
| `critic-environment/2200-overview.png`                         | Same night from 340 m: star field over a clean terrain ridge line. The showcase props are almost gone at this distance, which is the preset's fault, not the module's.                                                                                                                                                                                   |
| `critic-environment-park/1200-overview.png`                    | The demo park at noon. Aerial perspective works — far terrain is paler; tree shadows are directional and hold out to the cascade edge with no banding. The sky is a near-white grey over the whole lower half of the frame.                                                                                                                              |
| `critic-environment-park/0900-overview.png`                    | Morning: longer shadows, softer light, the same hard terrain edge at y≈240, the same white horizon.                                                                                                                                                                                                                                                      |
| `critic-environment-park/1830-ground.png`                      | The best frame this module produces. A real dusk down a tree avenue: blue at the top, peach at the vanishing point, warm lit lamps, cool blue sky-lit paving. Also where the green band is easiest to measure — 132/144/130 at y=230, G above both R and B.                                                                                              |
| `critic-environment-park/2200-overview.png`                    | Night over the whole park: stars, moon at (921, 61), a warm pool of light from two lit lamps, and paths, canopy and ridge all readable. Sky 0.0833 against terrain 0.0209 linear luminance at the edge — a 4:1 silhouette step.                                                                                                                          |
| `critic-environment-rain/1200-close.png` and `1200-ground.png` | Booted with `&weather=rain`. Blue sky, hard sun shadows, dry plaza, no precipitation. Byte-diffed against the clear frames: **123 of 2,764,800 bytes differ in `close` (0.004 %) and 0 in `ground`.**                                                                                                                                                    |
| `critic-environment-rain/1200-overview-cmd-rain.png`           | The same park after `dispatch('environment:weather', {weather:'rain'})`: full overcast sheet, no sun shadow, and heavy milky haze in which the park's far side is barely legible.                                                                                                                                                                        |

Probed numerically but not opened: `critic-environment/0900-close.png`, `1200-ground.png`,
`critic-environment-park/1200-ground.png`.

## 4. Axis by axis

### 4.1 The frame — 7.4

What works, with numbers:

- **Dusk and night are the strong half.** `critic-environment-park/1830-ground.png` runs 81/118/144
  at y=40 to 142/140/117 at y=265 with lit lamps and cool paving; `2200-overview.png` holds the
  park's paths and canopy against a 0.0833-luminance sky at a 4:1 silhouette ratio. The brief asks
  whether `ART_BIBLE.md` §2 is met and it is, on both scenes.
- **The light has a direction and the shade has a colour.** Measured on
  `critic-environment/0900-ground.png`: lit plaza 63/64/69, shadow 24/34/46, a **3.6:1 (1.85-stop)
  shadow whose linear blue:red is 3.6 against 1.20 in the sun.** Warm sun, sky-lit blue shade, from
  the IBL/hemisphere split rather than a flat ambient. That is the single best thing in the module.
- **The sub-horizon fix is real, not just claimed.** In the live vertex buffer every dome vertex at
  `dy ≤ 0` carries exactly the `dy = 0` value (0.5318/0.5479/0.5569 at noon, 0.2122/0.2416/0.3147
  at 22:00), so there is no dark band under the horizon in any frame I took.

What does not, with numbers:

- **The two down-looking presets show only the pale part of the sky.** At `close` the visible sky
  band is roughly the lowest 7°, and over it the luminance runs 0.354 → 0.409 (a **1.16:1** range)
  while linear blue:red falls 1.76 → 1.08. On `critic-environment-park/1200-overview.png` the sky
  is a near-white grey over the whole lower half. The model itself is not the problem here — at
  `ground` the same sky is 77/116/149 — but the game ships three cameras and two of them frame the
  worst 15° of it.
- **Twilight crosses through green.** `1830-ground.png` (park), centre column: 119/144/140 at
  y=190, **132/144/130 at y=230**, 142/140/117 at y=265. G above both R and B is a hue the
  atmosphere does not make; a real twilight goes blue → violet → orange. This is visible, not
  subtle, and it is in the module's best frame.
- **The world ends and you can see it.** Confirmed at every time of day; measured at noon on
  `critic-environment/1200-overview.png` as 0.4257 → 0.2377 linear luminance across 8 px. The
  terrain at its far edge is still a saturated 114/141/111 against a 172/175/176 sky — at
  `fogDensity` 0.000374 a surface a kilometre out keeps 76 % of itself, so the fog cannot and
  should not hide it. Geometry, correctly handed to `terrain`.
- **The IBL's ground half is a two-tone ball.** On `0900-ground.png` the mirror sphere reads
  31/55/94 above the seam and 31/34/26 below it, with the transition inside ~25 px of a 175 px
  sphere. `evalSky`'s `smoothstep(0.03, -0.06, dy)` is a 5° blend on a 64² cube; a mirror ball in a
  park should show something ground-coloured, not a flat dark hemisphere with a terminator.
- **Rain reads as fog.** After the in-game command, `scene.fogDensity` is 0.0012548, which through
  EXP2 and Babylon's `toLinearSpace(fog)` puts **half a surface's contrast into haze at 447 m** —
  worse than the 0.0008/660 m the module itself condemned in `lighting.ts` as "actual fog, on a day
  the model calls clear". The frame agrees: the far side of the park is barely legible.

### 4.2 Fidelity — 7.5

The reference was researched and it is named in the files: Preetham single scattering with the
Rayleigh/Mie split and a Henyey-Greenstein phase, `totalRayleigh()` computed from the standard-air
constants at 680/550/450 nm, a blackbody sun (`core/sun.ts`), a turbidity table that puts a clear
European summer at 2.2 and a storm at 9.0, a four-season 5×5 Markov chain with a heavy diagonal so
spell length falls out of the chain, and snow as rain below 1.5 °C rather than a sixth state. The
moon disc measures ~10–13 px at 1280 px wide, which is about right for 0.5°. The fog maths accounts
for a real Babylon behaviour I verified in the engine source rather than taking on trust:
`BindFogParameters(scene, mesh, effect, true)` at `pbrBaseMaterial.pure.js:1763` runs
`toLinearSpaceToRef` over `scene.fogColor`, and `fogFragment.js` raises the fog factor to
`LinearEncodePowerApprox` = 2.2 under `#ifdef PBR`.

Against that:

- **No ozone.** Preetham has no Chappuis absorption band, which is exactly the term that keeps a
  twilight sky blue-violet instead of letting a blue zenith and an orange horizon cross through
  neutral — and neutral, weighted by luminance, comes out green. The green band in §4.1 is that
  omission, and naming it gives the next round something to implement rather than a taste note.
- **Preetham's horizon overshoot is unremedied**, as the report says: measured off the model at day
  1, the horizon ring's peak luminance is **4.51× the zenith at 09:00** and 3.37× at noon (2.65×
  away from the solar lobe). A real clear sky is nearer 2–3:1.
- **The rain fog is a 1 km visibility** (§4.1), i.e. the module applied its own honesty fix to the
  clear-day base and not to the branches, though `lighting.ts` says "the overcast and rain terms
  come down with it".
- The dawn-mist term is untestable through the harness: at day 1 09:00 `sin(elevation)` is 0.511,
  so `smoothstep(0.22, -0.02, 0.511)` is 0 and the term contributes nothing at any of the four
  times the gauntlet samples. Seasons are in the same position — the harness sets minute, never
  day, so `seasonFoliageTint` and the winter half of the Markov table are unverified by any frame.

### 4.3 Extensibility — 6.8

Above the floor, and the reason it is not higher is one thing said several ways.

Good: the public surface is well chosen and honest about ownership — `skyAt`, `wetness`,
`seasonTint`, `environmentTexture`, `addShadowCaster`/`removeShadowCaster`, `excludeMaterial`,
`setWeather`, plus one command (`environment:weather`) and one event (`env:weather`, emitted on a
rounded signature change rather than per tick). `index.ts` keeps the sim half import-safe on the
worker and puts every Babylon line behind a dynamic import. Nothing reaches past a sibling's public
surface: all 15 relative imports go to `core`, the same shape `track` uses. The three `switch`
statements are over a cube face index and two closed core-owned unions (`Season`, `WeatherKind`) —
none is a switch on a content id. `lighting.ts` takes the four lights through `ctx.lights` and says
in its own docblock that they used to be found by name, which was "a contract in string literals".

Bad: **`grep -rn "registry\|pack" lib/game/environment/*.ts` returns one comment and no code.**
Nothing here is a manifest entry. The 4×5×5 transition matrix, the per-season temperature means and
swings, the spell-length bounds, the turbidity table, the season foliage tints, `SKY_GAIN` /
`SKY_WHITE` / `SKY_DESATURATE`, `EXPOSURE_KEY` / `_MIN` / `_MAX` / `_TAU`, the four fog terms and
`SHADOW_RANGE` are all TypeScript constants in five files. A content pack cannot give a park a
latitude, a climate, a seasonal palette or a named sky preset; a themed land cannot ask for its own
weather bias; a new `WeatherKind` needs a core type change plus edits in `weather-model.ts`,
`sky-model.ts`, `sim.ts`, `main.ts` and `precipitation.ts`. For a systems module the API matters
more than a catalogue, which is why this is 6.8 and not 5 — but "a new manifest entry and no code"
is currently unreachable for anything this module owns.

One more, at the boundary: `world.modules.environment` is an untyped, unversioned object that
`core/host.ts:131` writes as `{ weather, forced }` and both halves of this module read as
`slot.kind`. That mismatch is §5.1 below, and it is the kind of thing a schema would have caught.

### 4.4 Budget and behaviour — 7.8

Measured on the demo park at `overview`, same session, same camera (Playwright probe of
`__parkfan_game.metrics()`):

| Time  | Draw calls | Triangles | Active meshes | Sun shadow |
| ----- | ---------: | --------: | ------------: | ---------- |
| 12:00 |        145 |   299,646 |           100 | on         |
| 22:00 |        105 |   165,944 |            99 | off        |

So the sun's cascaded shadow map costs **+40 draw calls and +133,702 triangles** — it re-submits
about 80 % of the scene's geometry. This module's own meshes are **7**, read off the live scene:
`env-sky-dome` (2,993 v), `env-cloud-cumulus` and `env-cloud-cirrus` (3,395 v each), `env-sun`,
`env-sun-halo`, `env-moon` (4 v each) and `env-stars` (3,600 v = the claimed 900 quads). Total
attributable at noon is therefore ~47 draw calls, **3.9 % of the whole-game budget of 1,200**, for
the module that lights every other one. That is a defensible share and I would say so plainly.

The showcase is heavier for the same reason: `critic-environment-rain/report.json` gives 264 draw
calls / 444,048 triangles at `12:00 close` (87 active meshes) against 92 / 117,236 at `22:00 close`
in `critic-environment/report.json` (86 meshes) — 172 draw calls of shadow pass over ~60 casters.
The cost scales with caster count × cascade count, which is worth stating in the report because
`addShadowCaster` is a public API other modules will keep calling.

Sim: `pnpm test:game`'s soak ran 576 ticks in 28 ms, mean **0.05 ms** against the 6 ms budget, and
save round-tripped. (My run's max tick was 23.37 ms against the 0.341 recorded in `STATUS.json`;
that is the whole sim's first tick, not this module, and the mean is what the budget names.)

Not measured, and I am saying so rather than guessing: **the no-leak-across-three-dispose/reboot
cycles requirement.** The harness exposes no reboot, and I did not add one. `main.ts`'s `dispose()`
does unhook the weather listener, restore `surfaces`, null `scene.environmentTexture` when it still
points at its own cube, and dispose precipitation, lighting (the moon light), the IBL and the dome —
so the shape is right, but nobody has run it three times.

One behaviour finding the report does not carry: **auto exposure is pinned at `EXPOSURE_MAX` for
half the clock.** Live values on the demo park are 2.121 at 09:00, 1.954 at 12:00, **3.600 at 18:30
and 3.600 at 22:00** — the ceiling, identically, at two very different scenes. Under rain at noon it
reads 3.305. So the "eye" that `EXPOSURE_TAU` exists to stand in for stops adapting the moment the
sun goes down, and dusk and night are graded by the sky model and the light intensities alone.

### 4.5 Determinism and state — 9.0

- `grep -rn "Math.random\|Date.now\|performance.now\|new Date" lib/game/environment/` returns
  **nothing**. Every roll goes through `ctx.rng`.
- The xoshiro state is written into the slot by `serialize()` and restored in `readSlot()`, so a
  save resumes the weather chain instead of rerolling the week. `pnpm test:game` reports
  `✓ save round-trips after the run` and `✓ no non-finite numbers` over 576 ticks.
- Ownership is single-sided: the sim writes `world.modules.environment`; the main thread holds a
  read-only `WeatherView` fed by the forwarded `env:weather` event and never writes the slot.
- The strongest evidence is accidental. `critic-environment/1200-ground.png` and
  `critic-environment-rain/1200-ground.png` were rendered in **two separate browser sessions** and
  are **byte-identical across all 2,764,800 bytes.** Nothing in the sky, the clouds, the IBL, the
  star field or the shadows is time-seeded.

Held back from 10 only by `EXPOSURE_TAU`, which eases in wall-clock seconds: two screenshots of the
same world state can differ until it settles, which is why the harness needs the `snap` path. It is
render-only, it never reaches saved state, and the file says so.

### 4.6 Honesty of the report — 7.0

I checked everything the brief said was checkable, and most of it holds.

**Verified exactly:**

- `scene.fogColor` is written gamma-encoded and `clearColor` linear. Live at 09:00: `fogColor`
  0.485563 against `linearToGamma(clearColor.r × 1.04)` = `linearToGamma(0.200921)` = 0.485566.
  The Babylon side is as described — `pbrBaseMaterial.pure.js:1763` passes `linearSpace = true`,
  and `fogFragment.js` applies `toLinearSpace(fog)` under `#ifdef PBR`.
- The dome paints haze below the horizon. Every vertex at `dy ≤ 0` in the live colour buffer
  carries the `dy = 0` value at both 12:00 and 22:00 (§4.1), and `paintDome` in `sky-dome.ts` calls
  `sampleSky(..., 0)` with the azimuth flattened to `dy = 0`.
- `EXPOSURE_KEY = 0.78` is claimed to "land near 1.95 at noon". Live at 12:00 on the demo park:
  **1.9544**. That is the most precisely-earned claim in the document.
- The star field is 900 quads (3,600 vertices on `env-stars`); the IBL is a 64×64 cube with a
  spherical polynomial present on `scene.environmentTexture`.
- **Open item 1 confirmed.** Horizon:zenith is 4.51:1 at 09:00 and 3.37:1 at noon off the model at
  day 1 — the claimed "about 4.5:1" is right, and so is the judgement that a real sky is lower.
- **Open item 2 confirmed** with the number in §4.1.

**Wrong or unsupported:**

- `lighting.ts` and the report both say that at 0.00035 a surface "keeps 88 % of itself at 340 m and
  76 % at a kilometre". Through EXP2 and the PBR `^2.2`, a surface at 340 m keeps **96.9 %**; 88 %
  is reached at **689 m**. The two figures look like the same distance measured two ways — the raw
  EXP2 factor at 1 km is 0.8847 (88 %) and after the 2.2 it is 0.7638 (76 %) — so the second number
  is right and the first has the wrong distance beside it. The design decision it justifies is
  sound; the sentence is not.
- The tone-shoulder claim — "blue:red 1.54 → 2.81 at dy 0.3 and 2.05 → 3.70 at dy 0.6" — does not
  reproduce. Running the pure model at day 1 perpendicular to the sun I get **3.19 at dy 0.3 and
  4.23 at dy 0.6** at noon, and 3.07 / 4.16 at 09:00. The direction and the order of magnitude
  hold, so the fix is real; but the sample direction, day and time are not stated, so the number as
  written cannot be checked, which is the whole point of writing it down.
- "The park under it is black, because the light rigs belong to `effects` and `scenery` and neither
  module exists." Two `scenery-lamp-*` lights are in the live scene at intensity 20.27 at 18:30 and
  **63.0 at 22:00**, and they are visibly lit in both `1830-ground.png` and `2200-overview.png`.
  The park at night is dim, not black, and part of the rig it says is missing has arrived.

**Not mentioned at all:** that `?weather=` never reaches this module (§5.1), that the rain fog is a
1 km visibility, that auto exposure is clamped at its ceiling from 18:30 onward, and that the IBL's
ground hemisphere shows as a hard terminator on the showcase's own diagnostic sphere — the prop the
showcase docblock says exists to catch exactly this class of bug.

The disclosure that the "what is weak" section was written by the integrator after the builder was
killed is exactly right and costs nothing here; the axis grades the report as it now reads, and as
it now reads it is candid, ranked and numbered, with four checkable claims of which three check.

## 5. Ranked list of what to fix

1. **`?weather=` renders a clear day.** Booted with `&weather=rain` and with `&weather=storm`, the
   live scene reports `fogDensity` 0.000374 (the clear value), `exposure` 1.9544 (the clear value)
   and both particle systems `isStarted() === false` with 0 live particles — and the PNGs differ
   from the clear ones by **123 of 2,764,800 bytes at `close` and 0 at `ground`**. The in-game path
   is fine: `dispatch('environment:weather', {weather:'rain'})` takes `fogDensity` to 0.0012548,
   `exposure` to 3.305, sun intensity 2.604 → 0.615 and starts `env-rain` at emit rate 716 with
   1,104 live particles. The cause is a field-name mismatch at the slot: `core/host.ts:131` writes
   `world.modules.environment = { ...env, weather: query.weather, forced: true }` and both
   `sim.ts`'s `readSlot()` and `main.ts`'s `initialView()` read `stored?.kind`, so both fall back to
   `'clear'`. This module owns and is the sole reader of that slot, so the shape is its contract;
   the fix needs the integrator because the writing line is core's. Until it lands, no screenshot
   gauntlet — this one included — has ever graded this module's weather, wet surfaces or
   precipitation from a cold boot.
2. **The rain/overcast fog is the bug this module already fixed once.** 0.0012548 puts half a
   surface's contrast into haze at 447 m, against the 660 m the file itself calls "actual fog". Rain
   does not take visibility below a kilometre; the cloud term (`0.0006 × cloud`) and the rain term
   (`0.0009 × (0.4 + 0.6 × wetness)`) want the same treatment the base got, roughly halved.
3. **Give twilight an ozone term.** The measured green at 132/144/130 (park `1830-ground.png`,
   y=230) is the blue→orange crossover passing through neutral, and Chappuis absorption is the
   physical reason real twilight does not do that. It is a per-row extinction in `makeSkyRow`, it
   costs one more exponential, and it also pulls the horizon:zenith ratio the right way — which is
   open item 1, still 4.51:1 at 09:00.
4. **Unpin the exposure.** 3.600 = `EXPOSURE_MAX` at 18:30 and again at 22:00 on two different
   scenes, and 3.305 at noon in rain. The metering has no headroom left across half the clock, so
   the ceiling is doing the work the key was tuned to do. Either raise the ceiling or flatten the
   `^0.7` — and note in the report which, because the last time these three numbers moved, the
   reason was written down and it was the right reason.
5. **Soften the IBL's ground terminator.** 31/55/94 above and 31/34/26 below with ~25 px of
   transition on a 175 px sphere (`0900-ground.png`). `smoothstep(0.03, -0.06, dy)` is ~5° on a 64²
   cube; widening it, or tinting the ground half with the terrain's own albedo × the sun, would
   stop the showcase's diagnostic prop reporting a bug it was built to catch.
6. **Put one number in a pack.** Nothing in this module is data-driven and nine tuning tables live
   in TypeScript. The cheapest real move is a per-park climate — latitude, season means, a weather
   bias — read from the registry, because it is the one that makes two parks look different without
   any new code.
7. **Fix the two report numbers in §4.6** — "88 % at 340 m", and the blue:red pair, which needs its
   sample direction and day written beside it. Both are cheap and both are the difference between a
   claim a critic can check and a claim a critic has to re-derive.
8. **Measure the leak.** Three dispose/reboot cycles with `scene.meshes` / `materials` / `textures`
   counted each time. The current single reading is 295 / 32 / 82 and means nothing on its own.

Two things I am explicitly **not** ranking as this module's faults. The world's hard edge at
`overview` is terrain's world size — the fog above it is honest and the dome under it is already the
right colour to receive a skirt, exactly as the report says. And the dark park at night is only half
this module's: it supplies a moon disc, a star field, a deep blue dome and a moon directional light
(measured at intensity 0 at 22:00 on day 1, because the moon is below the horizon then, not because
the light is broken), while lamps and ride lighting belong to `scenery` and `effects` — and two
`scenery` lamps have already arrived and read well. I weighted night on what this module controls:
sky colour, star and moon rendering, ambient level and silhouette separation. On those it scores
well, and `2200-overview.png` on the park is the proof.

## 6. Verdict

**FAIL at 7.50** (pass 8.5), round 1 of 4. No hard gate fails, extensibility is 6.8 against a floor
of 5, and the module is closer to passing than the total suggests: three of the eight items above
are single-constant changes, one is a field name, and the two axes carrying the most weight are
both held down by defects that have a named physical cause rather than a taste argument. The frame
at dusk and at night is already good enough to keep; what has to change is that a boot with weather
shows weather, that rain is not fog, and that the sky stops going green on its way from blue to
orange.
