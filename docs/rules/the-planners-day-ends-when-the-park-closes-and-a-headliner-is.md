# The planner's day ends when the park closes, and a headliner is not a residual (REQUIREMENT)

**The day ends at closing time.** `PlanDayContext.closeHour` is the hour the closing time falls in,
never the last open hour: Phantasialand shuts at 18:00 and the API answers `18`. So `DayGrid`
(`lib/planner/day-grid.ts`) carries two numbers: `closeMin`, the certifiable end that nothing the app
files by itself may start past, and `closeSlackMin` (`CLOSE_SLACK_MIN`, 60), the hour above it that is drawn (the
hatched feather below the band) and reachable by a drag, but never planned into. It is the same
hard/soft split `rideFloor` makes at the other end of the day.

- **The rule runs on the start, never the end**: `fits = start < closeMin`. A queue may be joined
  right up to closing; what happens after that is the park emptying a line it already let you into.
- **A queue nobody joins costs nothing**: the wait and the idle in front of a stop that does not fit
  are out of the totals.
- **`nowFloor` is not capped at the end of the day**, because the cap beat the lower bound it exists
  to impose.

**Which headliner falls out is decided, not left over.** A fourth overflow tier,
`Candidate.dropWeight` (ranks, not minutes, in `lib/planner/optimize.ts`), decides it:
`OptimizeInput.priority`, the visitor's own order, beats everything, and the day's expected queues
rank the rest. The weight is **per entry, never per slug**, so a second go on a ride is given up
before any first ride. The beam cannot decide this alone (overflow appears only on the last stop, so
every prefix scores zero overflow and is pruned on cost), so `peeled()` sets the least important
aside, re-runs, and scores the result in the original context. Where it is still tight the app asks:
[a day that does not fit opens an assistant](a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).

`MAX_STOPS` (24) has three things pinned to it: the visited bitmask, the search's map key and
`OVERFLOW_STRIDE`.

## Why

`buildDayGrid` once read `closeHour` as the last open hour and added sixty minutes, so a nine-hour
day was planned against a ten-hour one and the optimiser filled the difference: Winja's Fear queued
at 18:15, the day finishing 18:55. Over the catalogue's calendars, 3,046 of 3,540 operating
park-days close exactly on the hour (86.0 %), so the hour is the closing minute six days in seven,
and the slack hour covers the seventh. `freeAt <= closeMin` had refused a forty-minute queue at
17:45, one of the best slots of the day. The capped `nowFloor` answered 17:45 at 17:58, and "alle
Headliner" filed a queue thirteen minutes before the press.

Three overflow tiers counted how many rides fall out and never which, so cost decided among equal
counts, and cost minimisation drops the longest queue, the ride most people came for. On 2026-09-12
the button gave up F.L.Y. and Taron and kept both Winja's, over a five-minute margin against a model
error of 14.3 minutes. Keyed on the slug, the assistant kept Chiapas three times and struck Winja's
Fear and Raik.

## Check

`pnpm test:planner-fit` pins the model. Background:
[trip planner → the optimizer](../features/trip-planner/optimizer.md).
