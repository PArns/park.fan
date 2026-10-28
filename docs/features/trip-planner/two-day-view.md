# Two-day view

A wide planner panel draws two day columns side by side — "and what if we went Saturday instead" —
instead of one column beside empty hour rules. Open this when touching the column switch, the
per-column chrome or `lib/planner/second-column.ts`.

## Why two, and the thresholds

At the default 448 px panel one column gets **395 px** of canvas (block area right of the hour
gutter); at `PANEL_WIDTH_MAX` (900) each of two columns gets **397**, so two columns are two whole
planners. A third would have to share the hour gutter, which carries the weather rail, the
showtime chips and the now pill — all per (park, date) — and would cost the extra park its weather
and shows.

- `TWO_COLUMN_MIN_WIDTH = PANEL_WIDTH_MIN * 2 + 1` (681): below it the second column is **not
  drawn but remembered**, so widening the panel brings the same day back.
- The switch is offered on the **window**, not the panel: `TWO_COLUMN_MIN_VIEWPORT` = 681 +
  `PAGE_MIN_PX` = 1041, read through `useMediaQuery`. Asking the panel's width meant the 448 px
  every visitor starts on had no switch at all. The press widens the panel through the same
  `plannerPanelWidth.commit` the edge drag uses; at 1040 the switch is absent because
  `fitToViewport` caps the panel at `innerWidth - PAGE_MIN_PX` and would take the width back.
- The press only ever raises the width, and only to the floor; closing the second column leaves the
  width alone. Pressed at a narrow panel with a day remembered, it brings **that** day back.
- `isPhone` excludes a phone on its own account (the sheet is the screen's width), even though
  639 px cannot also be 1041 today.
- The second column opens on the **day after** the active one, same park.

## Which chrome moved into the column

The header cannot say which of two days it means, so the park chooser and the day picker sit on
the column (`PlannerColumnHead`), and the rest of a day's chrome lives in `PlannerDayColumn`: the
context band, the party chips, the showtime strip, the axis and the action row a selected block
docks into. What follows the **primary** column stays panel-level — the headliner band, the
free-block row, the totals — because a plan has exactly one active day.

Per column, because shared they would be bugs:

- **The selection.** Entry ids are unique only within one (park, date) — `makeId` counts collisions
  among that day's entries — so `taron-1` legitimately exists in a Saturday and a Sunday column of
  the same park. The Delete-key effect moved with it and is inert in a column with nothing selected,
  so one listener is ever bound.
- **The queries.** Each column runs its own `/plan/day` and live poll, keyed by (park, date). Two
  columns of one park share the park-level queries (the best-days snapshot has no date in its key;
  the live poll is gated on `isToday`).

## Where it is stored

`lib/planner/second-column.ts`, an external store over localStorage (`parkfan_planner_column2`),
**outside** `PlannerState`: `syncTrip` uploads that state whole, and an open column is a property of
this browser, not of the day. Stored at all because the panel unmounts every time it closes.
