# The leg chip

The chip between two planned blocks: how long the transfer takes, whether the gap holds it, and
where the chip is drawn. Code: `lib/planner/leg.ts` (`transferBetween`, `legBetween`),
`lib/planner/leg-chip.ts` (`legChipPlacement`), `components/planner/planner-leg.tsx`. Tests:
`pnpm test:planner-leg`, `pnpm test:planner-grid`.

## The day's walking

The foot's day total names the walking next to the wait (`dayWalkMinutes`, `lib/planner/leg.ts`):
the walk term of every transfer's ceiling (`Transfer.walkMinutes`, park pace with the detour
factor, `SAME_LAND_CEIL_MIN` / `CROSS_LAND_CEIL_MIN` without coordinates), paired in start order as
the grid pairs its legs, without leaving the station or the ride. It is the walking the plan
allows for, from the same `transferBetween` the chips read, so the total and the chips cannot
disagree. A free block with no place adds none.

## The verdict ladder

`legBetween` grades a gap on four rungs: `broken` when the gap is under the transfer's certifiable
**floor** (fast walk; zero walk where coordinates are missing, so a guess can never call a plan
impossible), `tight` when it clears the floor and not the assumed **ceiling** (park pace with the
detour factor), and `good` above that. So `knapp` means "the walk fits at a brisk pace and may not
at park pace". A forecast stops at `good`: `generous` is a claim about room the forecast's own error
might take back, so only a past day (`observed`), whose gap is a fact, reaches it, at
`GENEROUS_MIN_MINUTES` of slack.

**The model's spread is not read.** The ladder used to set the `tight`/`good` boundary at the
previous ride's `uncertaintyMinutes`, so `knapp` meant "this breaks if the forecast is as wrong as it
says it might be". That figure is the band around the day's peak (`/plan/day` takes it from the
day-level row), and since the backend widened it by a split-conformal factor (PAR-1060) it is wider
than most of the day's queues: a median of 29–44 minutes on measured days at Efteling, Disneyland
and Disneyland Paris against a day peak of 15–20 (2026-11-16), and 31–47 on composed ones. Composed
days carry it on every ride now, where they once carried it on almost none. Measured on 23 headliner
days (six parks, four dates), 177 of 177 legs read `tight`, a packed day and a loose one alike, so
the chip said nothing. The forecast's uncertainty is still drawn, as the band on each block.

**On a day the optimiser packed, every leg reads `good`.** The search reserves the same ceiling the
chip judges against and files the next stop on the first five-minute step after it
(`START_STEP_MIN`), so a packed leg clears the ceiling by under a step. `tight` and `broken` come
from a drag, or from a live wait that has grown since the press. `pnpm test:planner-leg` pins both
rungs at their boundaries and the packed leg.

## Placement in the drawn gap

The chip hangs in the space between one block's **drawn** box and the next, not between the end of
one queue and the start of the next: a block is drawn at least `minBlockPxFor` tall, so a short
queue's box hangs into the gap below it. Since the optimiser stopped reserving the band the blocks
stand close and the difference became the whole gap. Measured over 46 planned park-days, 267 legs
(2026-09-14):

| axis               | between the queues        | as drawn                          |
| ------------------ | ------------------------- | --------------------------------- |
| 1.2 px/min         | min 12, median 24, max 54 | min **12**, median **16**, max 48 |
| 1.8 px/min (phone) | min 18, median 36, max 81 | min 18, median 24, max 72         |

`legChipPlacement` takes the leg's height and the overhang and answers where the chip's top goes and
whether it is the short form. The gap comes from `drawnBoxPx` (`lib/planner/day-grid.ts`), the
function `planner-block.tsx` sizes its own box with, so the two cannot drift. Pure and away from
the component, like `weather-chart-axis.ts`, because it once broke in a way a green build did not
show.

- **Two heights are rendered, not typed:** `LEG_CHIP_PX` 21 and `LEG_CHIP_COMPACT_PX` 12, measured
  in the app's stylesheet at both scales in all six languages. A unit test cannot see a stylesheet,
  so `pnpm check:planner` reads the rendered chip and fails if it is neither — that keeps the
  constants true after somebody edits a padding class.
- **The short chip drops the distance and the slack**, keeping the minutes and the verdict; the
  distance stays in the `title`. Dropping the chip (the warning would vanish exactly on a tight day)
  and raising it over the blocks (covering a ride's name on nearly every leg) were both rejected.
- **Its outline is `ring-1 ring-inset`, not a border**, which is what makes it 12 px rather than 14:
  12 is the smallest gap a planned day produces (34 of the 267 legs; 14 px would still be cut on
  12.7 %). The colour is `current`, i.e. the verdict's own class from `TRANSFER_CHIP_CLASS`, so
  there is no second per-verdict map. Shrinking the type to 9 px was refused.
- **The wrapper is `flex`**: in a block wrapper the `inline-flex` chip sits on a baseline, and the
  leading above it (8 px for a 12 px chip) silently undid any computed position.
- A day somebody **dragged** can have overlapping blocks and a negative room; the chip is then
  centred. The repair button on a `broken` leg keeps 21 px: it is a target, not a label.

The measured corpus filtered out parks with no readable wait times, so its floor holds for days
that have figures.

## A ride takes five minutes

`RIDE_DURATION_MIN` (5, `lib/planner/day-grid.ts`) is one figure for every ride — an assumption,
decided by the owner on 2026-09-10 over a per-type table or curated values: `PlanDayRide` carries no
duration, and the curated `durationSeconds` covered 22 of 173 rides in three sampled parks (median
117 s). `transferBetween` accepts a `rideSeconds` override, and no caller passes one.

It is spent in two places and drawn in none: inside the transfer, so the search's clock, the chip's
verdict and `fits = start < closeMin` read the same minutes; and once more after the last stop
(`endMinute` in the optimizer's scores and its search). A block's height stays the queue, and the chip's
title already calls the transfer estimated (`transfer.allowance`). A day that fitted by under two
minutes per leg can stop fitting, and the fit assistant names it like any other cause.
