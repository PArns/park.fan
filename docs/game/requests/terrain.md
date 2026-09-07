# terrain — requests for core

Cited by name in `env-probe.ts` long before it existed; written in round 2.

## 1. A way for a module to publish a value another module samples

`environment` builds its IBL cube's lower hemisphere from a ground colour it picks itself, and
`terrain` holds the paint histogram and the layer albedos that actually decide what the ground
looks like. They disagree: measured on the demo park, environment's normalised 0.881/1/0.619
against terrain's own 0.536/1/0.305, and a ramp of 5.2° of arc against 27°.

`env-probe.ts` exists to close that and is dead code — `probeAlive: false` in every scene that
loads `environment`, because nothing wires it. A module API would do it (`ctx.module<TerrainApi>`
already exists), but the ordering is the problem: `environment` builds its cube before `terrain`
has painted anything on the first frame.

What would fix it cleanly is a **pull with a default**: a module registers a named sampler on the
registry, and a consumer asks for it with a fallback for "not there yet". That is the same shape as
`registerProcedural`, one level up.

## 2. `LAYER_COUNT` is 7 because the splat array is sized at build time

A pack can redefine any of the seven ground layers now, and can register an eighth, but only seven
are ever _drawn_: the paint weights are a `Uint8Array` index and the layer maps are one texture
array whose depth is fixed when the material is built. Growing it is a change to `material.ts` and
its shader, not to a manifest.

This is a real limit and it is written down in `manifest.ts` rather than hidden. If a pack ever
needs a genuinely new ground beyond a retint, this is the work.
