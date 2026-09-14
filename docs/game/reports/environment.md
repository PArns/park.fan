# environment — builder report

Sun, procedural sky, IBL, weather, seasons, fog, cascaded shadows, exposure.
Folder: `lib/game/environment/` (14 files). Nothing outside it was touched.

## What exists

### Sim half (`sim.ts`, `weather-model.ts` — pure, Babylon-free, DOM-free)

A Markov chain over the five `WeatherKind`s with season-dependent transition weights, ported from
the model in the scratchpad against the real `SimHandle` contract. Spells last 45 min to 5¼ h of
park time; the diagonal of each row is heavy, so the spell length falls out of the chain instead
of being a second number to keep in step. Temperature is a daily sine about the season mean pulled
down by cloud; wetness is integrated, so a shower's surfaces stay dark for the best part of an
hour after it stops.

Two deliberate departures from the ported model, both recorded in the file header:

- **Snow is not a sixth state.** `WeatherKind` has five members and this module does not own that
  type; the winter snow weight is split between overcast and rain, and precipitation falls as snow
  below 1.5 °C. Core adopted this as `EnvironmentState.precipitation` after the request landed.
- **The 96-day year is gone.** `core/sun.ts` dates the day against a 365-day calendar, and two
  calendars would put a summer sun over an autumn park.

Determinism: every roll is `ctx.rng`; the xoshiro state is serialised into
`world.modules.environment`, so a save resumes the same week rather than rerolling it. No
`Math.random` anywhere (`pnpm test:game-lint` greps for it and passes).

### Main half

| File               | What it owns                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `sky-model.ts`     | Preetham-style scattering on the CPU: per-row optical depths, per-texel phase. One source for the dome, the IBL, the fog and the ambient. |
| `sky-dome.ts`      | The dome mesh + HDR equirect texture (chunked refill), two cloud sheets, sun disc + halo, moon with phase, 900-quad star field.           |
| `ibl.ts`           | 64² RGBA16F cube from the same model + a real spherical-harmonic irradiance projection → `scene.environmentTexture`.                      |
| `lighting.ts`      | Sun, hemispheric fill, a moon directional light, cascaded-shadow configuration, fog, auto exposure.                                       |
| `precipitation.ts` | Rain and snow particle systems on a camera-following emitter.                                                                             |
| `surfaces.ts`      | Wet-surface darkening and seasonal foliage tint over `scene.materials`, reversible.                                                       |
| `textures.ts`      | Every texture, generated from noise: cloud sheets, moon face, sun disc, star sprite, rain streak, and the showcase's PBR sets.            |
| `showcase.ts`      | `/game?showcase=environment`.                                                                                                             |

### Public API

```ts
// ctx.module<EnvironmentMainApi>('environment')
current(minute, day): EnvironmentState   // core calls this every clock step
skyAt(direction: Vec3): Vec3             // linear RGB of the sky along a world direction
wetness(): number
seasonTint(): Vec3                       // multiply into a foliage albedo
environmentTexture(): unknown            // the IBL cube
addShadowCaster(mesh, includeDescendants?)   // put a mesh in the sun's cascades
removeShadowCaster(mesh)
excludeMaterial(material)                // opt out of the wetness/season passes
setWeather(kind | null)                  // pin, or hand back to the chain

// ctx.module<EnvironmentSimApi>('environment') on the worker
current(): EnvironmentState
weather(): WeatherKind
intensity(): number
windMs(): number
snowing(): boolean
```

Events: `env:weather` (worker → main, forwarded by `FORWARDED_PREFIXES`) carrying weather, cloud,
wetness, intensity, wind, temperature and whether it is snowing. It is emitted only when a rounded
signature of that payload changes, not on every tick.
Command: `environment:weather` with `{ weather: WeatherKind | null }`.
Owned state: `world.modules.environment` (`WeatherSlot`), written only by the sim.

## Two decisions worth arguing with

**The sky is computed on the CPU, not in a shader.** Four consumers need the same numbers — the
dome texture, the IBL cube that lights every PBR material, the fog colour and the ambient — and a
GPU sky supplies one of them and leaves the other three needing a CPU twin. It would also have to
exist twice, in GLSL and in WGSL, because `core/renderer.ts` boots WebGPU when the browser offers
it and a GLSL `ShaderMaterial` does not compile there without fetching glslang at runtime. The
cost is bounded by structure: everything that depends only on the view's zenith angle is computed
once per texture row, so a texel is three square roots and about thirty multiply-adds. A full
512×256 refresh is a few milliseconds and is spread over eight frames by `pump()`.

