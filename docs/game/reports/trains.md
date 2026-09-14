# trains — module report

The thing that moves on a coaster. `track` builds and validates a layout; this runs a fleet over
one. Folder: `lib/game/trains/` — 11 TypeScript files, 3,720 lines, plus a 594-line selftest of 86
checks, wired as `pnpm test:game-trains`.

> **Who wrote this.** The builder agent died on the account session limit — the fifth fan-out to go
> that way — with the module written and its own report and requests file not started. It stopped
> mid-fix, one message deep into the bug in §3 below, having already diagnosed it correctly. The
> integrator finished that fix, ran the verification, took the frames and wrote this file. So the
> "what is weak" section is mine and not the builder's, and it is shorter than it should be for
> that reason: the person who wrote 3,720 lines knows things about them that a person who read them
> afterwards does not.

## What exists

| File           | Lines | What it owns                                                                                       |
| -------------- | ----: | -------------------------------------------------------------------------------------------------- |
| `geometry.ts`  |   909 | The cars: chassis, bogies, seats, restraints, nose. Procedural, no kit assets.                     |
| `sim.ts`       |   652 | The worker half — dispatch, station dwell, the fleet's state, the transform buffer it publishes.   |
| `fleet.ts`     |   498 | The main-thread half: thin instances per style, render interpolation, the per-car LOD, `leadPose`. |
| `motion.ts`    |   327 | `stepTrain` over the arclength spline, sub-stepped, against the `track` module's own physics.      |
| `materials.ts` |   290 | Liveries, generated rather than imported.                                                          |
| `manifest.ts`  |   281 | `trainProfiles` as content: cars, seats, mass, drag, restraint, livery. Claims the pack category.  |
| `types.ts`     |   191 | The vocabulary, `MOTION_SUBSTEPS`, `RIDE_SECONDS_PER_TICK`.                                        |
| `blocks.ts`    |   172 | Block sections: `planBlocks`, `blockAt`, `nextBlock`, `distanceAhead`, `wrapS`.                    |
| `main.ts`      |   207 | The Babylon glue, the camera follow source, the public API.                                        |
| `showcase.ts`  |   132 | `/game?showcase=trains`.                                                                           |
| `index.ts`     |    61 | The `GameModule` and the pure re-exports. `TrainsMainApi` deliberately not among them.             |

`deps: ['core', 'track']`, `sim` on the worker, `main` behind a dynamic import.

## What is measured

All figures from `/game?showcase=trains` — three layouts from the `track` showcase, seven trains
across them — at commit `03b29db` plus the fix in §3.

**The fleet, from its own `stats()`:**

| quantity                       |      value |
| ------------------------------ | ---------: |
| trains / cars                  |     7 / 49 |
| styles                         |          3 |
| meshes                         |         15 |
| **draw calls**                 |      **9** |
| **triangles**                  | **16,896** |
| triangles per car, full detail |      2,396 |
| shadow casters                 |          9 |
| build / texture (ms)           |    19 / 96 |
| interpolated                   |       true |

Forty-nine cars for **nine draw calls** is thin instancing doing its job; the whole fleet is 0.75 %
of the 1,200 draw-call budget. The showcase frame around it is 145 draw calls and 608,820 triangles
with **0 console errors and 0 hydration warnings** (`.game-render/trains-final/report.json`); the two
warnings are terrain's showcase landscape, filed there.

**The frame buffer:** 7 trains · 43 cars · **1,204 bytes a frame** across the worker boundary
(selftest §7). The transform is published as a typed buffer and interpolated on the main thread.

**The camera follows a moving train**, which is what `camera-round1.md` names as that module's
fidelity cap ("follow mode has never followed anything that moves"). Measured over 180 ticks with
`.game-render/_probe/train-follow.mjs`:

    armed  {"id":"train:coaster-1:0","ok":true,"mode":"follow","following":"train:coaster-1:0"}
    +60    train [-117.5, 10, 60]   camera target [-117.5, 13.5, 60]   distance 0.00 m
    +60    train [-115,   10, 60]   camera target [-115,   13.5, 60]   distance 0.00 m
    +60    train [-107.5, 10, 60]   camera target [-107.5, 13.5, 60]   distance 0.00 m

The id space is this module's (`train:<rideId>:<index>`), namespaced so a source registered later
cannot shadow a plain entity id, which is the shape `requests/camera.md` §5 asked for.

**Content, not code.** `registry.registerPackCategory('trainProfiles', 'trains')`, read by walking
`registry.packs()` **and** subscribing to `onPack` — both halves, which is the trap six modules have
now fallen into. Nothing in the folder switches on a pack id or a style id.

## The frames I looked at

| File                           | What is actually in it                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_probe/train-closeup.png`     | A yellow six-car train on the red steel structure over the lake: paired seats, over-shoulder restraints, a lightning-bolt marking on the nose car, a dark chassis under it. It reads as a coaster train. |
| `_probe/train-follow.png`      | The chase cam from behind that train, looking down the track it is about to take, the red structure receding and the blue layout on the right. The frame this module exists for.                         |
| `trains-final/1200-close.png`  | The same train from outside, mid-circuit, with the timber layout behind it.                                                                                                                              |
| `trains-final/1200-ground.png` | Eye level under the timber structure — no train in this framing at this tick, which is honest rather than staged.                                                                                        |

## 3. The bug the builder died fixing, and it is worth writing down

`addLODLevel` is the wrong tool for a thin-instanced mesh, and nothing says so.

The first version hung Babylon's own `addLODLevel(d, null)` on the running gear and the interior —
the same call `track/main.ts` puts on its crossties, which works there. Here it hid both meshes at
**every** camera in the showcase: `Mesh.getLOD()` measures from the mesh's own bounding-sphere
centre, and a thin-instanced mesh has no transform of its own, so its origin is the world origin.
The distance Babylon compared was camera-to-(0,0,0) — 165 m in a park 512 m across, past every
threshold the module set.

The symptom was a close-up of open tubs with no seats, no restraints and no wheels under them, and
**nothing in the console said anything**. The distance that matters is camera-to-car, and the only
place that exists is the per-car loop in `fleet.ts`. `stats().detailed` reports how many cars got
their running gear this frame, so the next time it is a number rather than a squint.

## What is weak or missing

1. **`/game` has no trains**, because the demo park has no coaster — and it cannot have one: its
   reserved plot is 58 × 48 m and the smallest layout `track` ships is 53 × 213 m (`STATUS.json`,
   open issue 0). Everything above is the showcase.
2. **Two trains have never been photographed holding at a block.** `blocks.ts` is real and the
   selftest covers it, but the frames in this report show trains running, not a block system doing
   its job. That wants a layout with two trains and a deliberate stack-up.
3. **The cars are simple.** Seats and restraints are blocky black shapes at 2,396 triangles a car;
   they read correctly and they are not detailed. `guests`' finding applies here too — the eleven
   nearest objects are the ones a player looks at.
4. **No requests file.** The builder never wrote one, so whatever it wanted from core or from
   `track` is unrecorded. If something in this module looks like a workaround, it probably is one.
5. **Nobody has ridden it.** The follow camera is verified by numbers and one frame; a person
   watching a full circuit at speed would find things a stepped harness cannot.
