# rides — module report

Flat rides: the fairground half of a park. A carousel, a chair swing, a wave swinger, a top spin, a
ferris wheel — things that stand on a plot, take a load of guests, run a cycle and put them back.
Folder: `lib/game/rides/` — 10 TypeScript files, 4,879 lines, plus a 702-line selftest of 267 checks.

## What exists

| File           | Lines | What it owns                                                                                                                |
| -------------- | ----: | --------------------------------------------------------------------------------------------------------------------------- |
| `sim.ts`       | 1,122 | The worker half: the cycle, the queue, throughput, breakdowns, the guest bridge, the frame buffers, the save.               |
| `manifest.ts`  |   908 | Content. Claims `rideRigs`, resolves a flat ride, and holds the built-in generator presets the two bundled packs name.      |
| `shapes.ts`    |   851 | The eleven parametric primitives, as pure arrays. No Babylon — the selftest counts their triangles in node.                 |
| `selftest.mjs` |   702 | 267 checks over the shapes, the content path, the rig solver, the cycle, the queue, determinism and the frame.              |
| `rig.ts`       |   481 | The solver: a tree of parts, a phase, and the transform every drawn unit is at. The chain and pendulum physics live here.   |
| `showcase.ts`  |   333 | `/game?showcase=rides` — six machines, one of which is a runtime pack.                                                      |
| `geometry.ts`  |   330 | The main-thread batching: one mesh per (rig part × finish), thin-instanced over `rides × units`, with render interpolation. |
| `types.ts`     |   321 | The vocabulary. Wire format for `rides.state` and `rides.motion`.                                                           |
| `main.ts`      |   267 | Babylon glue: materials, placements, terrain grounding, the night light rig, the public api.                                |
| `materials.ts` |   200 | Five finishes, one procedural grain + normal, for every flat ride in the park.                                              |
| `index.ts`     |    66 | The `GameModule` and the pure re-exports. `RidesMainApi` deliberately not among them.                                       |

`deps: ['core', 'paths']` — the scaffold said `['core','track']` and a flat ride has no track; the
showcase needs a promenade. `kinds: ['ride']`.

## The public API

```ts
// sim (worker) — ctx.module<RidesSimApi>('rides')
find(x, z, { thrill?, cash?, heightCm?, limit? }): RideOffer[]  // ranked by WALK + WAIT in park minutes
offer(id): RideOffer | null
join(id, guest, { heightCm?, cash? }): RideJoin | null          // null = refused; lastRefusal(id) says why
place(id, ticket): [x, z] | null                                // where to stand; moves up as the line does
board(id, ticket): RideBoarding | null                          // the receipt, exactly once, POLLED while on board
leave(id, ticket): void
entrance(id): [x, z] | null
list(): RideView[]        // per ride: state, phase, riders, queue, wait, throughput, utilisation, satisfaction
stats(): RidesStats
runSeconds(id): number    // ride seconds one run of the machine takes
roster(): string[]        // the frame-buffer order

// main (renderer) — ctx.module<RidesMainApi>('rides')
catalogue(): FlatRideProfile[]   // a build bar reads this, not a hard-coded list
profile(id) · meshes() · roster() · focus(id) · stats()

// commands: rides:close { id, closed } · rides:repair { id } · rides:service { id } · rides:demo { id?, on }
// events:   ride:roster · ride:cycle { ride, key, riders, capacity, satisfaction }
//           ride:breakdown { ride, key, name, downMinutes } · ride:fixed · notify
// buffers:  rides.motion (f32 ×4: spin, drive, riders, queue) · rides.state (u8)
```

## Four decisions worth arguing with

**1. Two clocks, and the split is in a different place from `trains`.** The park clock is compressed
sixty-fold, so a carousel driven by it completes eight revolutions in three real seconds.
`trains/types.ts` answered by integrating the whole train in **ride seconds** at a fixed
`RIDE_SECONDS_PER_TICK = 0.05`, and says in its own docblock what that costs: "at speeds above 1 a
ride completes fewer cycles per park hour than it would in reality". This module refuses that cost
for the cycle and pays it only for the animation, because a flat ride's throughput is a number a
park manager plans with and a coaster's lap time is not. So the **cycle** — load, dispatch, run,
unload, the queue, riders an hour — is integrated in park minutes and is exact at every speed
including 100×; the **machine** runs on its own clock, and the join between them is `drive`, a 0..1
envelope the state machine raises and lowers. Against it: the two can disagree — at speed 5 a
cycle's run lasts 18 real seconds of park time while the machine's nominal run is 90, so the
carousel visibly stops before it has finished the eight revolutions the manifest authored. It is a
machine spinning down early rather than a machine at sixty times speed, and I think that is the
right way round, but it is a choice.