**The IBL is a real spherical-harmonic projection, and the lower half of the cube is ground.** The
renderer boots a `HemisphericLight` at 0.5, which puts one colour on every upward-facing normal.
This replaces it with a cube filled from the sky model and hands the irradiance to
`CubeMapToSphericalPolynomialTools`, using Babylon's own face layout so the same six arrays go to
the GPU and to the projection. The hemispheric light stays, turned down to 0.10–0.25 with the
sky's zenith and the ground's colour, purely so a `StandardMaterial` — which reads no environment
texture at all — does not go black in the shade.

## Verified

Commands run: `npx tsc --noEmit` (nothing under `lib/game`), `npx eslint lib/game/environment`
(clean), `npx prettier --write`, `pnpm test:game` (4/4 green, including `game lint: 78 files
clean`), and the screenshot harness.

PNGs opened with the Read tool and what they actually showed — see "What is weak" for the ones
that are still wrong.

## Round 2 — the critique, and one bug it found that nothing else would have

`docs/game/critiques/environment-round1.md` failed this module at **7.50** against 8.5: frame 7.4 ·
fidelity 7.5 · extensibility 6.8 · budget 7.8 · determinism 9.0 · report honesty 7.0, with every
hard gate passing.

**`?weather=rain` rendered a clear noon, and it took diffing PNGs to see it.** The critic measured
the rain frame against the clear one at **123 differing bytes of 2,764,800 at the `close` camera and
zero at `ground`**, with the live scene reporting the clear-day `fogDensity` and both particle
systems `isStarted() === false`. The in-game path worked the whole time —
`dispatch('environment:weather', …)` moves fog, exposure and starts `env-rain` — so nothing in this
module was broken. `core/host.ts` was writing `{ weather, forced }` into
`world.modules.environment`, a shape it invented, while both halves of this module read
`slot.kind`. The flag was accepted, stored and ignored.

Fixed in core, and fixed as a **command** rather than by teaching core the right field names: core
has no business knowing a module's slot layout, and a mistyped command is a no-op the module can
report instead of a silent half-write into somebody else's state. Verified from the URL afterwards:
`fogDensity` 0.000845 (the rain value), `env-rain` started at 1,385 live particles, 0 console
errors.

That bug is the reason the whole weather system had never been seen. Every screenshot of rain,
storm or snow taken by anybody on this branch was a screenshot of a clear day.

**The weather fog was not held to the arithmetic the clear-day fog is held to.** At the rain values
it put half a surface's contrast into haze at **447 m** — worse than the 660 m the module's own
comment condemns as "actual fog on a clear day". The rain term is scaled by `intensity` now, so a
shower and a storm are not the same weather with different particles. Measured half-contrast:
clear 1,525 m, overcast 771 m, rain 664 m, storm 605 m.

**Three claims in this report were wrong and are corrected in place, not deleted.** "The same
surface keeps 88 % of itself at 340 m" — it keeps **96.9 %**; 88 % is at 689 m, the figure was read
off the wrong distance. The blue:red pair quoted for the luminance shoulder (2.81 at dy 0.3, 3.70 at
dy 0.6) reproduces as **3.19 / 4.23**, because the sample azimuth was never stated and the ratio
depends on it. And "the park under it is black, no light rigs exist" was wrong: two
`scenery-lamp-*` lights run at 22:00 and are visibly lit.

**Round 2 was done by the integrator**, the builder having been killed by the account session
limit. Four findings are left open and are in the ranked list below with the critic's numbers on
them.

## What is weak or missing, ranked

> The list below was measured by the integrator after the builder was killed by an account
> session limit mid-sentence. Items 1-4 of the first version have been fixed; what they were and
> what the numbers said is in `STATUS.json` and in the docblocks of the three files that changed.
> Everything here is a number read off a frame or off the model, not an impression.

1. **Auto exposure is pinned at `EXPOSURE_MAX` = 3.600 at both 18:30 and 22:00.** At night that is
   by design — there is nothing to meter by — but at dusk it means the metering is not running at
   the hour a sky model is most worth metering. Measured across weather at noon it is NOT pinned
   (clear 1.954, rain 2.959, storm 3.342, overcast 3.496), so the clamp is doing the work only in
   the dark half of the day. An overcast noon still renders 1.79× a clear one, which is the right
   direction for a camera and the wrong direction for reading the weather off the frame.
2. **Twilight crosses through green** — 132/144/130 at y=230, G above both R and B — because
   Preetham has no ozone term, and ozone absorption in the Chappuis band is exactly what keeps a
   real twilight blue rather than letting it pass through the green between the warm horizon and
   the cold zenith. Adding one is a change to the scattering model, not to a constant.
