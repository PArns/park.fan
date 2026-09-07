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
