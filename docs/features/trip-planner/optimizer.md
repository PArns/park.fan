# The optimizer

The day can sort itself. Two buttons under the axis (`PlannerOptimizeActions`): „Alle Headliner
einplanen" adds the park's headliners and orders the result, „Tag optimieren" only re-orders what is
there. Both ask the API's optimizer and differ in one field; they are two controls because "fill my
day" and "is this the best order" are different questions. Open this when changing what the
buttons, the fit assistant or Parky ask, what they draw while waiting, or what they write.

**The search runs in the API**, `POST /v1/parks/…/plan/optimize` behind the data key
([contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/optimize.md)),
so the site and Parky share one implementation and the browser never searches a forecast itself.
The browser sends the day as the planner stores it and gets the plan back; the API plans against
its own `/plan/day` for that date. Code here: `lib/planner/optimize-remote.ts` (the request and the
answer's types), `lib/planner/use-optimize-remote.ts` (the preview and the fit assistant's answers,
through React Query), and the relay branch `POST` in `app/api/parks/[...path]/route.ts`, which adds
the server key and answers only this site's pages
([a forecast leaves only with a key](../../rules/a-forecast-leaves-only-with-a-key.md)).

Two standing rules govern it and are not repeated here:
[the planner's day ends when the park closes, and a headliner is not a residual](../../rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md)
and [a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).

## What it minimises

The engine is the one this repo used to run in the browser, moved to the API unchanged
(`src/planner/day-optimizer/` there). Three things in a fixed order; the order is the design.

1. **Rides that do not fit before the park closes, in four tiers**, worst-first: an entry the
   visitor already had, then a headliner being added, then anything else, then which of them by the
   ride's drop weight (why the fourth tier exists is in the rule). The tiers are packed into one
   comparable number rather than added as Pareto axes. Without a `priority` the weight is the
   ride's expected queue as a rank, longest first; a lap ranks behind every first ride, and the
   fit assistant's list draws laps at the bottom (`fitOrder`).
2. **What the day costs:** queued minutes plus 0.5 × the standing-about the optimiser itself chose
   (a deliberate delay to let a queue fall, at most 120 minutes). A free minute is worth something,
   and less than one in a queue.
3. **The moment the last queue is left**, only as a tie-break: the plan that frees the evening wins.

A queue nobody joins costs nothing: the wait and idle in front of a stop that does not fit are out
of the totals. A walk only moves the clock, so with one slot left the shorter queue wins however
far away it is.

**The schedule is contiguous, so the order is the only free variable.** A ride starts when the one
before lets go: its start, plus what the block occupies, plus the walk. The one exception is a
deliberate wait: idling `d` minutes and then queueing `w(t+d)` beats queueing `w(t)` now whenever
`d + w(t+d) < w(t)`.

**Rope drop is not a special case.** "The biggest ride first, at opening" is what minimising the sum
produces where the curve says so, and not where it does not (Taron's day is flat at 60/60/54/53/59
by hour while Chiapas climbs 22 minutes).

**Free blocks, shows, ticked-off rides and slots already under way are fixed**; only undone ride
entries move.

## Why a heuristic

A beam of 192 prefixes with a small Pareto front per (visited set, last ride), then Or-opt, exchange
and 2-opt until nothing improves; at most 24 stops per search. Exact enumeration is out because the
cost is time-dependent: what a ride costs depends on when the rides before it finished, so the
subproblems Held–Karp needs do not exist. On eight rides, scoring all 40,320 orders takes seconds
and finds the same plan the beam finds in milliseconds; the API keeps that comparison in its specs.
A full day of 24 stops is about a tenth of a second there, a fit answer with levers several of
those, which is why the API runs the search in worker threads.

## Waiting for the API

A press is a request, so every surface that asks has a state for the wait and one for a failure:

- **The buttons** are disabled while a press is out; the pressed one spins, and „Tag optimieren"
  reads `optimize.running`. The plan is written only from an answer about the day as it still
  stands: an answer for a day edited meanwhile is dropped.
- **A failure** (an error status, a 503 from a busy optimizer, no network) draws
  `PlannerOptimizeFailure`: the plan is unchanged, and a retry runs the same press again.
- **The fit assistant** keeps the previous answer on screen while the next choice is asked
  (`keepPreviousData`), dims the count band, and holds „Plan übernehmen" until the answer to the
  choice on screen has arrived. A failure draws the same line with a retry.
- **Parky's** „optimise my day" goes through the same path: `plannerUi.requestOptimize` makes the
  open panel press its own button, so the wait, the failure line and the undo are the same.

## The fit assistant

Where a press would leave something out, the API answers `needs-fit` instead of a plan, with the
assistant's opening answer (everything ticked, levers measured), and both buttons open
`PlannerFitAssistant` (`components/planner/planner-fit-assistant.tsx`) instead of writing. What it
must do — measured levers, `fitOrder`, ticks and pins, the ADD relaxation, the state band, the two
late-block warnings — is the rule
[a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).
Every tap asks the API again (`useFitAnswer`, mode `fit`, the choice as lists); the order of the
list and the toggles stay in `lib/planner/fit.ts`, so a pin moves its row on the tap. The three
steps share `PlannerStepRail` with the wizard:

1. **Stellschrauben** (`PlannerFitLevers`, from the answer's `levers`). Skipped on a day with no
   free block.
2. **Wichtigkeit** (`PlannerFitList`): the list in `fitOrder` with a checkbox and a pin per row. The
   photos and peaks come from the panel's own `/plan/day` (`wishesWithRides`).
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
assistant **on the kept question and answer** (re-running the press would find a day that now fits
and ask nothing); applying a revision keeps the undo pointing at the day before the first answer. A
question holds the day as it stood and the park-local minute it was asked at, so every answer in one
dialog is about the same morning. The wizard's headliner step asks the same question inline
([wizard](wizard.md#the-steps)), and the ride page's „In den Plan" opens the assistant with the
requested ride pinned (`noRoomForRide`, `lib/planner/add-ride-fit.ts`).

## What the foot shows

The panel asks the API before anybody presses (`useOptimizePreview`: mode `day` with `preview`,
which skips the fit question), with the entries `attempt` will send. Where the answer beats the plan
on screen by at least five minutes, brings a ride back inside the day, or removes a clash
(neighbours starting before the one before them is over and walked away from, judged like a
`broken` leg), „Tag optimieren" is filled with the primary colour, takes the rest of its row and says
what the press is worth („70 Min. weniger Warten", „ein Konflikt weniger"). The figure is on the
five-minute grid, as is the result line after the press, so promise and report cannot disagree.

The preview is keyed on what the answer depends on: the entries (`optimizeKeyOf`, which leaves a
block's label out, so typing one asks nothing), the early-entry answer, and on today the quarter
hour the plan starts from plus which entries the clock has reached. So an edit asks once, and an
open panel on today's date asks at most once a quarter hour, not once a minute. With nothing to
gain, or while the answer is out, the button is tinted like the headliner button. On a phone the
headliner button takes `optimize.headlinersShort` and is `w-min`, so both labels wrap to two lines
and the call to action grows into the rest
([phone → every row is drawn at 32 px](phone.md#every-row-of-controls-is-drawn-at-32-px)).

## Refusals, commit and undo

The API scores the day before and after by the same function (`before`, `after`), so „18 Min.
weniger Warten" is a difference between two figures produced the same way. Where a press adds rides
no saving is printed.

- **No buttons where no order means anything**: `canOptimize` (`lib/planner/optimize.ts`) refuses a
  missing payload or axis and a park with no readable wait times; „Tag optimieren" also needs two
  movable rides (`movableEntries`), and a past day renders neither control. These gates stay in the
  browser because the buttons are drawn before anybody presses; the API applies the same rules and
  answers `refused` where a request slips past them.
- **Pressing twice does nothing the second time**: the API answers `unchanged` for a day it cannot
  improve, and the panel says `optimize.already`.
- **An entry the visitor placed that no longer fits is not dropped**: it goes where the sequence puts
  it, past closing; `growGridForSpans` widens the canvas and the minutes out there are hatched.
- **A ride the button adds is never filed out there**: it is left out, still counted in `overflow`,
  so the sentence says how many. That is why „Alle Headliner" can stay after a press, with
  `optimize.overflow` under it (Phantasialand: ten headliners, nine hours).
- **A past day is not planned at all**: the API refuses it, and the two automatic controls are not
  rendered. Every hand control stays — a walked day is a record.

`applyPlan` commits the answer's `stops` in **one** `plannerStore.update` and mints the ids of added
rides. It moves and adds and never removes. The undo beside the result is **one level**:
`restoreDay` replaces the day rather than merging, so an entry added since the snapshot goes; the
snapshot lives in component state and dies with the open panel.

## The clock: nothing is planned before now

Past, today or future is the API's call, from the park's timezone. On today's date the request
carries the park-local minute (`nowMinute`, from `dayClock` in `lib/planner/park-time.ts`), so the
plan starts where the visitor's now line is; without it the API reads its own.

- **The floor:** on today the clock raises every ride's **soft** floor, snapped up to the quarter
  hour; the hard floor stays, so a drag into the recorded morning remains legal.
- **An elapsed slot is not re-planned:** an entry whose slot has begun is fixed, and the next ride
  waits for it. The comparison is **strict** (`<`): the floor snaps up, so a press at 14:00 files the
  next ride at 14:00, and with `<=` that ride would count as elapsed the instant it was planned.
- **Every surface that picks a minute uses the same floor**: a headliner pill, a ride-search row
  and the free-block button use `rideFloor(grid, ride, clock).softMin` or `nowFloor(grid, clock)`,
  the rules the API applies to the search. Surfaces with no grid reach `addEntry`/`addCustomEntry`
  without a minute, and `nextFallbackStart` (`lib/planner/actions.ts`) carries the floor itself.
- **The floor is not capped at the end of the day**: past the last slot, a minute the day has no
  room for is the true answer.
- **The wizard plans against the clock too**: its headliner step used to plan today's date as if it
  were still morning; the API applies the clock to every request.

## Checks

The engine's own checks are in the API: `optimize.vectors.spec.ts` and `fit.vectors.spec.ts` (the
vectors this repo's `test:planner-optimize` and `test:planner-fit` held, unchanged), and
`browser-parity.spec.ts`, which replays answers recorded from the browser engine before it was
removed. Here, `pnpm test:planner-optimize` pins the gates and the request (what is sent, the
minute on today, the errors), `pnpm test:planner-fit` the list order, the toggles and the
„In den Plan" question, `pnpm test:forecast-relay` that the relay counts as a forecast path.
`pnpm check:planner` drives the buttons in a browser against a build; it needs an API that serves
`…/plan/optimize`.
