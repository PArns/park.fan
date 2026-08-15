# API budget per page

What every route costs in client-side API requests, where that cost comes from, and which parts
of each payload are actually read. Measured with `node scripts/measure-api-calls.mjs` against a
running site — it drives a real browser, counts every request to `/api/*` (one backend call each)
and records transfer size and landing time.

```bash
pnpm dev
node scripts/measure-api-calls.mjs                     # all routes
node scripts/measure-api-calls.mjs --only park         # one
node scripts/measure-api-calls.mjs --json out.json     # machine-readable
```

Numbers below are `/de`, Phantasialand, an August afternoon (park open, all rides reporting) —
the expensive case. Sizes are uncompressed response bodies; over the wire they are brotli'd to
roughly a seventh.

## Current budget

| Page               | Calls | API bytes | Was       |
| ------------------ | ----: | --------: | --------- |
| home               |     5 |   13.9 KB | 7 / 24.7¹ |
| parks hub          |     1 |    0.1 KB | unchanged |
| continent          |     2 |    0.8 KB | unchanged |
| country            |     2 |    4.0 KB | 2 / 7.4   |
| city (multi-park)  |     2 |    4.1 KB | 2 / 7.4   |
| park               |     8 |   69.3 KB | 8 / 119.0 |
| park `#calendar`   |     9 |  120.6 KB | 9 / 170.4 |
| attraction         |     2 |   27.0 KB | 2 / 58.3  |
| search             |     1 |    0.1 KB | unchanged |
| blog index         |     2 |    9.4 KB | 4 / 18.2  |
| fancast            |     2 |    9.4 KB | 4 / 18.2  |
| best-time-to-visit |     2 |    9.4 KB | 4 / 18.2  |

¹ `/api/analytics/realtime` measured 4.4 KB in the "was" run and 2.4 KB in the "is" run. That is
the endpoint's own content moving (its most/least-crowded lists), not a change here — the part
attributable to this work is the region batch, 18.2 KB → 9.3 KB.

The park row's "was" is the stable figure. One run recorded 8 calls plus a ninth: the harness
scrolls the page, which the browser can report as a focus event, and `useWeatherNowcast` has
`refetchOnWindowFocus`. Worth knowing when reading a single run — repeat before believing a
count that moved by one.

`/api/nearby` is the one request on every single page: it is the header's "parks near you", it
answers from the visitor's IP when no coordinates are given, and it therefore cannot be shared or
cached. It is also ~100 bytes. Leave it alone.

## The park page, request by request

```
+1.8s   40.3 KB  /api/parks/<geo>/<park>                  live poll, repeats every 5 min
+1.8s    4.9 KB  /api/parks/<geo>/<park>/weather/nowcast  rain/storm banner
+1.8s    3.0 KB  /api/weather/hourly                      today's weather chart
+2.4s   14.8 KB  /api/parks/<geo>/<park>/best-days        90-day crowd projection   ← loads last
+2.5s    3.0 KB  /api/parks/<geo>/<park>/stats            2-year aggregate          ← loads last
+2.5s    1.9 KB  /api/parks/<geo>/<park>/calendar?…       today only, for the forecast cell
+2.6s    0.1 KB  /api/nearby                              header
+3.0s    1.3 KB  /api/parks/near                          "parks nearby" status overlay
```

Eight requests reads high, and folding them together is tempting. It is also the wrong move, and
the split is deliberate:

- **`best-days` and `stats` must stay separate.** `stats` is a cold-compute aggregate on the
  backend — a park nobody has asked about in a while answers non-OK for a few seconds while it
  builds (`getParkHistoricalStats` retries with backoff for exactly this). `best-days` is a
  materialized Redis snapshot and answers immediately. Merging them puts the fast one behind the
  slow one and the best-days calendar renders its skeleton for as long as the aggregate takes.
