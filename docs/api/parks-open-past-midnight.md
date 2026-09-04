# Parks that close after midnight

A park whose day runs past midnight reports `closeHour < openHour` — La Ronde is
`10 → 0`, Six Flags Magic Mountain on Halloween is `10 → 1`. Two things in this
codebase used to disagree about what that means, and the API still does.

## The frontend half (fixed)

`buildDayGrid` (`lib/planner/day-grid.ts`) has always unfolded the wrap: the axis
runs to minute 1560 for a `10 → 1` day. `estimateFor`
(`lib/planner/estimate.ts`) did not — it tested

```ts
if (hour < openHour || hour > closeHour) return { missing: 'outside-hours', … };
```

and for `openHour: 16, closeHour: 1` that is true for **every** hour of the
clock. So every ride returned `wait: null`, every block drew no figure, the day's
total was 0, and every evening block carried "außerhalb der Öffnungszeiten" while
sitting in the middle of the opening hours. The planner's optimiser, which reads
the same estimator, was left ordering rides by walking distance alone while
believing it was minimising queues.

The rule lived in two places and that was the defect. `unfoldedCloseHour` is
exported from `day-grid.ts` now; `buildDayGrid` reads it where the old inline
expression sat and `estimateFor` reads it in place of the hour test. Inclusive,
like the field it reads.

`estimateFor` looks a ride's curve up **twice**: first at the axis hour, then at
the wall-clock hour, and the second lookup is restricted to `hour >= 24`. That is
not belt and braces, it is an admission — see below. It can never be ambiguous:
for a wrap park `[0…closeHour]` and `[openHour…23]` are disjoint, and for a
normal park the second lookup is unreachable after the hour test.

A park with normal hours behaves line for line as before, and that is the
assertion the regression tests exist for: with the fix reverted, ten of the new
assertions in `scripts/test-planner-estimate.mjs` go red and every regression
line stays green.

## The API half (open)

**`/plan/day` returns no ride curves at all for a wrap day.** Swept across all
212 parks on three dates:

| Date       | Wrap days | …with `rides: []` |
| ---------- | --------- | ----------------- |
| 2026-09-05 | 4         | 4                 |
| 2026-10-31 | 13        | 13                |
| 2026-12-31 | 5         | 5                 |

Twenty-two for twenty-two. Every one `status: OPERATING`,
`hoursSource: schedule`, both tiers represented (`measured` and `composed`).

The control is what makes it a defect rather than a property of those parks — the
**same parks** on a non-wrap day answer normally:

| Park                 | Day        | Hours   | `rides` |
| -------------------- | ---------- | ------- | ------- |
| Parque Warner Madrid | 2026-09-13 | 12 → 21 | **31**  |
| Parque Warner Madrid | 2026-10-31 | 12 → 0  | **0**   |
| Cedar Point          | 2026-09-13 | 11 → 20 | **14**  |
| Cedar Point          | 2026-10-31 | 11 → 0  | **0**   |
| Kings Dominion       | 2026-09-13 | 11 → 20 | **23**  |
| Kings Dominion       | 2026-10-31 | 11 → 0  | **0**   |

Same park, same week, same tier. And the history is demonstrably there: the park
payload for La Ronde carries `statistics` and `bestVisitTimes` for all 38
attractions while `/plan/day` answers with nothing for the same park on the same
day.

Three parks are wrap **every day** — La Ronde (`10 → 0`), Six Flags Mexico
(`10 → 0`) and Six Flags Qiddiya City (`16 → 0`) — so they have never had a
single hourly curve on this site.

The shape suggests the same mistake one level down: a loop of the form

```
for (h = openHour; h <= closeHour; h++)
```

runs zero times when `closeHour < openHour`.

## What is not knowable yet, and why the frontend hedges

Because no wrap day has ever carried a curve, **nothing establishes what
`hours[].hour` would contain** for one: the wall-clock hour (`0` for 00:30, which
is what `context.closeHour` itself reports) or the unfolded hour (`24`). That is
the reason for the double lookup above. When the API starts answering, check a
wrap day's `hours[]` against this and the second lookup can go — leave a note
here when it does.

For a normal park the question is settled by measurement: Disneyland Park at
`8 → 23` returns exactly `hours` 8…23, so the bound is inclusive, which is what
`buildDayGrid` has always assumed.

## Reproducing

```
curl -s 'https://api.park.fan/v1/parks/north-america/canada/montreal/la-ronde/plan/day?date=2026-10-31' | jq '{ctx: .context | {openHour, closeHour, status, hoursSource}, rides: (.rides | length)}'
```

The sweep that produced the tables is not in the repo — it walks
`/v1/discovery/geo` and asks `/plan/day` per park per date, and it is two dozen
lines. Rewrite it rather than keeping a script whose numbers rot.

## Related

- [Backend integration](backend-integration.md)
- [Parks without wait times](parks-without-wait-times.md) — the other case where
  an empty answer means something specific and must not be read as "quiet"
- [Trip planner](../features/trip-planner.md)
