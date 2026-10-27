# Parks that close after midnight (planner)

How the trip planner handles a `/plan/day` day that crosses midnight
(`closeHour < openHour`): the one function every window goes through, the three call
sites that had to learn it, and the grep that finds a fourth. Open it before writing
anything that turns `openHour`/`closeHour` into minutes. The API side — `hours[].hour`
and `slots[].minute` run past 23/1439 while `context.closeHour` stays the wall-clock
hour — is the backend's
[midnight contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/midnight.md).

## One rule, one function

`unfoldedCloseHour(openHour, closeHour)` (`lib/planner/day-grid.ts`) returns
`closeHour + 24` for a wrap day and `closeHour` otherwise, inclusive like the field it
reads. Every window in the planner goes through it:

| Site                           | Reads it for                                                            |
| ------------------------------ | ----------------------------------------------------------------------- |
| `buildDayGrid` (`day-grid.ts`) | the axis — minute 1560 for a `10 → 1` day                               |
| `estimateFor` (`estimate.ts`)  | the out-of-hours test, `hour > unfoldedCloseHour(…)`                    |
| `showDayHours` (`shows.ts`)    | the window projected showtimes are clipped to                           |
| `next-best-ride.ts`            | the look-ahead's close, with `now` and the series unfolded the same way |

The defect this prevents: `estimateFor` once tested `hour > closeHour`, which for
`openHour: 16, closeHour: 1` is true of **every** hour — every ride returned
`wait: null`, the day's total was 0, every evening block read "außerhalb der
Öffnungszeiten", and the optimiser ordered rides by walking distance while believing
it minimised queues. The showtime clip built `{ closeHour * 60 }` the same way
(`660 → 60` for `11 → 1`) and silently dropped a wrap park's whole projected programme.

**Before adding a fifth site, grep for `closeHour \* 60` and `> closeHour`.** The wrong
expression reads exactly like the right one, and the parks it is wrong for are a
handful of 212 (La Ronde, Six Flags Mexico and Six Flags Qiddiya City every day, many
more on Halloween). A label that only prints the pair (`planner-wizard.tsx`) is fine.

`estimateFor` looks a ride's curve up **once**, at the axis hour: the API sends the
unfolded hour (24 = midnight, 25 = 01:00), measured 2026-09-14 and 2026-10-02, so the
wall-clock fallback lookup was removed (PAR-193). A normal day is inclusive too
(Disneyland Park `8 → 23` returns hours 8…23).

## Tests

`pnpm test:planner-estimate` (`scripts/test-planner-estimate.mjs`) goes red if the
estimator stops unfolding or the wall-clock lookup comes back; with the fix reverted,
ten wrap-day assertions fail while every normal-day line stays green.
`pnpm test:planner-grid` pins `unfoldedCloseHour` itself, `pnpm test:planner-shows` the
showtime window.

To reproduce against the API:

```
curl -s 'https://api.park.fan/v1/parks/north-america/canada/montreal/la-ronde/plan/day?date=2026-10-31' \
  | jq '{ctx: .context | {openHour, closeHour}, hours: [.rides[0].hours[].hour]}'
```

## Related

- [Showtimes in the planner](../features/trip-planner/showtimes.md) — the clip window on a wrap day
- [Parks without wait times](parks-without-wait-times.md) — the other case where an empty answer means something specific
