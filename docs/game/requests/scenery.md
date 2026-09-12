# Requests from the `scenery` builder

Nothing here blocks the module — each item has a working workaround in `lib/game/scenery/`, named
below so the integrator can see what to delete when the change lands.

## 1. Run the module's self-test in `pnpm test:game` (package.json)

`lib/game/scenery/selftest.mjs` covers the three things a green build cannot: the extensibility
gate (a new manifest entry becomes a working prop with no code change), placement determinism, and
the scatter field's order independence — the property that lets the renderer and the simulation
evaluate the same landscape from different directions and agree.

```jsonc
// package.json
"test:game-scenery": "node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/scenery/selftest.mjs",
"test:game": "… && pnpm test:game-scenery && …",
```

Run by hand today; 20 checks, ~0.4 s.

## 2. `maxSimultaneousLights` on the terrain ground material

The night rig pools up to six real `PointLight`s and hands them to the lamps nearest the camera
(`night-lights.ts`). `PBRMaterial.maxSimultaneousLights` defaults to **4**, and the scene already
runs three permanent lights — `sun`, `sky` and `env-moon-light` — so the ground material has
exactly **one** slot left. Measured at the `ground` preset at 18:30: two pooled lamps are enabled,
and only one of them puts light on the path.

The scenery materials set `maxSimultaneousLights = 6` themselves, so props under a lamp are lit
correctly; it is the terrain that cannot take the second lamp. Either raise it on
`terrain/splat-material.ts`'s material, or make it a field of `QualitySettings` so both modules
read one number.

The pooled lights carry `renderPriority = -1` so they sort behind the sun and the sky term — what
gets dropped when a material runs out of slots is a lamp and never the sun. Please keep that
invariant if the light budget is centralised.

## 3. `SimHandle` has no `deserialize`, but `ARCHITECTURE.md` §4 says it does

The interface in `core/types.ts` has `serialize?()` and `rebuild?()`; the table in §4 lists
`deserialize?(state)`. `sim-runtime.ts` restores module state by calling `rebuild()` after the
world is in place, which is the real contract. The scenery sim reads `world.modules.scenery` in
`rebuild()`. Documentation fix only — the code is fine.

## 4. The `overview` fallback camera preset sits outside most LOD ranges

`FALLBACK_PRESETS.overview` is 340 m from the origin. The packs declare `lod: [40, 120, 300]` for
trees, so reading the last number as a cull distance emptied the whole park in that one shot. The
module now culls at `max(lod[2], height × 55)`, which is the right rule anyway (a thing disappears
when its screen size does, and that scales with its height). No change needed in core — recorded
because the next module to draw something small will hit the same preset.

## 5. `paths` is a scaffold, so the showcase paints its path

`showcase.ts` stamps a concrete strip through `terrain.brush({ shape: 'paint', … })`. That is the
terrain module's own public api and goes through the same command the sculpt tool sends, so the
simulation's heightmap agrees with the picture and the scatter reads the paving as ground nothing
may grow on. When the paths module lands, the showcase should place a real path instead and the
scatter should take its exclusion from `PathGraph` rather than from the paint layer.

## 6. i18n keys, when a prop name reaches the HUD

`PropSpec.name` is the manifest's English label and is used nowhere a player can read it today.
The build bar will want localized names; they are already in the manifest (`name: {en, de}`), so
this is a request for the **ui** module to call `Registry.name(def.name, locale)` rather than for
new keys.
