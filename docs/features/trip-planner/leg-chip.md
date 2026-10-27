# The leg chip

The chip between two planned blocks: how long the transfer takes, whether the gap holds it, and
where the chip is drawn. Code: `lib/planner/leg.ts` (`transferBetween`, `legBetween`),
`lib/planner/leg-chip.ts` (`legChipPlacement`), `components/planner/planner-leg.tsx`. Tests:
`pnpm test:planner-leg`, `pnpm test:planner-grid`.

## The verdict ladder

`legBetween` grades a gap on four rungs: `broken` when the gap is under the transfer's certifiable
**floor** (fast walk; zero walk where coordinates are missing, so a guess can never call a plan
impossible), then `tight` / `good` / `generous` by the slack over the assumed **ceiling**, with the
boundary set by the previous ride's `uncertaintyMinutes`: `tight` below one spread, `good` below
`max(2 × spread, GENEROUS_MIN_MINUTES)`, `generous` above. So `knapp` means "this breaks if the
forecast is as wrong as it says it might be". No spread reported is not a spread of zero: the
ladder then caps at `good` (with `°`, `missing: 'no-spread'`). A past day (`observed`) runs the full
ladder against a spread of zero, since its gap is a fact.

**On a day the optimiser packed, the ladder reports the packing.** The search reserves the ceiling
too, so a packed day's slack is mostly the remainder on `SNAP_MIN_FINE`. Measured over 169 planned
days (14 parks × 14 dates, 1369 legs, 2026-09-13): slack median 6 min (p25 2, p75 10, max 26)
against a band of median 15 — measured on the raw CatBoost band, before the backend widened
`uncertaintyMinutes` by a split-conformal factor (PAR-1060), so not re-measured since. With the
search reserving the wait (PAR-169), 144 of 162 band-carrying legs (88.9 %) read `tight`, 18 `good`,
none `generous` (reserving wait + band, it was 0 / 91.7 % / 8.3 %).

Whether a leg has a band at all is mostly a property of the **date**: `tier: measured` (today,
tomorrow) carries `uncertaintyMinutes` on every ride, `composed` almost never (13 of 2846 rides at
lead 2–45), so the same packed day reads amber for tomorrow and green for the day after. A block
within `LIVE_WINDOW_MIN` of now is re-based on the live wait and passed with no spread, and
`estimateFor` reports none for a free block, an assumed wait or a park with no readable source —
all of those cap at `good`.

**The threshold stays at the whole band.** Lowering it only moves the rung a packed day collapses
onto (¼ band: 4.7 % tight, 92.1 % good) while costing the days where the rungs separate: headliners
at a 60-minute cadence read 42.1 % tight / 27.6 % good / 22.8 % generous (8.5 % of all legs
`broken`), at 90 minutes 2.9 / 23.5 / 71.6. Full tables in PAR-174. `pnpm test:planner-leg` pins the
three points that tell thresholds apart: the snap remainder against a real band is `tight`, four
fifths of a band is still `tight`, a whole band is `good` (four fifths, because 11 of 15 reads
`tight` under the whole band and a ¾ threshold alike).

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
(`endMinute` in `scoreCurrent` and the search). A block's height stays the queue, and the chip's
title already calls the transfer estimated (`transfer.allowance`). A day that fitted by under two
minutes per leg can stop fitting, and the fit assistant names it like any other cause.
