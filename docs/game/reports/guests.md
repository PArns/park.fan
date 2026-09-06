# guests — module report

Needs, thoughts, wallets, wayfinding, groups, money — and the crowd on screen.
Folder: `lib/game/guests/` (13 files, ~4,700 lines).

> **Who wrote this.** The builder agent was killed by the account session limit with the sim and
> the crowd renderer written and nothing wired: no `main.ts`, a scaffold `index.ts`, and a module
> that had **never been run**. The integrator finished it — `main.ts`, the module registration,
> four bugs, the harness change that made the crowd photographable, and this report. That is said
> here because a report that hides its author is the failure mode the honesty axis exists for, and
> because the four bugs below are what "never been run" looks like.

## What exists

| File                                             | What it owns                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `sim.ts`                                         | The park's day: arrivals against an attendance curve, needs, decisions, groups, walking, queueing, money, leaving. Pure.   |
| `store.ts`                                       | A struct-of-arrays store with stable slots and a min-heap of free ones, so slot `i` is the same person between two frames. |
| `manifest.ts`                                    | Archetypes, parties and thoughts as pack content, with `attachGuestContent`.                                               |
| `needs.ts`                                       | The need columns, read from the registry in `needOrder()` and re-indexed.                                                  |
| `decide.ts` / `thoughts.ts`                      | What a guest wants next; what it is thinking and why.                                                                      |
| `geometry.ts` / `appearance.ts` / `materials.ts` | The body parts, the 16-bit appearance word both sides decode, three shared PBR materials.                                  |
| `crowd.ts`                                       | Three LOD levels of thin instances, camera-driven, with a near band for shadows.                                           |
| `main.ts`                                        | The wiring.                                                                                                                |

## Numbers, measured

At 12:44 on day 1 of the demo park, 900 stepped ticks, `close` camera:

|                                    |                 |
| ---------------------------------- | --------------: |
| Guests in the park                 |         **713** |
| Drawn / culled                     |         713 / 0 |
| LOD 0 / 1 / 2                      |  15 / 163 / 535 |
| **Draw calls, the whole crowd**    |          **14** |
| Triangles, the whole crowd         |         154,018 |
| Triangles per guest, LOD 0 / 1 / 2 | 676 / 386 / 148 |
| Mesh build                         |          8.8 ms |
| Textures                           |         28.8 ms |

Fourteen draw calls is **1.2 % of the game's 1,200 budget** for the thing the game is about, and it
does not grow with the crowd — it is fourteen meshes with a thin-instance buffer each. Two thousand
guests all at LOD 2 would be 296,000 triangles behind the same fourteen calls. The scene around
them is what costs: 261 calls and 1.13 M triangles in that frame, of which the crowd is 5 %.

Sim cost, from `pnpm game:soak` over 48 park-hours at 100×: **mean 0.80 ms/tick** against the 6 ms
whole-sim budget, max 28.7 ms on the tick that rebuilds the venue index.

And two assertions that used to print `not measured: stuckGuests / guests — no guests module api
yet` now run for real and pass: **no stuck guests, no unreachable queues.** `notMeasured` is `[]`.

## Four bugs, and what each one was

**`destKind` was declared and never allocated.** `allocate` builds the store with
`as unknown as GuestStore`, so the compiler was told the column existed and never checked; `grow`,
`zero`, `serialize` and `load` each listed their byte columns by hand and each missed the same one.
Every tick threw `Cannot read properties of undefined (reading '0')`. A cast that lies is the bug,
so the fix is a `BYTE_FIELDS` list the five sites share, a `GuestColumn` union the type is checked
against, and a runtime guard in `allocate` that names an unallocated column.

**Three unsaved accumulators broke save → resume**, and finding them took a field-by-field diff of
two serialisations rather than a guess. The four xoshiro streams were the obvious one. The other
two were not: the gate's **fractional party debt**, which made the first guest to arrive after a
save come in at park minute 2006 in the uninterrupted run and 2006.25 in the resumed one — one
tick, with the people, their ids and their slots identical — and the thought scanner's **cursor and
budget**, which made a resumed run visit different people in a different order and show up as
exactly three differing columns (`thought`, `thoughtAt`, and the `happiness` a thought nudges).
`test-game-save-roundtrip` is green and the diff is now zero fields.

**A step control that does nothing while paused.** The screenshot harness runs at `speed=0` so a
frame is repeatable, and `SimRuntime.tick()` computes `dt` from `clock.speed` and skips its whole
body at `dt <= 0` — so the worker's `step` message ran the scheduler over a world that stood still.
Every frame of this module photographed an empty avenue with "Guests 0" in the HUD. `runtime.step()`
now forces one tick at speed 1, which is the only reading of "one tick" that does not depend on a
speed the caller deliberately set to zero, and `game-shot.mjs` takes `--step=N`.

## Extensibility

`attachGuestContent` claims `guestArchetypes`, `guestParties` and `guestThoughts`, walks
`registry.packs()` **and** subscribes to `onPack` — both, because `onPack` fires on registration and
the bundled packs are registered before any module is built, which is the trap `scenery`, `paths`
and `terrain` each fell into. Needs are core's own category: `core-classic` declares six,
`neon-lagoon` adds `cooling` with a shop that relieves it, and the sim reads whatever
`registry.needOrder()` gives it — the store re-indexes its columns by id on load, so a save written
before a pack was added still opens.

## What is weak or missing, ranked

1. **There is nothing in the park to want.** No shops, no rides, no toilets — those modules do not
   exist — so every need runs to its critical threshold and stays there, and the decision layer
   spends its time on wandering and leaving. The behaviour is modelled for venues that are not
   there yet, which means the interesting half of this module is untested against real demand.
2. **The crowd bunches into tight knots.** Visible in `.game-render/gv5/1200-close.png`: two dense
   clusters on the fountain square with open paving between them. Real crowds do bunch, but the
   lane offset and the local avoidance have never been tuned against a park with destinations in
   it, and this may simply be the wayfinding funnelling everyone down one lane.
3. **No critic has graded it.** Every number here is the integrator's own measurement with the same
   harness the critics use. That is not a grade, and this module has not had one.
4. **The walk cycle is unverified beyond a still.** Nine frames were taken and looked at; nothing
   has watched the animation over time, which is where a phase or a foot-slide error lives.