**2. `window` on an animation curve is read as a DRIVE range, not a slice of a timeline.** The packs
author `"window": [0.2, 0.8]` on a wave swinger's tilt. With no fixed timeline to slice — the cycle's
length is the park clock's business — it is read as "the canopy starts to cant once the machine is a
fifth of the way up to speed and is fully canted at full speed", which is what a hydraulic tilt
actually does. Every authored number still means something; none of them means what it did.

**3. This module boards a guest that never asked.** `guests/sim.ts` walks a visitor to a
`kind: 'ride'` venue, puts them in `QUEUING` for two to six park minutes and walks them off again —
its own comment says "nothing boards yet". It has no hook for this module. Rather than publish an
API nothing calls and photograph an empty carousel, `bridge()` scans the guest store round-robin
(96 slots a tick) through `guests.inspect()` and puts anybody standing `queuing` within 7 m of an
entrance into that ride's line, at the height their archetype declares. It is the same bridge
`shops` describes in §2 of its report and it is blind the same three ways: the guest does not know,
cannot balk, and its happiness does not move. The eleven-line patch that makes it real is
`requests/rides.md` §1.

**4. A pack's `rideRigs` beats a core `rigs` entry of the same id, and the built-in generators are
presets rather than models.** `core-classic` and `neon-lagoon` name fifteen `procedural` generators
(`carousel-horse`, `ferris-gondola`, `topspin-arms`…) and neither pack is mine to edit, so those
names resolve through a preset library here — but a preset is a **function of the ride**: it reads
the footprint and the radius its own children sit at, so `carousel-base` under a 14 m machine and
under a 22 m one are different drums out of one record, and a ferris rim is exactly as wide as the
gondolas hanging off it. A pack that declares `rideRigs` skips the presets entirely and names
shapes and parameters directly.

## Extensibility

`attachRideContent` claims **`rideRigs`** and reads it by walking `registry.packs()` **and**
subscribing to `onPack` — both, because `onPack` fires on registration and the bundled packs are
registered before any module is built, which is the trap six modules have now fallen into. Nothing
in the folder switches on a pack id or a ride id.

A new ride is a manifest entry: a `rides` block (capacity, cycle minutes, footprint, excitement,
fear, nausea, min height, cost, upkeep, power, queue side, night rig) and a `rideRigs` block naming
shapes, parameters, counts, radii, seats, chains, levelling, pendulum and animation channels. The
showcase proves it in the frame: `/game?showcase=rides` registers a runtime pack whose **teacups**
are three levels of nested rotation — a turntable at 7 turns carrying three platters at 11 carrying
four cups each at 17 — and nothing in `lib/game/rides` knows it exists. The selftest proves it in
node with a **paratrooper** in a third pack, and asserts what "not a re-skin" means: it carries the
pack's own palette (from a theme this repo does not contain), its own seat count, and a triangle
count 2,600 away from the nearest built-in.

Two things are code and are said out loud: a genuinely new **primitive** (the eleven shapes) and a
new **animation channel**. A pack can combine the eleven at any size, count, radius, colour and
motion; it cannot invent a twelfth from JSON. That is the same line `shops` draws at its five
massings and `guests` draws between a thought and a signal.

The failure paths are graded too: a ride naming a rig nobody declares gets a generic machine derived
from its own capacity and footprint, marked `source: 'fallback'`, with one warning; a malformed
`rideRigs` entry is skipped by name without taking its siblings down; an unknown animation channel
is ignored with one warning.

## What is measured, and with what

| Check                           | Command                                                                                                  | Result                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                       | `npx tsc --noEmit`                                                                                       | clean                                                                                                                                                                 |
| Lint                            | `npx eslint lib/game/rides`                                                                              | clean                                                                                                                                                                 |
| Repo game lint                  | `node scripts/test-game-lint.mjs`                                                                        | 199 files clean                                                                                                                                                       |
| Suite                           | `pnpm test:game`                                                                                         | green; soak 48 park-hours at 100×, mean **0.97-1.35 ms/tick** over two runs (max 31.9 / 35.7). The demo park has no rides on it, so that figure is not this module's. |
| Module selftest                 | `node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/rides/selftest.mjs` | **267 checks, exit 0**                                                                                                                                                |
| Console errors / hydration      | 4 × `scripts/game-shot.mjs --showcase=rides`                                                             | **err 0, hyd 0** in every `report.json`                                                                                                                               |
| Barrel import                   | `grep -rn "from '@babylonjs/core'" lib/game/rides/`                                                      | no hits                                                                                                                                                               |
| `window`/`document`/`navigator` | `grep -rnE "\b(window\|document\|navigator)\s*\." lib/game/rides/`                                       | no hits at all                                                                                                                                                        |
| Touched only its own folder     | `git status --porcelain`                                                                                 | `lib/game/rides/*`, this report, the requests file                                                                                                                    |

**The machines, from `flatRides()` in node** (a probe that resolves every registered flat ride and
builds its geometry):

