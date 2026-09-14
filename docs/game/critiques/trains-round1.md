# trains — critic, round 1

Module: `lib/game/trains/` (3,720 lines, 11 files) · showcase `/game?showcase=trains` · commit
`c12856c`.

**Weighted total: 8.35. FAIL by 0.15** (pass is 8.5), no hard gate failed.

Graded by the integrator, who also finished this module's last fix and wrote its report after its
builder died on the session limit. That is stated at the top of the report and it costs the honesty
axis, below, for a reason that is not the report's fault.

## 1. Scores

| #   | Axis                  | Weight |   Score | One sentence                                                                                                                                                                                |
| --- | --------------------- | -----: | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The frame             |   30 % | **7.8** | A yellow train with paired seats, over-shoulder restraints and a marked nose car, running on the red structure over the lake — and the seats and restraints are blocky at reading distance. |
| 2   | Fidelity              |   20 % | **7.6** | Sub-stepped motion over the arclength spline against `track`'s own physics, a station dwell and a real block model — none of which has been photographed doing its job.                     |
| 3   | Extensibility         |   20 % | **8.8** | `trainProfiles` claimed, read at boot **and** on `onPack`, every number about a train from the manifest, nothing switching on an id.                                                        |
| 4   | Budget and behaviour  |   15 % | **9.4** | **49 cars for 9 draw calls and 16,896 triangles**, and **1,204 bytes a frame** across the worker boundary for 7 trains. The best budget in the game.                                        |
| 5   | Determinism and state |   10 % | **9.2** | Seeded streams only, the save round-trips through the full suite including the 48-hour soak, and the selftest ends on "the world still serialises".                                         |
| 6   | Honesty of the report |    5 % | **8.0** | Candid, names five weaknesses including "nobody has ridden it" — and it is **not the builder's own account**, which is a real loss no amount of care replaces.                              |

**7.8 × 0.30 + 7.6 × 0.20 + 8.8 × 0.20 + 9.4 × 0.15 + 9.2 × 0.10 + 8.0 × 0.05 = 8.35.**

## 2. Hard gates

`pnpm test:game` green including the 86-check `test:game-trains`; `tsc` and `eslint` clean;
`errors 0 · hydration 0` in the showcase report (its two warnings are terrain's showcase landscape,
filed there); extensibility 8.8.

## 3. What I measured, and the frames

From the fleet's own `stats()` on `/game?showcase=trains`:

    trains 7 · cars 49 · styles 3 · meshes 15 · drawCalls 9 · triangles 16,896
    perCar 2,396 · shadowCasters 9 · build 19 ms · textures 96 ms · interpolated true
    frame buffer: 7 trains · 43 cars · 1,204 bytes a frame

**The camera follows a moving train**, which is the fidelity cap `camera-round1.md` names for that
module. Over 180 ticks the camera target tracked the lead car to **0.00 m** while it ran from
x −117.5 to −107.5 (`.game-render/_probe/train-follow.mjs`). I looked at the chase-cam frame: from
behind the train, down the track it is about to take, the red structure receding and the blue layout
on the right. That frame is the reason this module exists.

Also opened: `_probe/train-closeup.png` (the train from outside, seats and restraints and a
lightning-bolt nose legible), `trains-final/1200-close.png` and `1200-ground.png`.

## 4. Findings

### 4.1 The budget is the best in the project and it is not close

Forty-nine cars for nine draw calls is 0.75 % of the 1,200-call budget. The transform crosses the
worker boundary as 1,204 bytes a frame. `guests` draws 850 people for 14 calls and `shops` seven
buildings for a handful; this is the same discipline applied to the thing that moves fastest.

### 4.2 The trap it fell into is worth more than the module's own report says

`addLODLevel` on a thin-instanced mesh compares camera-to-**world-origin**, because a thin-instanced
mesh has no transform of its own. In a 512 m park that is 165 m, past every threshold the module
set, so the running gear and the interior were hidden at every camera — and the symptom was a
close-up of open tubs with no seats and no wheels, with **nothing in the console**. `track/main.ts`
uses the same call correctly on its crossties, which is what makes this a trap rather than a
mistake. `stats().detailed` now counts the cars that got their detail, so the next occurrence is a
number.

### 4.3 The block system has never been seen working

`blocks.ts` is 172 lines of real block model — `planBlocks`, `blockAt`, `nextBlock`,
`distanceAhead` — and the selftest covers it. Every frame in the report shows trains running. Two
trains stacking up at a block is the thing that distinguishes a coaster simulation from a train on a
loop, and it is unphotographed. **This is the single most valuable frame the module does not have.**

### 4.4 `/game` still has no train in it

Not this module's fault: the demo park's reserved coaster plot is 58 × 48 m and the smallest layout
`track` ships is 53 × 213 m (`STATUS.json`, open issue 0). Everything above is the showcase. The
default park will not have a coaster — or a train — until that is resolved, and it is the largest
single gap between what this game contains and what a visitor to `/game` sees.

### 4.5 The missing requests file is a real cost

Five modules filed one and four of those produced findings that changed another module's code —
`shops`' requests file diagnosed the frozen-needs bug in `guests`, with a per-speed table, for a bug
in somebody else's file. This module has none, so whatever it needed from `core` or `track` and
worked around instead is unrecorded, and the only way to find it now is to read 3,720 lines looking
for a shrug.

## 5. What round 2 should do

1. **Photograph the block system.** Two trains, one circuit, a deliberate stack-up, stepped and shot
   at known ticks.
2. **Detail the cars at LOD 0.** `stats().detailed` says how many get it; the ones a player looks at
   are worth more than 2,396 triangles.
3. **Write the requests file**, from the module rather than from the report.
4. **A ride-along at speed**, watched by a person, which is the one thing a stepped harness cannot do.