3. **The IBL's ground hemisphere shows as a knife-edge terminator** on the showcase's own
   diagnostic mirror ball. The cube's lower half is the ground colour with no transition, which is
   invisible on diffuse surfaces and obvious on a chrome one.
4. **A leak across three dispose/reboot cycles has never been measured for this module.** The
   check exists (`pnpm game:teardown`) and covers the engine; the critic said plainly that it does
   not cover this module's own handles, and did not grade what it could not measure.
5. **The sky's horizon is about 4.5× its zenith and a real clear sky is nearer 2:1.** This is
   Preetham's own horizon overshoot — the model integrates an infinite air path with no ground and
   no aerosol scale-height cutoff — and it is not the tone curve's fault: the shoulder now runs on
   luminance, and lowering `SKY_WHITE` far enough to fix the ratio caps the solar lobe at 1.16× the
   horizon, which flattens every sunset. The remedy is either attenuating the near-horizon
   in-scattering in the model or giving the solar lobe its own curve. Neither is attempted.
   `SKY_GAIN` stays at 0.09.
6. **The world ends about a kilometre out and you can see it.** The fog that used to hide the
   terrain's far edge was hiding it by being fog — half the contrast of a surface 660 m away, i.e.
   a 1.5 km visibility on a clear day. At an honest 0.00035 the edge is a hard silhouette against
   the sky at the `overview` preset. That is the terrain module's geometry (world size, or a
   distant skirt); the haze under the horizon is already the right colour to receive one.
7. **Night is readable and only partly unlit.** 22:00 renders a deep blue sky with stars over a
   terrain silhouette, which is what `ART_BIBLE.md` §2 asks for. An earlier version of this line
   said "the park under it is black, because the light rigs belong to `effects` and `scenery` and
   neither module exists": the round-1 critic measured two `scenery-lamp-*` lights running at 22:00
   and visibly lit, so `scenery` does have a rig. What is missing is a rig on the RIDES, which is
   `effects`', and the pool size — `POOL_BY_PRESET.medium = 2` means two active light sources for
   the whole park.
8. **No critic ever graded it.** The gate at 8.5 has not run for this or any other module. The
   numbers that do exist — 47-74 draw calls, 31k-140k triangles, 0 console errors, `pnpm test:game`
   green — are within budget and say nothing about whether the frame is good.
9. **The showcase is unverified.** `/game?showcase=environment` exists and was screenshotted by the
   builder, but not since any of these changes.

## What was fixed, and how it was measured

All four were found by reading numbers out of a rendered frame, never from the source.

| Was                                              | Is                                                 | How it showed up                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scene.fogColor` written as linear radiance      | written gamma-encoded                              | Babylon runs `Color3.toLinearSpaceToRef` over it for every PBR material (`BindFogParameters` with its `linearSpace` flag), so the shader saw 0.034 where 0.295 was set. Distant terrain got **darker** with distance: sRGB 58/80/42 unfogged against 46/58/44 at 700 m.            |
| dome painted `SkyState.ground` below the horizon | painted with the azimuth's horizon colour          | The IBL needs a ground hemisphere; the backdrop must not have one. At `overview` the terrain edge sits ~75 px under the true horizon and those px rendered sRGB 24/26/18 against the horizon ring's 75 — the dark band that read as "black above the horizon" for three rounds.    |
| clear-day `fogDensity` 0.0008                    | 0.00035                                            | EXP2 plus Babylon's `toLinearSpace(fog)` put half a surface's contrast into haze at 660 m: a meteorological visibility of ~1.5 km.                                                                                                                                                 |
| `EXPOSURE_KEY` 0.42 / min 0.55 / max 2.2         | 0.78 / 1.0 / 3.6                                   | Set against a frame where the dome was black and the fog four times too dark. At the old values noon settled at exposure 1.054 and sunlit grass measured 0.069 scene-linear, sRGB 80, where a photograph puts it near 120.                                                         |
| shoulder applied per channel                     | applied to luminance, one scale for three channels | A per-channel tone curve compresses the largest channel hardest, and the sky's largest channel is the one carrying its colour: the horizon measured R:G:B 0.80 : 0.94 : 1.00 and rendered grey. After: blue:red 1.54 → 2.81 at dy 0.3 and 2.05 → 3.70 at dy 0.6, levels unchanged. |

## Requests for core

`docs/game/requests/environment.md`. Two of the five have already landed (`ctx.lights`, and
`intensity`/`windMs`/`precipitation` on `EnvironmentState`) and this module now uses both.
