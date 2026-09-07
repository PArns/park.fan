# rides — critic, round 1

Module: `lib/game/rides/` (4,879 lines, 10 files, plus a 702-line selftest of **267 checks**) ·
showcase `/game?showcase=rides` · four machines on the demo park's fairground since `1d75cdd` ·
commit `1d75cdd`.

**Weighted total: 8.71. PASS** (pass is 8.5), no hard gate failed. The second module to clear the
bar, and unlike `track`'s 8.54 this one is not sitting on it: two axes above 9 and none below 8.2.

Graded by the integrator — no independent critic has ever run on this branch, every fan-out died on
the session limit — and by somebody who then implemented this module's own §1 request, which is
disclosure rather than modesty: §4.4 below is a finding about the request I only have because I
tried to use it.

## 1. Scores

| #   | Axis                  | Weight |   Score | One sentence                                                                                                                                                                                                                   |
| --- | --------------------- | -----: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The frame             |   30 % | **8.2** | The carousel is the best single object in the game — scalloped valance, gold trim, brass poles, red saddles — and the fairground reads as one; night is the module's own named weak hour at 3 lights across 6 machines.        |
| 2   | Fidelity              |   20 % | **8.6** | The animation is **solved**, not eyeballed: chains fly out at an angle from `tan θ = ω²(r + L sin θ)/g`, gondolas stay level and lag a degree on the ramps, and the cycle runs in park minutes so throughput is exact at 100×. |
| 3   | Extensibility         |   20 % | **9.2** | The strongest evidence anybody has produced for this axis: a runtime pack in the showcase whose teacups are three levels of nested rotation, and a **third** pack in the selftest asserting a paratrooper is not a re-skin.    |
| 4   | Budget and behaviour  |   15 % | **8.6** | 6 batches, 74 draw calls, 134 instances, 49,356 triangles — 6.2 % of the 1,200 budget — and a 0.0008 ms sim tick. No LOD.                                                                                                      |
| 5   | Determinism and state |   10 % | **9.3** | 267 checks, seeded throughout, and the cycle measured in park minutes rather than ticks, which is what makes the same park behave the same at every speed a player can pick.                                                   |
| 6   | Honesty of the report |    5 % | **9.3** | Six bugs it found by **looking or by a check rather than by reading**, named as such — including one that survived three rounds — and a requests file precise enough to implement from.                                        |

**8.2 × 0.30 + 8.6 × 0.20 + 9.2 × 0.20 + 8.6 × 0.15 + 9.3 × 0.10 + 9.3 × 0.05 = 8.705 → 8.71.**

## 2. Hard gates

`pnpm test:game` green including `test:game-rides`; `tsc` and `eslint` clean;
`node scripts/test-game-lint.mjs` 200 files clean; `errors 0 · hydration 0` in the showcase report;
extensibility 9.2. The module's diff is its own folder plus its report and requests file.

## 3. The frames I looked at

| File                                   | What is actually in it                                                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_probe/final-ride-4-t0.png` and `t80` | The carousel, two sequence frames apart. Between them the ring has **turned** and the horses sit at **different heights on their poles** — the travelling wave, visible rather than asserted. |
| `rides-final/1200-ground.png`          | The fairground from the promenade: carousel, chair swing with bunting, ferris wheel, top spin, all along a paved walk. It reads as a fairground.                                              |
| `rides-final/2200-ground.png`          | Night: the carousel's canopy is edged with lights, the swing carries bunting, one lit canopy. Dark, and the machines carry their own light.                                                   |
| `rides-final/1200-close.png`           | From above: hanging seats, teacups on their turntable, the top spin's A-frames, real shadows.                                                                                                 |
| `_probe/fairground-day.png`            | The demo park's own fairground after placement — the wheel standing clear with the wave swinger beside it and the ring path around, 1,299 guests in the park.                                 |

## 4. Findings

### 4.1 The animation is the best fidelity work in the project

Two clocks — the cycle in park minutes, the machine in ride seconds — joined by a drive envelope,
and the machine's motion derived rather than tuned. A chair swing's seat radius goes 8.00 m → 10.53 m
at speed because that is what the angle equation gives, not because it looked right. The carousel
ran **19 cycles and 456 riders in one park hour against a rated 480**, which is throughput arriving
at its own arithmetic.

This is the axis where most modules in this project have said "researched" and shown a shape. This
one shows a solved equation and a number that matches it.

### 4.2 The bug worth repeating

**Every prism's top cap had its normal pointing down**, so every apron, every platform and every
teacup floor rendered pure black — and it survived three rounds of screenshots because _a black slab
on the ground reads as a shadow_. It was found by a scene probe, not by reading the geometry code
and not by looking at a frame.

That is the third finding of this shape on this branch (the sky dome, the rain particles, the wet
surfaces) and they have a common form: the wrong thing looked plausible.

### 4.3 Night is the module's own weak hour and it says so

Three lights across six machines. The night frame works because the carousel and the swing carry
their own, and the wheel and the pavilion do not — a fairground at night is mostly lit by what the
machines wear, and two of six wearing nothing is visible.

### 4.4 The request I implemented does not fit its own plot, and the report half-knew

`requests/rides.md` §6 proposes five machines on the demo park's fairground with coordinates. Placing
them refuses twice on arithmetic:

- **The wheel and the top spin overlap by ten metres**, because the proposal sized the wheel from
  its manifest footprint (12 × 30) while its real extent is 27.2 m in x — a disagreement this
  module reports as its own §3 and then did not apply to its own layout.
- **Three of the five stand 16–22 m from the nearest path** against a graph service radius of 14,
  which the soak fails as an unreachable queue. It did, on the first run.

Four machines in two rows either side of a new `fairground-midway` path measure clear on both. This
is not a mark against the module — the request is a proposal and it says so — but it is the second
time on this branch that a module's own numbers, applied, contradicted its own layout, and it is
worth a habit: **a placement proposal should be checked against the footprints it is made of.**

### 4.5 What it cannot show yet

124 riders in a whole park day across four machines rated at 2,136 an hour. The guest hook works —
I built it from §1 and it carries riders, height refusals and all — and the volume is the same
D-006 time compression that keeps the shop queues empty. Ride queues read 0 at every sample for the
same reason, so nothing in this module's queue, wait or balk path has been photographed under load.

## 5. What round 2 should do

1. **Light the other four machines.** It is the frame axis, it is the module's own finding, and a
   fairground is a night object.
2. **LOD.** 49,356 triangles is affordable and none of it goes away at distance.
3. **Reconcile `footprint` with the rig** (its own §3), because everything that places a machine —
   the build tool, the demo park, a scenario — reads the wrong number today.
4. **A frame with a queue in it**, which waits on D-006 rather than on this module.
