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

## What is weak or missing, ranked

> The list below was measured by the integrator after the builder was killed by an account
> session limit mid-sentence. Items 1-4 of the first version have been fixed; what they were and
> what the numbers said is in `STATUS.json` and in the docblocks of the three files that changed.
> Everything here is a number read off a frame or off the model, not an impression.

1. **The sky's horizon is about 4.5× its zenith and a real clear sky is nearer 2:1.** This is
   Preetham's own horizon overshoot — the model integrates an infinite air path with no ground and
   no aerosol scale-height cutoff — and it is not the tone curve's fault: the shoulder now runs on
   luminance, and lowering `SKY_WHITE` far enough to fix the ratio caps the solar lobe at 1.16× the
   horizon, which flattens every sunset. The remedy is either attenuating the near-horizon
   in-scattering in the model or giving the solar lobe its own curve. Neither is attempted.
   `SKY_GAIN` stays at 0.09.
2. **The world ends about a kilometre out and you can see it.** The fog that used to hide the
   terrain's far edge was hiding it by being fog — half the contrast of a surface 660 m away, i.e.
   a 1.5 km visibility on a clear day. At an honest 0.00035 the edge is a hard silhouette against
   the sky at the `overview` preset. That is the terrain module's geometry (world size, or a
   distant skirt); the haze under the horizon is already the right colour to receive one.
3. **Night is readable and still unlit.** 22:00 now renders a deep blue sky with stars over a
   terrain silhouette, which is what `ART_BIBLE.md` §2 asks for. The park under it is black,
   because the light rigs belong to `effects` and `scenery` and neither module exists.
4. **No critic ever graded it.** The gate at 8.5 has not run for this or any other module. The
   numbers that do exist — 47-74 draw calls, 31k-140k triangles, 0 console errors, `pnpm test:game`
   green — are within budget and say nothing about whether the frame is good.
5. **The showcase is unverified.** `/game?showcase=environment` exists and was screenshotted by the
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