| ride                        | rig source | parts | units | seats drawn / capacity | triangles | drawn extent x·y·z |  rated |
| --------------------------- | ---------- | ----: | ----: | ---------------------: | --------: | ------------------ | -----: |
| `core-classic:carousel`     | builtin    |     6 |    21 |                16 / 24 |    11,064 | 15.8 · 8.7 · 15.8  |  480/h |
| `core-classic:ferris-wheel` | builtin    |     4 |    19 |                48 / 48 |     7,288 | 27.2 · 27.0 · 23.4 |  480/h |
| `core-classic:swing-ride`   | builtin    |     6 |    37 |                32 / 32 |     8,664 | 23.8 · 11.1 · 23.8 |  768/h |
| `core-classic:top-spin`     | builtin    |     8 |     8 |                20 / 20 |     2,332 | 16.7 · 8.3 · 13.8  |  600/h |
| `neon-lagoon:wave-swinger`  | builtin    |     6 |    29 |                24 / 24 |     8,744 | 19.8 · 9.9 · 19.8  |  576/h |
| `rides-showcase:teacups`    | **pack**   |     7 |    20 |                48 / 48 |         — | —                  | 1200/h |

**The frame**, six machines in the showcase, `medium` preset, from
`.game-render/_probe` (`api.stats()` and `__parkfan_game.metrics()`):

|                                         |                                          |
| --------------------------------------- | ---------------------------------------: |
| Batches (one per ride TYPE)             |                                    **6** |
| Meshes = draw calls                     |                                   **74** |
| Thin instances                          |                                  **134** |
| Triangles, all six machines             |                               **49,356** |
| Geometry build, all six                 |                               **9.3 ms** |
| Night lights (pool, `medium`)           |                                    **3** |
| Whole showcase frame                    |              323 draw calls, 260,664 tri |
| This module's share of the frame        | **22.9 % of calls, 18.9 % of triangles** |
| This module's share of the 1,200 budget |                                **6.2 %** |

74 draw calls for six machines is the honest number and it is the highest of the three "placed
thing" modules: `shops` pays 25 for twelve buildings and `trains` 9 for a whole fleet. The reason is
that a flat ride is a **tree of moving parts** and each part that moves independently is its own
thin-instance set — a carousel's base, platform, sixteen horses and canopy cannot share a matrix. It
is one to three calls per (part × finish), not per ride: a park with four carousels pays what a park
with one pays. What it does not have is any LOD, which is weakness 3.

**The sim.** `stats().tickMs` reads **0.0004–0.0013 ms** with three rides indexed and their queues
full, against the 6 ms whole-sim budget. The frame buffer is **51 bytes for three rides** (4 floats

- 1 byte each) — everything else about a ride is a roster event.

**The cycle delivers what the manifest claims.** One park hour at speed 1 (1,200 ticks) with a full
queue: the carousel ran **19 cycles and carried 456 riders against a rated 480/h**, at 48 %
utilisation. The 5 % shortfall is the dispatch and unload phases and the ±18 % per-cycle loading
variation, which is what a real operator loses. The selftest asserts no ride can beat its own
nameplate.

**The chain angle is physics, not a keyframe.** `tan θ = ω²(r + L sin θ)/g`, solved by fixed point;
the selftest checks the residual at the solved angle is under 1e-9 and that the seats **move**:
chair-swing seat radius **8.00 m at rest → 10.53 m at speed**, rising 1.1 m as they go. Nothing
authored that; it falls out of the crown's rotation.

**Determinism.** One stream per ride (`ctx.rng.fork('breakdowns').fork(<entity id>)`), so adding a
second carousel cannot shift the first one's breakdowns. Two runtimes with one seed produce
byte-identical saves after 600 ticks. Save → resume → run both 300 more → diff the two module
slots field by field: **zero differing fields**.

## The bugs the verification found, and what they cost

Each of these was found by a check or a frame, not by reading the code, and each is the reason the
corresponding comment exists.

1. **`facing: 'tangent'` and `facing: 'out'` were swapped.** Found sideways: the selftest measured
   the chair swing's seats at **8.00 m at rest and 5.82 m at speed** — swinging _inward_. The lean
   was correct; "outward" in the unit's frame was pointing along the ring. Sixteen carousel horses
   had been facing radially outward in every frame taken before it.
2. **A part's children hung off the part, not off each of its copies.** A teacup's twelve cups came
   out as **four**, stacked. `count` is per parent unit now and every bundled rig draws exactly what
   it drew before (all their parents have one copy).
3. **A hollow drum is invisible.** No top cap plus backface culling is a cup you see straight
   through; twelve teacups were in the scene and in none of the pixels. It gets an inner wall wound
   the other way, a floor and a rim.
4. **Rounding an accumulator on the way into a save is the same bug as not saving it.**
   `serialize()` wrote every float to six places for readability; a resumed run's `drive` came back
   `0.445239` against `0.445238`, which the spin-up ramp turned into a whole tick of phase inside
   300 ticks and the field-by-field diff reported as five differing fields.
