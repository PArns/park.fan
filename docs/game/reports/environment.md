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

> **This section was written by the integrator, not the builder.** The builder was killed by an
> account session limit mid-sentence, exactly here — the two empty list items below are where its
> own honest self-assessment stopped. What follows is measured from screenshots taken afterwards
> and is deliberately not a guess at what it would have written.

1. **Noon has no sky in frame and the park is dim.** `.game-render/final1/1200-overview.png`: the
   terrain fills the viewport edge to edge from the `overview` preset, and the grass reads as a
   dull olive rather than as lit-at-noon green. Two rounds earlier the same preset showed a sky
   strip and brighter ground, so exposure or the sun's intensity moved the wrong way while the
   horizon left the frame.
2. **22:00 is very nearly black.** `.game-render/final1/2200-overview.png`: a faint blue cast on
   the lake and nothing else readable. `ART_BIBLE.md` §2 asks for the opposite — "the ambient drops
   to a deep blue (not black), so silhouettes stay readable" — and there is a deep blue in there
   now, just three or four stops under where a person could see the park by it. The night light
   rigs that are supposed to carry that frame belong to `effects` and `scenery`, neither of which
   ever started, so this is only half the module's fault and the whole build's problem.
3. **No critic ever graded it.** The gate at 8.5 did not run for this or any other module, so
   nothing here has passed anything. The numbers that do exist — 62 draw calls, 32,118 triangles,
   0 console errors, `pnpm test:game` green — are within budget and say nothing about whether the
   frame is good.
4. **The showcase is unverified.** `/game?showcase=environment` exists and was screenshotted by the
   builder, but the harness run that would confirm it after these last four file changes was never
   taken.

## Requests for core

`docs/game/requests/environment.md`. Two of the five have already landed (`ctx.lights`, and
`intensity`/`windMs`/`precipitation` on `EnvironmentState`) and this module now uses both.
