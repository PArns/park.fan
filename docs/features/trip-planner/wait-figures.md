# Wait figures

Where the number on a planned ride comes from and how much it is worth. Every planner reader of a
ride's curve goes through `lib/planner/ride-series.ts` and `estimateFor` (`lib/planner/estimate.ts`),
so the block, the ghost under a drag, the totals and the optimiser agree on one figure. The fields
themselves are defined by the
[API's `/plan/day` docs](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/README.md) (tiers, slots, accuracy, availability);
this page is how the frontend reads them.

## A figure belongs to its quarter hour

Where `/plan/day` sends `rides[].slots[]` (the backend's H5 composer, behind
`PLAN_DAY_H5_COMPOSER`), there is one wait per quarter hour in whole minutes, with `minute`
unfolded past midnight like `hour`. Without slots every function below returns what the hourly
series gives.

- `rideWaitAt(ride, minute)` answers the slot whose `minute` is the block's quarter hour. It falls
  back to `hours[]` **only for an hour with no slot at all**: an hour with some slots is partly
  outside the ride's window (a 10:30 opening has no 10:00), and its hourly figure would invent the
  missing quarters. Never interpolated; `source` comes from the slot.
- The window tests (`outside-hours`, early entry) stay per hour, because the API's window is.
- The optimiser's tables are per quarter hour (`waitBySlot`, `occupiedBySlot`), the width of
  `SNAP_MIN_FINE`, so a dip at 09:45 inside a flat hour can be planned into.
- `rideFloor` reads the first slot's minute (`rideFirstMinute`): a ride first measured at 11:15 is
  filed at 11:15.
- „Was jetzt?" (`suggestNextRides`, `lib/planner/next-best-ride.ts`) looks ahead per quarter hour.

**Round what is printed, never what is summed.** `PlannerEstimate.wait` is raw; the block, the
entry row and the action bar print it through `roundWaitTo5`, the total on the five grid. Height,
crowd tint and sums read raw minutes. A day carrying slots draws quarter-hour ticks on the gutter
(`data-planner-quarter-tick`, :30 longer); an hourly day draws none, since the ticks would promise a
resolution its blocks do not have. `dayPeak` is the day-level P90-like forecast and sits above the
drawn curve's maximum, so the wish list labels it „Tagesspitze".

## Where a figure came from

- **`tier`** names the day's regime and decides the block's lower edge: hard on a measurement,
  fading 10 px on `composed` and 22 px otherwise. **`hours[].source`** names hours that depart from
  it — 50 of Phantasialand's 254 hourly points on 2026-09-04 were `composed` under a `measured` day,
  because the model's 24-hour window does not span the whole operating day. So the edge reads
  `PlannerEstimate.tier`: the hour's own source where it names one, the day's otherwise (absent
  means "the day's tier", never "unknown"). The ghost under a drag reads it too.
- **`accuracy.basis`** says whether anybody measured how wrong the forecast is at this lead time;
  the band reads it rather than waiting for a `long_range` tier the API in practice no longer sends
  (a day three months out is `composed` with `basis: 'unmeasured'`). **Trap:** a past day also
  answers `unmeasured` — nothing predicted it — while its figures are measurements, so
  `tier === 'observed'` wins.
- **`accuracy.typicalError`** is a typical error, not a bound, so it is worded „typisch 9 Min.
  daneben" and never as a `±` interval (the same rule `expectedError` follows per ride). It is folded
  into the tier's own sentence: a separate span grew the band 60 → 75.5 px on a 390 px phone the
  moment the payload landed. `accuracy.sampleSize` is unread: it describes the method, not the day.
- **`context.hoursSource: 'observed'`** — hours derived from recorded days past a park's publication
  horizon, narrower than the truth by construction — adds „(gemessen)" to the hours chip with a
  title saying the day may be longer; a suffix, not a badge (a badge grew the chip row 92 → 120 px).
- **`tier: 'climatology'`** is a look back at comparable days in earlier years:
  `climatologyNote` (`lib/planner/climatology.ts`) names the holiday situation and how many
  reference days stand behind it, and no forecast error is drawn for it.
- **A day with no ride curves** says why: `unavailableNote` (`lib/planner/unavailable.ts`) maps
  `ridesUnavailable.reason` to a `planner.unavailable.*` sentence; `no_wait_time_source` takes its
  wording from the park's own `noLiveWaitTimesReason`, so the planner and the park page agree.

`pnpm test:planner-estimate` pins the hour-versus-day rule; `check:planner` asserts the band against
stubbed payloads (a park past its publication horizon, a date three months out).

## Uncertainty and live figures

The block's spread is drawn as a tail below it (`bandGeometry`, `lib/planner/block-band.ts`), in its
own layer under every block and leg because it hangs into the next gap; none for a free block, a
ticked or live one, a block with no figure or a model that reported no spread. A block within
`LIVE_WINDOW_MIN` (45) of now is re-based on the live wait (`lib/planner/live.ts`) and passed on with
`uncertaintyMinutes: null`: a queue read off the park's board carries no forecast error.

## A park nobody measures

`estimateFor` answers a ride it cannot find with `ASSUMED_WAIT_MIN` (5) and `missing: 'assumed'`,
right for a ride with no history in a measured park. A park with **no source** (Hansa-Park publishes
waits only in its own app on the park WLAN) looks byte-for-byte the same on `/plan/day`
(`rides: []`, a drawn axis), so the difference comes from the curated flag `context.liveWaitTimes`,
read through `hasReadableWaitTimes()`, which treats an absent field as available (this app deploys
independently of the API). There the estimate is `missing: 'no-source'` with no figure, and the
block says so; see [parks we cannot read](../../rules/parks-we-cannot-read.md).
`pnpm test:planner-estimate` pins both directions.