5. **Metal rendered black.** A fully metallic PBR surface has no diffuse term, so on the `medium`
   preset — where the IBL is a dim analytic sky — sixteen brass poles, the canopy's sweeps and its
   brass ring were dark bars. `metal` is 0.5 metallic now.
6. **Every prism's top cap had its normal pointing DOWN, and it read as a shadow.** In
   `.game-render/rides-3/1200-close.png` and again in `rides-4` every machine sat on a pure black
   disc. Two wrong guesses first — shadow acne on a thin slab (removed the apron from the casters,
   no change) and the apron being sized off the footprint (it was, and shrinking it changed the
   size of the black, not its colour). The third round asked the running scene instead
   (`.game-render/_probe/apron.mjs`): the mesh was there, enabled, one instance, `rides-matte`, with
   a first vertex colour of `(0.328, 0.356, 0.381)` — a **grey** slab rendering black. `quad`/`tri`
   derive the normal from the winding, and `prism` wound its top cap `centre → a0 → a1`, which gives
   `(0, sin(a0 − a1), 0)`: a downward normal on an upward face, so it faced away from the sun.
   Every drum in the module had it — every apron, every carousel platform, every teacup floor — and
   it survived three rounds of looking because **a black slab on the ground reads as a shadow**.
   The apron is also sized off what touches the ground now, walking the parent chain for the real
   height rather than reading a part's own offset (a chair swing's seats declare none and hang off
   a crown nine metres up, which paved a 20 m circle for a machine that stands on three).
7. **A carousel valance is not bunting.** One downward triangle per segment came back as a string of
   pennants — a different fairground object. It is a band with a scalloped lower edge.
8. **The showcase has no guests and nothing would ever dispatch.** A showcase loads five modules and
   `guests` is not one of them, so every machine sat in LOADING with an empty line — working and
   unphotographable, which `INTEGRATION.md` §2 says has already cost this project two rounds. The
   `rides:demo` command exists for that, nothing in the game sets it, and what it produced is counted
   separately as `stats().demoRiders`.

## The frames I looked at

Every PNG named here was opened and looked at.