- **Neither may join the live poll.** Both are `useLoadLast`-gated on purpose — see
  [system-overview §4](system-overview.md#4-park-page-loading-priority-requirement). Wait times and
  weather must land first.
- **`nowcast` must stay separate from the park.** Its fill is the slowest park dependency and
  timing out inside the park fetch is what used to fail the whole route's prerender.

What genuinely could merge is the 1-day `calendar` into `best-days` — same data source, and both
feed the header's forecast cell. It is not done because `best-days` sits behind the load-last gate
and the forecast cell is above the fold; pulling the day detail behind that gate to save one 1.9 KB
request trades a visible delay for a small win.

## What each payload is actually for

Three payloads carried a lot that nothing reads. All three are trimmed in the proxy layer now, so
the numbers below are what changed and why — they are also the shape of the question to ask of any
new field.

### The live poll: 90 KB → 40 KB

`useLiveParkData` re-downloads the park every five minutes for as long as a tab is open. Half of
what it fetched cannot change in five minutes and is already in the page the visitor is reading:

| Block                          |    Size | Changes within 5 min?                                                       |
| ------------------------------ | ------: | --------------------------------------------------------------------------- |
| `attractions[]` static fields  | 27.6 KB | no — names, coordinates, heights, `ropeDrop`, `typicalWaits`, `rideProfile` |
| `restaurants[46]`              |  9.7 KB | no                                                                          |
| `schedule[17]`                 | 13.5 KB | no, and every consumer already takes it as a prop                           |
| `shows[4]`                     |  1.3 KB | no                                                                          |
| `attractions[].statistics`     | 13.8 KB | **yes** — current wait, today's peak, the card sparkline                    |
| `attractions[].bestVisitTimes` |  6.9 KB | **yes** — ML slots that refine through the day                              |
| `attractions[].queues`         |  4.2 KB | **yes**                                                                     |
| `weather`                      |  3.7 KB | **yes**                                                                     |

So the route answers with `LiveParkSnapshot` — the volatile fields plus each ride's identity
(id/name/slug/land, 4 KB) — and `mergeLiveParkSnapshot` lays it back over the server-rendered park
in the hook's `select`, per observer. Every consumer still reads a complete `ParkWithAttractions`.

The identity fields are not incidental: membership and order come from the snapshot, so a ride that
opened since the page was rendered still appears within one poll, exactly as when the poll returned
the whole park.

`comparison` and `baseline` arrive on every attraction from the API and have never been rendered
anywhere. They are simply not in the projection.

### Attraction detail: 58 KB → 27 KB

`schedule[].influencingHolidays` — the neighbouring regions whose school break falls on each of the
31 days — was 25.7 KB, the largest single block in the response, bigger than the wait-time history
the page exists to draw. Nothing on the ride page reads it. Two components touch this schedule and
between them read four fields: `AttractionHistoryGrid` needs `date` → `scheduleType` to tell "ride
was closed" from "park was closed", and `DailyWaitTimeChartClient` needs today's
`openingTime`/`closingTime` for the chart's x-axis. `leanAttractionForDetail` projects to those
four.

The holiday context that IS rendered — the header's neighbouring-regions chips — is a park-page
feature fed by the park payload.

### Park schedule: only today's holiday context ships

Same field on the park payload, 8.4 KB over 17 days, and only **today's** entry is ever rendered
(`useTodaySchedule` → `HeaderHolidayPanel` / `ParkTimeInfo`). It shipped in the page HTML and again
in every poll. Three leading days are kept — `useTodaySchedule` seeds with `schedule[0]` before the
clock is available, and a park east of the fetch is already on tomorrow's entry — and the rest drop
the field.

### Card live status: three requests → one

Every card grid on the site overlays nine fields on a prerendered shell (status, crowd, average
wait, open/total counts, timezone, today's and next schedule) so the shell itself can stay
status-free and cache for a day. Those nine fields used to come from
`/api/discovery/<continent>/<country>`, which answers with the region's full park objects.

The featured-parks strip spans three countries, so six cards cost three requests and 16.7 KB, of
which 7.2 KB is fields nothing on the page reads. `/api/parks/live?regions=…` takes the whole
region list at once and returns only the projection: **one request, 9.3 KB**, on the homepage, the
blog index, fancast, best-time-to-visit, the glossary and howto. Hub pages and the blog's inline
park references use the same route through `useRegionParks`, at ~55% of the bytes.

Because the response is byte-identical for every visitor of a region set, its 60 s CDN window is
close to a pure hit — the old per-visitor `no-store` calls could not collapse at all.

## Where the remaining weight is

Two things measured large and were deliberately left alone.

**The calendar month (51 KB, `#calendar` only).** `neighborHolidays` (17.9 KB) and
`headlinerForecast` (14.9 KB) across 31 days are read only by the day-detail dialog, which opens on
click. Trimming them would make the grid lean but force a fetch per opened day, and the grid cell
itself needs `neighborHolidays.length` for its marker. The real fix is upstream serialization: the
same "Summer Holidays" object repeats per region per day, and `headlinerForecast.rides[].name`
repeats the same five ride names 31 times. Interning those in the API would take roughly 20 KB off
without any client change.

**`/api/analytics/realtime` + `/api/analytics/geo-live`.** Both are param-less globals on the same
5-minute cadence and both fire on the homepage, so merging them looks free. It is not: continent
pages read only `geo-live` (0.7 KB) and would start paying for `realtime` (2.4–4.4 KB) to save the
homepage one request. Measured, then dropped.

## Adding a field

The question is not "is this field useful" but "which of these is it":

1. **Rendered and volatile** → belongs in the live projection.
2. **Rendered and day-stable** → belongs in the server render, and the merge will carry it.
3. **Not rendered** → it costs its size on every poll of every open tab. Leave it out.

Run `node scripts/measure-api-calls.mjs` before and after. A new request on the park page needs a
reason that is not "it was easier".

### Reading live data without adding a request

A section that wants the current wait times does not need a fetch of its own. `useLiveParkData`
keyed on `['park-live', <geo>, <park>]` is already polling for the whole page, so a second observer
on that key with **`enabled: false`** reads the cache and re-renders on every poll without ever
issuing a request — React Query only disables the fetch, not the subscription. This is how the
"now" column in the historical top-ten table (`ParkStatsSection`) gets its numbers.

Two consequences worth knowing before reaching for it:

- **No seed, no static fields.** The observer passes no `initialData`, so `mergeLiveParkSnapshot`
  hands it the projection as-is: identity, `queues`, `statistics`, `bestVisitTimes` — and nothing
  the server render carried. Park-level flags like `liveWaitTimes` are **not** in the snapshot, so
  `hasReadableWaitTimes()` would read an absent flag as "available": anything that depends on one
  takes it as a prop from the server render instead (`ParkStatsSection`'s `hasLiveWaitTimes`).
- **It is opportunistic.** Where nothing else on the page subscribes to that key the cache stays
  empty and the consumer has to render without the data — which is why the column is built to
  disappear rather than to show placeholders. On a park page it is always populated (`LiveParkData`
  mounts the primary observer); on a blog post it depends on which widgets the post uses.

## Related

- [API integration](api-integration.md) — the client and its proxy routes
- [Caching strategy](caching-strategy.md) — the CDN windows these responses ride on
- [System overview §4](system-overview.md#4-park-page-loading-priority-requirement) — load order
