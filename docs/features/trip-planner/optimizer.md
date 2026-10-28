# The optimizer

The day can sort itself. Two buttons under the axis (`PlannerOptimizeActions`): „Alle Headliner
einplanen" adds the park's headliners and orders the result, „Tag optimieren" only re-orders what is
there. Both run `optimizeDay` (`lib/planner/optimize.ts`) and differ in one argument; they are two
controls because "fill my day" and "is this the best order" are different questions. Open this
when changing what the engine minimises, how it searches, what it refuses, or the fit assistant.

Two standing rules govern it and are not repeated here:
[the planner's day ends when the park closes, and a headliner is not a residual](../../rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md)
and [a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).

## What it minimises

Three things in a fixed order; the order is the design.

1. **Rides that do not fit before the park closes, in four tiers**, worst-first: an entry the
   visitor already had, then a headliner being added, then anything else, then which of them by
   `Candidate.dropWeight` (why the fourth tier exists, and the weight's sources, are in the rule).
   The tiers are disjoint (an existing headliner counts once, in the first) and packed into one
   comparable number rather than added as Pareto axes:
   `((entries × 32 + headliners) × 32 + total) × 1024 + weight`, with `MAX_STOPS` 24. Without a
   `priority` the weight is the ride's expected queue as a rank, longest first. Per entry:
   `rankHeadliners` matches the n-th occurrence of a slug to its n-th place in `priority`, a lap
   ranks behind every first ride, `peeled()` sets aside by index, `fitOrder` draws laps at the
   bottom of the assistant's list, and a pinned lap stays where it was pinned (`test:planner-fit`
   §11). `peeled()` never runs on a day that holds everything.
2. **What the day costs:** queued minutes plus `IDLE_WEIGHT` (0.5) × the standing-about the
   optimiser itself chose (a deliberate delay to let a queue fall, at most `MAX_DELAY_MIN`, 120). A
   free minute is worth something, and less than one in a queue. Two cases in
   `scripts/test-planner-optimize.mjs` pin the weight between 1/6 and 14/15 (§17: five queued
   minutes may not buy thirty idle; §11: seventy queued must outweigh seventy-five idle).
3. **The moment the last queue is left**, only as a tie-break: the plan that frees the evening wins.

A queue nobody joins costs nothing: the wait and idle in front of a stop that does not fit are out
of the totals. A walk costs `planCost` nothing and only moves the clock, so with one slot left the
shorter queue wins however far away it is.

**The schedule is contiguous, so the order is the only free variable.** A ride starts when the one
before lets go: its start, plus what the block occupies, plus the walk. The one exception is a
deliberate wait: idling `d` minutes and then queueing `w(t+d)` beats queueing `w(t)` now whenever
`d + w(t+d) < w(t)` — less queueing and free earlier, so it never makes the day longer.

**Rope drop is not a special case.** "The biggest ride first, at opening" is what minimising the sum
produces where the curve says so, and not where it does not (Taron's day is flat at 60/60/54/53/59
by hour while Chiapas climbs 22 minutes).

**Free blocks, ticked-off rides and slots already under way are fixed** (`ctx.fixed`); only undone
ride entries move.

## Why a heuristic

A beam of `BEAM_WIDTH` (192) prefixes with a small Pareto front per (visited set, last ride) —
two partial plans over the same rides ending on the same ride are comparable only where one is worse
at both queued minutes and the clock — then Or-opt and 2-opt until nothing improves. Exact
enumeration is out because the cost is time-dependent: what a ride costs depends on when the rides
before it finished, so the subproblems Held–Karp needs do not exist.

Measured rather than argued: on eight rides across four lands, scoring all 40,320 orders through
the scheduler takes 1.66 s and finds 172 queued minutes ending 16:05; the beam plus local search
reach the same in 8.2 ms. `test:planner-optimize` keeps that comparison at five and seven rides,
brute-forcing through `scoreOrder` (the scheduler), never through the search. Wall clock at real
sizes:

| Stops      | 10    | 14    | 18    | 24 (`MAX_STOPS`) |
| ---------- | ----- | ----- | ----- | ---------------- |
| Wall clock | 23 ms | 26 ms | 32 ms | 56 ms            |

Europa-Park, the largest catalogue asked about, has thirteen headliners.

## The fit assistant

Where a press would leave something out (`needsFitHelp`, one extra throw-away search, 5–50 ms),
both buttons open `PlannerFitAssistant` (`components/planner/planner-fit-assistant.tsx`,
`lib/planner/fit.ts`) instead of writing. What it must do — measured levers, `fitOrder`, ticks and
pins, the ADD relaxation, the state band, the two late-block warnings — is the rule
[a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).
The three steps share `PlannerStepRail` with the wizard:

1. **Stellschrauben** (`PlannerFitLevers`, from `fitLevers`). Skipped on a day with no free block.
2. **Wichtigkeit** (`PlannerFitList`): the list in `fitOrder` with a checkbox and a pin per row.
3. **Ergebnis**: how many rides, when the last queue is left, the queueing cost, and what is left
   out **by name**.

What the levers bought on the days they were measured:

| Park          | Day        | With the break | Lever                   | After |
| ------------- | ---------- | -------------- | ----------------------- | ----- |
| Phantasialand | 2026-09-12 | 9 of 10        | ohne Mittagessen        | 10/10 |
| Movie Park    | 2026-09-20 | 9 of 10        | Mittagessen auf 30 Min. | 10/10 |
| Phantasialand | 2026-10-03 | 8 of 10        | ohne Mittagessen        | 9/10  |
| Phantasialand | 2026-10-31 | 8 of 10        | Mittagessen auf 30 Min. | 9/10  |
| Phantasialand | 2026-11-01 | 9 of 10        | —                       | —     |

On 2026-11-01 the step says the blocks are not the problem. „Anpassen" under a result reopens the
assistant **on the kept input and answer** (re-running the press would find a day that now fits and
ask nothing); applying a revision keeps the undo pointing at the day before the first answer. The
wizard's headliner step renders the same levers and list inline ([wizard](wizard.md#the-steps)),
and the ride page's „In den Plan" opens the assistant with the requested ride pinned
(`noRoomForRide`, `lib/planner/add-ride-fit.ts`).

## What the foot shows

The panel runs the optimiser once before anybody presses, with the input `run` will use and the
same `scoreCurrent` before-figure. Where the answer beats the plan on screen by at least five
minutes, brings a ride back inside the day, or removes a clash (`clashCount`: neighbours starting
before the one before them is over and walked away from, judged like a `broken` leg), „Tag
optimieren" is filled with the primary colour, takes the rest of its row and says what the press is
worth („70 Min. weniger Warten", „ein Konflikt weniger"). The figure is on the five-minute grid, as
is the result line after the press, so promise and report cannot disagree. The search is memoised
on the grid's numbers, not the grid object, which the panel rebuilds every render. With nothing to
gain the button is tinted like the headliner button. On a phone the headliner button takes
`optimize.headlinersShort` and is `w-min`, so both labels wrap to two lines and the call to action
grows into the rest ([phone → every row is drawn at 32 px](phone.md#every-row-of-controls-is-drawn-at-32-px)).

## Refusals, commit and undo

The day is scored before and after by the same function, so „18 Min. weniger Warten" is a difference
between two figures produced the same way. Where a press adds rides no saving is printed.

- **No buttons where no order means anything**: `canOptimize` refuses a missing payload or axis and
  a park with no readable wait times (every ride costs the same assumed nothing there); „Tag
  optimieren" also needs two movable rides (`canSort`), and a past day renders neither control.
- **Pressing twice does nothing the second time**: `optimizeDay` returns `null` for a day it cannot
  improve, and the panel says so.
- **An entry the visitor placed that no longer fits is not dropped**: it goes where the sequence puts
  it, past closing; `growGridForSpans` widens the canvas and the minutes out there are hatched.
- **A ride the button adds is never filed out there**: it is left out, still counted in `overflow`
  (taken before the filter), so the sentence says how many. That is why „Alle Headliner" can stay
  after a press, with `optimize.overflow` under it (Phantasialand: ten headliners, nine hours).
- **A past day is not planned at all**: `buildContext` and `scoreCurrent` refuse `phase: 'past'`, and
  the two automatic controls are not rendered. Every hand control stays — a walked day is a record.
  Not a guard in the store, because a refusal behind a live-looking control is the failure this list
  avoids.

`applyPlan` commits the whole re-plan in **one** `plannerStore.update` (each update serializes the
whole multi-park plan to localStorage and notifies every subscriber). It moves and adds and never
removes. The undo beside the result is **one level**: `restoreDay` replaces the day rather than
merging, so an entry added since the snapshot goes; the snapshot lives in component state and dies
with the open panel.

## The clock: nothing is planned before now

`DayClock` (`lib/planner/park-time.ts`) is one value — `past` / `today + nowMinute` / `future` —
produced only by `dayClock(date, timeZone, now = Date.now())` and passed as `OptimizeInput.clock`.
Omitted means `future`, which reduces every rule below to its pre-clock form.

- **The floor:** on today the clock raises every candidate's **soft** floor (`rideFloor`), snapped up
  to the quarter hour; the hard floor stays, so a drag into the recorded morning remains legal.
- **An elapsed slot is not re-planned:** an entry whose slot has begun joins `ctx.fixed`, and the
  next ride waits for it. At 14:00 somebody stands in a 13:30–14:25 queue; moving that block tells
  them to leave and rejoin. The comparison is **strict** (`<`): the floor snaps up, so a press at
  14:00 files the next ride at 14:00, and with `<=` that ride counted as elapsed the instant it was
  planned and the whole bar unmounted with its undo.
- **Every surface that picks a minute uses the same floor**: the optimiser, a headliner pill, a
  ride-search row and the free-block button use `rideFloor(grid, ride, clock).softMin` or
  `nowFloor(grid, clock)`. Surfaces with no grid — the ride page's „In den Plan"
  (`AddToPlannerButton` never loads `/plan/day`), a panel whose payload has not arrived, the flat
  drop target — reach `addEntry`/`addCustomEntry` without a minute, so the fallback
  `nextFallbackStart` (`lib/planner/actions.ts`) carries the floor itself: `nowFloorMinute(date,
timezone, now)` snaps the current minute up to `SNAP_MIN_FINE` on today, as a `Math.max` that
  only raises; `past`/`future` return 0. An explicit `startMinute` still wins.
- **The floor is not capped at the end of the day**: past the last slot, a minute the day has no
  room for is the true answer. Late presses can stack blocks on the 25:00 ceiling
  (`MAX_DRAGGED_MINUTE`), drawn side by side, which reads as "these do not fit today".
- **One filter**: `movableEntries` (exported) is the predicate `buildContext`, `isExecutable`,
  `scoreCurrent` and the bar all use; every failure here was two copies disagreeing. `scoreCurrent`
  takes the clock as **membership**, never as a floor, since it scores the day where it stands.

## Checks

`pnpm test:planner-optimize`: the brute-force comparison, plus what a visitor would notice — the
lunch break stays put, a ticked ride is not re-planned, a ride opening at 11:00 is not queued for at
09:15, a collapse five hours out is not waited for, the same day gives the same plan twice; §12
headliners take the slots, §12b the floor, §12b2 the elapsed slot and the past day, §12c an added
ride that does not fit. The floor itself is in `pnpm test:planner-grid` §13b; the fit model in
`pnpm test:planner-fit`. `pnpm check:planner` asserts in a browser that after „Alle Headliner" on
Phantasialand no block starts past the gate and a second press adds nothing, that a past day offers
neither control while the free-block row stays, and — with `page.clock.setFixedTime` at 14:00
park-local — that a press leaves the 10:00 and 13:00 blocks where they were.