| File                                                | What is actually in it                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_probe/final-ride-4-t0.png` … `-t120.png`          | The carousel from 8 m, four frames at 0/40/80/120 ticks: a scalloped red-and-cream valance with a gold bulb in every notch, sixteen horses in profile on brass poles, with angled necks, tails, red saddles and legs mid-stride, a striped skirt round the base. Between the frames the ring has turned and the horses sit at different heights — the proof that it moves is the sequence, not any one of them. The best thing this module produces. |
| `_probe/c3-ride-4-t0.png`                           | The same framing **before** the facing fix: sixteen horses looking radially outward, off the side of the machine. Kept as the before.                                                                                                                                                                                                                                                                                                                |
| `rides-final/1200-ground.png`                       | A visitor's eye down the promenade at noon: the carousel on the left on its own grey hard standing with its horses in profile, the wave swinger behind it, the ferris wheel on the right on a four-legged tower with red gondolas, the top spin mid-distance, the teacups at the end. It reads as a fairground.                                                                                                                                      |
| `rides-final/2200-ground.png`                       | The same framing at 22:12, and the best night frame: a warm pool of light over the carousel with the bulb ring round its valance and the horses lit under it, the wave swinger's teal ring behind it, the teacups lit red mid-distance, the wheel picked out on the right, stars over all of it.                                                                                                                                                     |
| `rides-final/1200-close.png`                        | The plaza from 40 m: the chair swing with its seats flying out under a lit crown, the teacups with red-and-white cups on three platters, the top spin's yellow arms between red towers, and grey hard standing under each.                                                                                                                                                                                                                           |
| `rides-3/1200-close.png` · `rides-4/1200-close.png` | The same framing with **a pure black disc under every machine** — kept as the before, and as the reason item 6 took three rounds.                                                                                                                                                                                                                                                                                                                    |
| `rides-final/2200-night.png`                        | The whole fairground from 150 m at 22:12: six machines in silhouette, bulb rings glowing on four of them and three pools of coloured light. Honest and weak from this distance — see weakness 2.                                                                                                                                                                                                                                                     |
| `_probe/r1-ride-5.png`                              | The ferris wheel from 65 m: spoked rim, red gondolas hanging level round it, the A-frame tower, a long shadow. Reads correctly; the wheel is thin because it is 27 m across and 7 m deep.                                                                                                                                                                                                                                                            |
| `_probe/r1-ride-7.png`                              | The top spin **before** the proportion fix — towers 8.8 m apart with a gondola wider than the gap it swings through.                                                                                                                                                                                                                                                                                                                                 |
| `_probe/r1-ride-9.png`                              | The teacups **before** the hollow-drum fix: three tan platters and no cups on them at all.                                                                                                                                                                                                                                                                                                                                                           |
| `rides-1/1200-overview.png`                         | From 400 m the whole fairground is about 200 × 60 px of a 1280 × 720 frame. Six machines on 100 m of ground is not a subject for this camera.                                                                                                                                                                                                                                                                                                        |

## What is weak or missing, ranked

1. **Nobody queues who was not put there by this module.** Every rider in every number above came
   from `rides:demo` (in the showcase) or from `bridge()` (in a park with guests). The guests module
   has no hook and the patch is `requests/rides.md` §1. Until it lands, `join`/`place`/`board`/
   `leave`, the balk path, the height refusal and the satisfaction figure are exercised by the
   selftest and by nothing else, and `stats().walkUps` is the only honest measure of real demand.
2. **The night frame is the weakest hour and the fix is not in this module.** The light pool is 3 at
   `medium` (4 at `high`, 6 at `ultra`), so on a six-machine fairground half of them have a ring of
   lit bulbs over unlit ground. That is the same finding the `scenery` critique makes about 72 lamps
   and 2 lights and the `shops` report about `LIGHT_POOL.medium = 2`, and it has the same two
   answers — a pool shared across modules, or baked light decals — and neither is one module's.
   The chase/cycle/strobe modes from the manifest are wired and animate, but they animate three
   lights.
3. **There is no LOD.** A ride is one build at one detail level: sixteen horses at 480 triangles
   each are drawn at 8 m and at 400 m. `trains/reports.md` §3 records why `addLODLevel` is the wrong
   tool on a thin-instanced mesh (it measures camera-to-origin), so the per-unit distance would have
   to be spent in `geometry.ts`'s own loop, which is where it exists and where it is currently spent
   on nothing. At 46,500 triangles for six machines it is not urgent; at thirty machines it would be.
4. **The carousel draws 16 seats against a capacity of 24.** `core-classic:rig-carousel` declares
   sixteen horses of one seat each and the ride declares 24, which is a real carousel (the chariots
   and benches are the other eight) and a rig that does not draw them. `rigSeats` reports the
   difference rather than hiding it; nothing reconciles them, and the simulation uses `capacity`,
   because content wins.
5. **The ferris wheel's footprint is transposed** (`[12, 30]` against a machine 27.2 m across in x).
   The module sizes itself off the shorter and longer side so it draws the right wheel, but a build
   tool reading that footprint would draw a sideways plot. `requests/rides.md` §3; it is a one-line
   pack fix I may not make.
6. **`board()` must be polled.** The receipt is available only while the guest is on board — ask ten
   park minutes later and the machine has already put them back, and the null reads as "nobody
   boarded". The selftest's first version made exactly that mistake. A `boardedAt` on the ticket
   would make it a query rather than an event; it is not there.
7. **The showcase's plaza is a large empty pink octagon** in the middle of the `close` frame, and
   the machines are around its edge. That is the showcase's composition, not the module's, and it is
   the same criticism `shops` makes of its own street.
8. **The demo park still has no rides on it.** Everything above is the showcase; `demo-park`
   reserves the `fairground` plot and places nothing. Coordinates, yaws and the rated throughput of
   the five I would put there are in `requests/rides.md` §6.
9. **No critic has graded this.** Every number above is my own measurement with the same harness a
   critic uses, which is not a grade.
10. **Two constants are copied from `guests`** (`PARK_OPEN`, `PARK_CLOSE`) and the breakdown rate is
    derived rather than authored, because the pack schema has no field for it. Both are requests
    (§5, §2) and both are visible in the behaviour: a park whose hours differ would have rides that
    open at the wrong time.

---

# Round 2 — a coaster and a flume get a line in front of them

`docs/game/requests/rides.md` §4 recorded the largest hole this module had, and it was not this
module's to fill alone: **no guest in this game could ride a coaster.** `sim.ts` opened with
`if (entity.kind !== 'ride') return`, so the join / place / board / leave / balk / height machinery
— which exists exactly once, here — never saw the game's headline object, and a coaster's trains
dispatched on a dwell timer with nobody in them. A flume walked into the same wall.

It is fixed. A guest now walks to a coaster, joins its queue, waits, boards, rides and leaves, and
the same for a flume, and the numbers are below.

## 1. The shape: a kind declares itself, and a dispatcher answers two numbers

The obvious repair is two more strings in one check. That is the bug, not the fix — three kinds is
exactly the point at which a switch on a kind stops being a shortcut, and this project's rule is
that core never switches on one. So a kind **declares** that it can be queued for and names the
module that operates it:

```ts
// lib/game/core/registry.ts
registerQueueable(kind: string, dispatcher: string): void
dispatcherOfKind(kind: string): string | undefined
isQueueable(kind: string): boolean
```

fed from a new `GameModule.queueable`, registered beside `kinds` in both `sim-runtime.ts` and
`host.ts`. `rides` declares `['ride']` (it is its own dispatcher), `trains` declares `['coaster']`
and `flumes` declares `['flume']`.

**A second map rather than a flag on `registerKind`, and that is the load-bearing decision.** A
coaster is _owned_ by `track`, which stores and builds the layout, and _operated_ by `trains`,
which is the half that has a block plan and a train standing on a platform. One map cannot hold
both answers, and forcing it to would make the owner of a kind the operator of it — which is false
for the only two-module machine in the game.

What a dispatcher answers is `Dock` (`core/types.ts`): where the line stands and which way it runs
back, what one vehicle-load holds, the interval between departures, how long a rider is aboard,
and whether the machine can run at all. Two verbs, `dock(id)` and `seat(id, n)`.

`rides/sim.ts` then reads a `RideProfile` — the queue-facing half of what used to be
`FlatRideProfile`, which now extends it — and a machine somebody else draws gets one from
`resolveDockedRide()`: name, excitement, fear, nausea, height limit, upkeep and power out of the
same `rides` manifest entry a carousel uses, capacity and cycle out of the `Dock`. The four-phase
cycle, the rate-limited load, the breakdown roll, the throughput ring, the satisfaction model and
the save are the flat ride's, unchanged, for all three kinds.

## 2. The one hard decision: which clock a queue runs on

**A machine's animation clock is real time and the park clock is compressed twenty-fold, so the
dispatch you WATCH and the dispatch a guest EXPERIENCES cannot be the same event.** At speed 1 a
tick is 0.05 ride seconds and 1/60 of a park minute, so twenty park minutes pass per real minute;
at the speed 20 that `game-day-budget` runs at, four hundred do. A queue gated on the physical
train boards **once per park day** at speed 20 and twenty times too slowly at speed 1 — and worse,
the throughput would change with a setting in the speed menu.

So `Dock` is in park minutes: the machine's own interval read as real seconds and converted. A
`Kleiner Kreisel` with two trains and a 92.5 s cycle is a departure every 0.77 park minutes and
1,557 riders an hour, which is exactly the figure `trains`' own `FleetStatus.ridersPerHour`
already quotes analytically and says out loud should not be counted.

**This is not a new compromise; it is the one this module already shipped.** A flat ride's cycle
is park minutes and its `spin` is ride seconds, and `runSecondsOf()` converts between them with
the same `× 60`: a carousel's 1.5-park-minute run phase is 4.5 real seconds of park time against a
90-ride-second animation. The carousel has had a 20× divergence between what it does and what it
looks like since the day it was written, and nothing in 267 checks noticed, because it is the only
way a compressed park clock and a real-time animation can both exist.

What it costs is visible and is stated rather than hidden: over one park day at speed 20 the
coaster's line boarded about 70 loads while its trains completed **2** physical dispatches — the
same ratio is 20 : 1 at speed 1. `trains.platform()` exists and answers, honestly, which train is
standing on the platform and how many seats are free in it; it is deliberately not what gates
boarding, and `seat()` records at fleet level rather than against it so that a load handed over
between two arrivals is not lost. Fixing it properly is a D-006 question about the whole world's
clock, and it is filed as `requests/rides.md` §8.

## 3. Numbers

### The demo park has no coaster and no flume in it

`buildWorld` answers `{path: 21, scenery: 1516, shop: 6, ride: 4, pool: 3, building: 2}`. The
`coaster` shelf at (−96, −52) and the `flumes` pad at (168, 18) have been reserved since the pads
were written and nothing has ever been placed on either, so `pnpm game:day-budget` cannot show
this working — the four flat rides carry the whole park because they are the whole park.
`scripts/game-ride-boarding.mjs` runs the identical world, identical modules and identical
sampling with one coaster and one slide dropped on those two plots, and `--flat-only` reproduces
the day-budget run exactly for the before column. Placing them for real is `demo-park`'s call and
is `requests/rides.md` §5.

### With a coaster and a flume — one park day, seed 1, speed 20, 14 park hours

| machine                                | dispatched by | riders, flat only | riders, with both |   rated |
| -------------------------------------- | ------------- | ----------------: | ----------------: | ------: |
| `core-classic:family-invert` (coaster) | `trains`      |                 — |         **1,399** | 1,557/h |
| `neon-lagoon:tube-slide` (flume)       | `flumes`      |                 — |           **416** |   277/h |
| `core-classic:carousel`                | `rides`       |             2,021 |             1,223 |   480/h |
| `neon-lagoon:wave-swinger`             | `rides`       |             1,737 |               611 |   576/h |
| `core-classic:ferris-wheel`            | `rides`       |               910 |               380 |   480/h |
| `core-classic:top-spin`                | `rides`       |               750 |               476 |   600/h |
| **total**                              |               |         **5,418** |         **4,505** |         |
| arrivals                               |               |             2,261 |             2,713 |         |
| height refusals                        |               |               376 |                30 |         |

Three things in that table are worth more than the headline.

**The coaster took a fifth of the park's riding on its own** (1,399 of 4,505) and the flat rides
lost roughly what it gained — a redistribution, which is what a new machine in a park with fixed
demand is.

**Arrivals went UP 20 %** (2,261 → 2,713): `guests` counts ride venues into the park's appeal, so
two more machines bring two hundred more people through the gate. That is the venue path working,
not a coincidence.

**Height refusals fell 376 → 30.** `family-invert` asks for 100 cm where the top spin asks 140 and
the swing ride 120, so the children who were being turned away from everything in the fairground
now have a ride. Nobody designed that; it fell out of the same height check running against a
machine it had never seen.

And one number went the wrong way and it is not the boarding's fault: **interactions per visitor
fell 7.01 → 5.39.** The two plots are 200 m west and 190 m east of the fairground, a guest walks
1–1.5 m per PARK minute (D-006), and a visitor who picks the coaster spends most of an afternoon
getting to it. Both machines sat at **17 % utilisation** against nameplates of 1,557/h and 277/h,
i.e. demand-limited with an empty line, not supply-limited. That is a placement finding about a
park whose walking cost is already a known open issue, and it is the strongest argument in this
report for `requests/rides.md` §5 putting them somewhere a person can reach.

### With a full line, the machinery delivers what it claims

`selftest.mjs` §9, one park hour with the queue kept topped up:

```
coaster 1480 riders/h (rated 1556) · flume 206 (rated 277) · carousel 456 (rated 480)
```

95 % of the coaster's nameplate and 74 % of the flume's, against the carousel's 95 %. The flume's
gap is its own and is arithmetic rather than a fault: `neon-lagoon:tube-slide` is a **one-seat**
ring on a 13-second interval, so its whole cycle is 0.217 park minutes and its load phase is
0.04 of one — a window narrower than the tick this simulation runs on, so a fractional guest is
carried in `boardAccum` and the machine loses a departure now and then. A raft slide, five seats
on 28 seconds, does not have the problem.

### The flat rides moved too, and here is the whole reason

| seed | riders before | riders after | interactions/visitor |
| ---- | ------------: | -----------: | -------------------- |
| 1    |         4,930 |        5,418 | 6.59 → 7.01          |
| 2    |         4,844 |        5,256 | 6.56 → 7.04          |
| 3    |         4,972 |        5,110 | 6.64 → 6.83          |

One line causes all of it. `guests/rebuildVenues` used to index a ride at `entity.position`; it now
indexes it at `rides.entrance(id)` — the point somebody actually queues at. For a coaster that is
compulsory (the station can be a hundred metres of track from the layout origin, and
`paths.reachable` was answering about the wrong end); for a flat ride it is a **1.4 m** shift onto
the machine's own queue side, and it is worth 3–10 % more riding because `REACH_RADIUS` is 3.2 m
and the guest now arrives on the side the line is on. Verified by reverting that one expression:
with the venue back at the entity, seed 1 reproduces the pre-change day **exactly** — 4,930 riders,
2,265 arrivals, all four per-machine counts identical. Everything else in this round is
behaviour-neutral on a park with no coaster in it.

## 4. What is in the tests

`pnpm test:game-rides` is **297 checks** (was 267), all clean; `flumes` 190, `trains` 86, `track`
95, `tools` 88, `camera` 114 unchanged; `pnpm test:game` green end to end including both soaks.

The thirty new ones are two sections:

- **§9 · a coaster and a flume** — all three kinds get a line; `dispatchedBy` names the right
  module for each; the frame roster still holds only the flat ride (`rides.motion` is indexed by
  roster position and a coaster in it would shift every index after it and hand the renderer a
  machine with no rig); the coaster's queue point is off the layout origin and beside its own
  station; a 90 cm child is refused with `too-short`; join → place → board → leave works and the
  receipt carries the lap time; a park hour of demand is carried without beating the nameplate;
  the load travels back to the fleet and never exceeds the train's seats; and the world
  round-trips with a coaster queue in the save.
- **§10 · docked determinism** — two runs of one seed write the same bytes with a coaster in them,
  the fleet that carried them writes the same bytes, and a run resumed from its own save stays
  identical to one that was never interrupted. `trains` gained one serialised field
  (`FleetState.riders`) and that is the gate it could have broken.

## 5. What this does NOT do

1. **A coaster's queue is a line of people on grass.** There is no queue-line geometry for any
   machine in this module — a flat ride's line is the same — so what a screenshot shows is guests
   standing in a serpentine at 0.85 m pitch beside the platform, and no railings.
2. **The visible train is not the one they got on.** §2 above. `trains.platform()` reports the real
   one; nothing draws the difference, and at speed 20 the gap is 70 boarding dispatches to 2
   physical ones.
3. **A coaster breakdown closes the queue and does not stop the trains.** `rollBreakdown` runs for
   every machine with a line, so a coaster does break down (about once a park day at the derived
   MTBF of 951 park minutes) — but `trains` is not told, so the fleet keeps circulating in front of
   a closed station. `requests/rides.md` §9.
4. **Every coaster in the game has the same excitement.** Neither bundled pack declares
   `excitement`, `fear` or `nausea` on a `coaster` or a `flume` entry, so `resolveDockedRide`
   falls back to 6 / 3 / 2 for all of them and a thrill-seeker cannot tell a family invert from a
   hyper. It is four numbers per pack entry; `requests/rides.md` §6.
5. **A flume charges nothing and a coaster charges nothing.** `price` is 0 for every machine here,
   as it already was for flat rides — `rideBase` has no price field. Unchanged, and still worth a
   note now that the money path runs through three kinds instead of one.
6. **`FleetStatus.riders` is the last load, not a manifest of who is aboard.** It is one number per
   fleet, it does not feed `trainMassKg`, and a train drawn with twenty riders in it draws twenty
   empty seats. Making it per-train and feeding the physics is `requests/rides.md` §7.
7. **Nothing here was graded by a critic.** Every figure above is my own measurement with the same
   harnesses a critic uses, which is not a grade.

### The line is short, and it is short everywhere in this park

Sampled once a park hour at the coaster's dock (−75, −25.5) and the flume's (154, 18), same run:

| park hour | coaster queue | on board | riders so far | guests within 12 m of the platform | flume queue |
| --------: | ------------: | -------: | ------------: | ---------------------------------: | ----------: |
|         2 |             3 |        0 |            41 |                                  9 |           0 |
|         4 |             3 |       20 |           272 |                                 20 |           5 |
|         6 |             2 |        9 |           636 |                                 14 |           8 |
|         8 |             4 |        0 |           848 |                                 10 |           4 |
|        12 |             3 |        0 |         1,281 |                                 11 |           4 |

A full train (20 of 20) at hour 4, and five to twenty-seven people standing around the platform
for most of the day — but a line of three, not thirty. That is not this round's doing and not the
coaster's: **no machine in this park ever holds a long queue.** A flat ride's load phase takes
`capacity / loadMinutes` guests a minute off the front — 26.7 a minute for the carousel — against
about 2.4 arrivals a minute, and the demo park's own `game-day-budget` run has the `queued` column
at 0–21 across four machines all day. A coaster's platform drains faster still, because its whole
cycle is 0.77 park minutes. Anyone photographing a queue in this game is photographing three
people, whatever they point at.

One consequence of the same arithmetic is worth stating rather than leaving in the code. With
**two** trains a departure comes every 0.77 park minutes while a lap takes 1.32, so
`dockedSplit()` clamps `run` at 0.88 of the cycle and a rider is modelled as aboard for 0.68 park
minutes instead of 1.32. The throughput is exact either way — that is what `cycleMinutes` carries
— but `rides` runs one vehicle at a time and cannot hold two loads in flight, so with `n` trains
the lap is compressed into the interval. A single-train fleet has no clamp and no compression.

## 6. The frames

`node scripts/game-shot-coaster-queue.mjs --url=http://localhost:3001 --out=.game-render/rides-boarding --tod=12:00 --step=9000 --passes=1`
— the **dev server on :3001** (production on :3100 is an older build and has none of this),
demo park, seed 1, both machines dispatched in through the harness's own `entity:add`, stepped
9,000 ticks from 12:00 to a clock of **14:29** with 1,591 guests in the park, **0 console
errors**, 787 draw calls, 1.71 M triangles, sim tick 1.90 ms. Two files per pose: `-hud` with the panel over it (the counters are the evidence)
and the same frame with `[data-game-hud]` hidden (the picture).

