# Requests from the `environment` builder to core

Each of these is worked around today; the workaround is named so the integrator can see what it
costs and decide whether the change is worth it.

## 1. Hand modules the `RenderContext`, not just `scene` and `engine` — small

`MainContext` gives `scene` and `engine`. This module needs the sun light, the hemispheric light,
the cascaded shadow generator and the `DefaultRenderingPipeline`, and it finds all four by name:

```ts
scene.getLightByName('sun'); // lighting.ts
scene.getLightByName('sky');
sun.getShadowGenerator();
scene.postProcessRenderPipelineManager.supportedPipelines.find((p) => p.name === 'default');
```

Those names are load-bearing and nothing enforces them: renaming the light in `core/renderer.ts`
would silently leave the sky drawn and the scene lit by whatever the renderer last wrote. A
`ctx.render?: RenderContext` (or just `ctx.lights: { sun, hemi, shadow, pipeline }`) would make it
a compile error instead.

## 2. `EnvironmentState` has no wind, no precipitation type and no intensity — small

The chain produces all three and other modules want them: flags and foliage need `windMs`,
guests need to know whether the drops are rain or snow, and `intensity` is what separates a
shower from a downpour. They are exposed today on this module's own `api` (`intensity()`,
`windMs()`, `snowing()` on the sim side), which means a consumer has to reach for
`ctx.module('environment')` rather than read the state core already hands it.

Suggested addition to `EnvironmentState` in `core/types.ts`:

```ts
/** 0..1 how hard the current weather is doing whatever it does. */
intensity: number;
/** Metres per second. */
windMs: number;
/** What is falling, if anything. */
precipitation: 'none' | 'rain' | 'snow';
```

`computeEnvironment` can default them (`0`, `2`, and `'rain'` when `weather` is rain/storm) so
nothing breaks. Note this is deliberately **not** a sixth `WeatherKind`: snow is rain below
1.5 °C, which is how it behaves for guests too.

## 3. A wetness/season hook on materials — medium, and the one that matters

Wet-surface darkening and the seasonal foliage tint are per-material, and this module owns no
materials. `surfaces.ts` therefore walks `scene.materials`, captures each material's own
`albedoColor`/`roughness` the first time it sees it, and writes a modulation of the captured
values back. It is reversible (`restore()`), it skips anything flagged `metadata.envOwned` or
`metadata.envExempt`, and it is honest about what it is: a runtime multiply, not a shader.

What it cannot do is per-pixel: puddles in the cavities of a path, a wet sheen that follows the
normal map, water pooling by curvature. The right mechanism is a `MaterialPluginBase` registered
by core against every PBR material, with a scene-level `wetness` uniform. That has to be written
in GLSL **and** WGSL (the engine boots WebGPU when the browser has it), and a mistake in it takes
every material in the game down at once, which is why it is a request and not a patch.

Until then, two conventions would help and cost nothing:

- `material.metadata.foliage = true` on anything that should take the season tint. The fallback is
  a name match (`/grass|foliage|leaf|tree|hedge|shrub|bush|lawn|canopy|planting/i`), which will
  eventually tint something called `treehouse-roof`.
- `material.metadata.envExempt = true` on anything that owns its own look (water, emissive
  signage, anything already animating its albedo).

## 4. Nothing calls `dispose()` on a module before `scene.dispose()` — informational

`host.dispose()` disposes the handles and then the scene, in that order, so `surfaces.restore()`
runs while the materials still exist. This is correct today; it is written down here because the
restore pass is silently pointless if that order ever flips.

## 5. `?tod=` moves the clock but nothing re-renders the shadow map bounds — informational

`setTimeOfDay` calls `applyEnv(..., force)`, which is enough for everything in this module (the
dome refills synchronously on `force`, the IBL cube rebuilds, exposure snaps). Noted only so the
next person to debug a stale-looking shadow after a time jump starts at
`CascadedShadowGenerator.autoCalcDepthBounds` and not here.
