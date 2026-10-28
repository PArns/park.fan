# The day grid

The timeline one day is laid out on: `buildDayGrid` and its helpers in `lib/planner/day-grid.ts`,
drawn by `components/planner/planner-day-grid.tsx`, `planner-grid-ground.tsx` and
`planner-block.tsx`. Open this when changing the axis, where a block may start, how blocks share a
column or what a block draws. Pixel scales for phones are in
[phone → the axis has a phone scale](phone.md#the-axis-has-a-phone-scale); the chip between blocks
is in [leg chip](leg-chip.md).

## The axis is the park's day, the canvas grows to the plan

`buildDayGrid` answers a question about the **park**: when it opens, when it shuts, plus
`PRE_PAD_MIN` (30) either side for the arrival and for a queue joined near closing. A plan is not
bound by that — `clampStart` lets a block start up to fifteen minutes before closing, so a 60-minute
free block written at 18:30 ran off a canvas ending 30 minutes past close. `growGridForSpans`
widens the canvas until it holds the plan:

- **`openMin` and `closeMin` never move.** The opening-hours band and every placement rule
  (`clampStart`, `rideFloor`) read them, so the extra room is outside opening hours by construction
  and is hatched like every other closed minute.
- **Only the extension is rounded**, out to the full hour; the base canvas keeps its half-hour pad.
- **It is fed from the committed entries, never a drag in flight**: `yFor` measures from
  `gridStartMin`, so a canvas that grew mid-gesture would move every other block under the pointer.

Heights come from durations only (`heightFor` takes no start position), so a block's height cannot
depend on where it sits.

## Opening and closing edges

**Closing** — `closeMin`, the drawn and draggable `closeSlackMin` (`CLOSE_SLACK_MIN`, 60) above it,
and `fits = start < closeMin` — is a standing rule:
[the planner's day ends when the park closes](../../rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md).
The two warnings a ride block filed past the close carries are in
[a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).
`CLOSE_SLACK_MIN` goes to zero once the backend sends a real closing minute. A day that closes
after midnight is unfolded onto one axis by `unfoldedCloseHour`: [past midnight](past-midnight.md).

**Opening** has the same hard/soft split in `rideFloor(grid, ride, clock)`: the hard floor is the
earliest legal minute (a drag may go there), the soft floor adds the gate walk, a ride's own later
`opensAt`, and — on today — the current minute snapped up to the quarter hour
([optimizer → the clock](optimizer.md#the-clock-nothing-is-planned-before-now)).

### Early entry

`DayGrid.earlyEntryOpenMin` is the minute the early-entry rides open, below `openMin`, and `null`
on every other day. `earlyEntryOpenMin(context)` requires all three: the park offers it
(`hasEarlyEntry`), says how early (`earlyEntryMinutesPeak`), and the visitor holds it on this day
(`context.earlyEntry`, set from their own answer through `withEarlyEntry()`; the API never sends
it). A park flag alone moves nobody's morning — a day-ticket holder queues at the turnstile.

`opensEarly()` picks the rides: the park's headliners, minus any whose own `opensAt` is after the
park's opening. For those, `rideFloor` takes the early minute as the hard floor and adds the gate
walk on the soft one; every other ride keeps `openMin`. The axis starts `PRE_PAD_MIN` before the
early opening, and `PlannerGridGround` draws the early window above the band at half its tint with
the same dashed edge. A block in that window carries `ASSUMED_WAIT_MIN` with
`missing: 'early-entry'` (the API has no hour before the gates), read through `isAssumedWait()`: no
crowd tint, a `~` in front. Without the visitor's answer the grid and the optimiser's plan are
identical to before (`test:planner-grid`, `test:planner-optimize`, `test:planner-fit`).

## Lanes

`packLanes` lays overlapping blocks side by side, capped at `MAX_LANES` (3): three 112 px columns is
the floor at which a name and a figure still fit on a phone. Blocks beyond the cap ride in the last
column and overlap, so the topmost block carries a `+N` badge from `LanePlacement.overflow`
(`entry.laneOverflow`). A fourth column is not the answer.

## What a block draws

- **Every ride block carries its photo**, at any height, at `opacity-[0.2]` (`PHOTO_OPACITY`). A
  height floor (48 px, then 28) meant a plan of 20–35 minute blocks showed photos only on a
  headliner's worst hour; 0.20 rather than 0.30 because on every block the photo is the column's
  texture, not an accent. The name and the wait are `text-crowd-*` and keep their drop shadow at
  every height.
- **The lower edge says how solid the figure is**: hard on a measured hour, fading 10 px on a
  composed one and 22 px otherwise ([wait figures → where a figure came from](wait-figures.md#where-a-figure-came-from)).
- **The headliner band** shows each missing headliner with a `PlannerRideThumb` (the coaster mark
  where the media database has no photo, the box the same size either way), not as a word in a pill
  that reads as a filter chip. The decoded thumbnail also gives the drag chip pixels to copy.
- **A block with no figure** draws at `NO_FIGURE_PX` (40 px at 1.2 px/min, scaled per axis by
  `noFigurePxFor`), and lane packing counts the same span (`packedSpanMinutes` → `NO_FIGURE_MIN`),
  so the drawn box and the packed one agree. Every other block is at least `minBlockPxFor` tall.
  `drawnBoxPx` is the one answer for both cases ([leg chip](leg-chip.md#placement-in-the-drawn-gap)).