- `.game-render/rides-boarding/station-0.png` / `station-0-hud.png` — the coaster's platform from
  the east at 20 m: the grey apron, the train standing on it, and the line of guests along it.
  The panel reads **In a queue 1 · On a ride 6 · Rides taken today 352 · Riders per hour 263** at
  14:29 on day 1.
- `.game-render/rides-boarding/platform-0.png` / `platform-0-hud.png` — the same thing from 30 m,
  with the loop path and the guests walking to it in frame.
- `.game-render/rides-boarding/approach-0.png` / `approach-0-hud.png` — wider still.
- `.game-render/rides-boarding/flume-0.png` / `flume-0-hud.png` — the slide's tower, its stair
  and the lakeside path guests reach it from. The dock is the patch of grass at the foot of the
  stair, west of the tower, and at this instant it holds nobody: a one-seat ring on a 13-second
  interval empties its line as fast as the line arrives.

Two things a reader should know about these pictures before drawing a conclusion from them.
**There is no queue-line geometry anywhere in this module** — a flat ride's line is drawn the same
way, which is to say not at all — so what is visible is guests standing at 0.85 m pitch in the
serpentine `placeOf()` puts them in, on grass, with no railings. And **the panel's "In a queue"
counts the four flat rides only**, because `ui/telemetry.ts` builds its ride list from the
`ride:roster` event and that event is deliberately the drawn machines; `Rides taken today` and
`Riders per hour` beside it are frame stats and do include the coaster. That inconsistency is
this round's doing and is filed as `requests/rides.md` §11.
