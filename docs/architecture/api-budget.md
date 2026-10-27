# API budget per page

What each route costs in client-side API requests and in server-rendered payload, what every field
in those payloads is read for, and the consolidations that were measured and rejected. Open it
before adding a request to a page or a field to a payload. The rules are
[API budget per page](../rules/api-budget-per-page.md) and
[the page render is the bigger half](../rules/the-page-render-is-the-bigger-half-of-the-api-budget-and-it.md);
this page holds their measurements.

`node scripts/measure-api-calls.mjs` drives a real browser against a running site and counts every
request to `/api/*` (one backend call each), with transfer size and landing time:

```bash
node scripts/measure-api-calls.mjs                  # all routes
node scripts/measure-api-calls.mjs --only park      # one route
node scripts/measure-api-calls.mjs --json out.json  # machine-readable
```

Numbers are `/de`, Phantasialand, an August afternoon with every ride reporting (the expensive
case), uncompressed bodies; brotli takes them to roughly a seventh. `next start` does not compress
`/api/*`, so weigh poll bodies with brotli yourself.

## Current budget

| Page               | Calls | API bytes | Before the trims |
| ------------------ | ----: | --------: | ---------------- |
| home               |     5 |   13.9 KB | 7 / 24.7 KB      |
| parks hub          |     1 |    0.1 KB |                  |
| continent          |     2 |    0.8 KB |                  |
| country            |     2 |    4.0 KB | 2 / 7.4 KB       |
| city (multi-park)  |     2 |    4.1 KB | 2 / 7.4 KB       |
| park               |     8 |   69.3 KB | 8 / 119.0 KB     |
| park calendar      |     9 |   92.8 KB | 12 / 121.9 KB    |
| attraction         |     2 |   27.0 KB | 2 / 58.3 KB      |
| search             |     1 |    0.1 KB |                  |
| blog index         |     2 |    9.4 KB | 4 / 18.2 KB      |
| fancast            |     2 |    9.4 KB | 4 / 18.2 KB      |
| best-time-to-visit |     2 |    9.4 KB | 4 / 18.2 KB      |

The table is older than the day-plan request below and has not been re-measured as a whole.

- **Home:** `/api/analytics/realtime` moved from 4.4 to 2.4 KB between the runs on its own content;
  the part due to the trims is the region batch, 18.2 → 9.3 KB.
- **Calendar:** the park page's `#calendar` hash forwards to the calendar page through
  `CalendarHashRedirect`, an inline script that runs before the hydrating chunks are parsed, so
  the park page no longer pays for three queries the calendar page then repeats. The two
  `calendar` calls are not a duplicate: one is the month for the grid, the other a single day for
  the forecast cell.
- **One run may count one call more:** the harness scrolls, the browser can report that as a focus
  event, and `useWeatherNowcast` refetches on focus. Repeat before believing a count that moved by one.
- **`/api/nearby`** is on every page (the header's "parks near you"), answers from the visitor's IP
  and cannot be shared. With `NEXT_PUBLIC_API_DIRECT=1` it goes to api.park.fan directly and leaves
  this table ([the rule](../rules/a-request-no-cache-can-share-goes-to-the-api-directly.md)).

## The park page, request by request

```
+1.8s   40.3 KB  /api/parks/<geo>/<park>                  live poll, repeats every 5 min
+1.8s    4.9 KB  /api/parks/<geo>/<park>/weather/nowcast  rain/storm warning
+1.8s    3.0 KB  /api/weather/hourly                      today's weather chart
+2.4s   14.8 KB  /api/parks/<geo>/<park>/best-days        90-day crowd projection      ← loads last
+2.5s    3.0 KB  /api/parks/<geo>/<park>/stats            2-year aggregate             ← loads last
+2.5s    1.9 KB  /api/parks/<geo>/<park>/calendar?…       today only, for the forecast cell
+2.6s    0.1 KB  /api/nearby                              header
+3.0s    1.3 KB  /api/parks/near                          "parks nearby" status overlay
+3.1s   23.6 KB  /api/parks/<geo>/<park>/plan/day         today's ride openings, early entry  ← loads last
```

`/plan/day` (PAR-742, `useParkPlanDay`) feeds "opens around HH:mm" on a ride that starts after its
park and the park's early-entry line; the ride page asks for it only for a closed ride. Measured
2026-10-07 on a local build: park 8 calls / 75.4 KB → 9 / 99.0 KB uncompressed, 2,893 B brotli,
once per page view, not polled. Against [the byte budget](../rules/a-day-in-the-park-has-a-byte-budget.md)
the first visit grows from about 847 to 850 KB, at its ceiling.

Merging these requests is tempting and wrong:

- **`best-days` and `stats` stay separate.** `stats` is a cold-compute aggregate on the backend
  (`getParkHistoricalStats` retries with backoff while it builds); `best-days` is a materialized
  snapshot that answers at once. Merged, the fast one waits for the slow one.
- **Neither joins the live poll.** Both are held back by `useLoadLast`
  ([park page loading priority](../rules/park-page-loading-priority.md)).
- **`nowcast` stays out of the park fetch.** It is the slowest park dependency, and timing out
  inside the park fetch used to fail the whole route's render.
- **The one-day `calendar` could fold into `best-days`** (same source, both feed the forecast cell),
  but `best-days` waits behind the load-last gate and the forecast cell is above the fold.

## What each payload is for

Every trim below is done in the proxy layer; together they are the shape of the question to ask of
any new field.

### The live poll: 90 KB → 40 KB

`useLiveParkData` re-downloads the park every five minutes while a tab is open. Half of it cannot
change in five minutes and is already in the page:

| Block                          |    Size | Changes within 5 min?                                                      |
| ------------------------------ | ------: | -------------------------------------------------------------------------- |
| `attractions[]` static fields  | 27.6 KB | no: names, coordinates, heights, `ropeDrop`, `typicalWaits`, `rideProfile` |
| `restaurants[46]`              |  9.7 KB | not in five minutes, but once a day (below)                                |
| `schedule[17]`                 | 13.5 KB | no, and every consumer takes it as a prop                                  |
| `shows[4]`                     |  1.3 KB | not in five minutes, but once a day (below)                                |
| `attractions[].statistics`     | 13.8 KB | **yes**: current wait, today's peak, the card sparkline                    |
| `attractions[].bestVisitTimes` |  6.9 KB | **yes**: ML slots that refine through the day                              |
| `attractions[].queues`         |  4.2 KB | **yes**                                                                    |
| `weather`                      |  3.7 KB | **yes**                                                                    |

The route answers with `LiveParkSnapshot` (`leanParkForLivePoll`, `lib/api/park-live-projection.ts`):
the volatile fields plus each ride's id, name, slug and land (4 KB), and `mergeLiveParkSnapshot`
lays it over the server-rendered park in the hook's `select`, so every consumer still reads a full
`ParkWithAttractions`. Membership and order come from the snapshot, so a ride that opened after the
render appears within one poll.

- `comparison` is never rendered and is not in the projection.
- `baseline` rides the poll for the ride card's crowd-scale tooltip (PAR-378,
  `rideCrowdMinuteRanges`) but stays out of the server render, which a shell written before opening
  would not have anyway: +39 B brotli per poll on Epcot's 33 rides.
- Each ride's `park: { slug }`, the key `enrichAttractionsWithImages` looks a photo up by, is
  stripped after the lookup (PAR-517): nothing reads a park that carries only a slug.

**Shows and restaurant status are day-scoped.** They do not move between two polls; they move once,
at opening. The API dates showtimes to today and reports every show CLOSED while the park is
closed, so an overnight server copy says "yesterday's times, nothing running" all day (2026-09-01:
Phantasialand's four shows dated the day before, 0 of 46 restaurants open at 13:38). So the block
travels on request: `useLiveParkData` adds `?full=1` (`leanParkForLivePoll(park, { daily: true })`)
on a tab's first poll, every 30 minutes after (`DAILY_BLOCK_INTERVAL_MS`) and once more when the
park's status flips. Upstream it is free, since the proxy fetches the whole park either way; to the
browser it is 5.1 KB twice an hour (a lean poll 41.6 KB, a full one 46.9 KB). Shows go over whole
(the API drops a show with no showtimes today, so the set itself is about today); restaurants send
only `status`, `waitTime`, `partySize` and `operatingHours` (4.0 KB against 9.9). An absent block
means unchanged, and the hook carries the freshest one into the next cached snapshot.
`pnpm test:live-park-daily-block`. The server render is fixed from the other side: the backend
POSTs the park's tag (`parkCacheTag`, the geo path, since slugs are not unique) to
`/api/revalidate` with `"expire": 0` at each status flip.

### The hourly curve: an hour-scoped field in a day-cached payload

The calendar's day dialog draws an hour-by-hour crowd chart from `day.hourly`. Asking for it on
the month request (`includeHourly`) costs only ~600 bytes, because only today and tomorrow carry a
curve, but the month is shared-cached for a day and the curve is scoped to the hour it was fetched
in (today's series starts at the current UTC hour). So it has its own route,
`…/calendar/hourly?date=`, rather than a parameter, because a `next.config.ts` header rule matches a
path and never a query string. `useCalendarDayHourly` asks only while the dialog is open and only
for today or tomorrow in the **park's** timezone (`CalendarDay.isTomorrow` is never sent);
`date` is validated against a window of today ± one day, so a well-shaped nonsense date cannot mint
a CDN key.

The five-minute window does not decide freshness: api.park.fan answers this URL with an expiry at
park-local midnight and Cloudflare keeps it, so the first reader of the day fixes the curve
(PAR-217). The chart drops bars whose hour has ended, so a kept copy draws fewer bars, never wrong
ones. `HourlyPrediction.hour` is a **UTC** hour: `upcomingHourlyPredictions`
(`lib/utils/calendar-utils.ts`) turns the series into instants rendered in park time.
`pnpm test:calendar`.

### Attraction detail: 58 KB → 27 KB

`schedule[].influencingHolidays` (the neighbouring regions on school break, for 31 days) was
25.7 KB, larger than the wait history the page exists to draw, and nothing on the ride page reads it.
`leanAttractionForDetail` keeps four schedule fields: `date` and `scheduleType` for
`AttractionHistoryGrid` (ride closed vs park closed) and today's `openingTime`/`closingTime` for
`DailyWaitTimeChartClient`'s axis.

### Park schedule: only today's holiday context ships

The same field on the park payload is 8.4 KB over 17 days, and only today's entry is rendered
(`useTodaySchedule` → `HeaderHolidayPanel` / `ParkTimeInfo`). The first three days keep it
(`SCHEDULE_HOLIDAY_CONTEXT_DAYS`): the seed before the clock, today, and tomorrow for a park east of
the fetch.

### Card live status: three requests → one

Card grids overlay nine fields on a status-free prerendered shell. `/api/parks/live?regions=…`
takes the whole region list and returns only those fields: the featured-parks strip went from three
requests and 16.7 KB to **one request, 9.3 KB**, on the homepage, blog index, fancast,
best-time-to-visit, glossary and guide. Hubs and inline blog references use the same route through
`useRegionParks`. The response is identical for every visitor of a region set, so its 60 s CDN
window is close to a pure hit.

### Ride positions for the in-park compass: 88 KB → 0.7 KB

`ParkCompass` needs the headliners' coordinates, which `/api/nearby` does not send. Instead of the
park payload (~88 KB on Phantasialand), `/api/parks/<geo>/<park>/positions` returns
`{ slug, latitude, longitude }` per ride and the park's magnetic declination: 2.9 KB raw, 751 B
brotli, read from the day-cached park and held a day by the CDN. `useRidePositions` asks once per tab
(`staleTime: Infinity`), and only for a visitor the nearby answer places inside a park.

### Ride figures for the park map popups: on the map tab only

The map's popups show top speed, height and ride time, but the park page's server render drops
`rideProfile` (`leanParkForParkShell`, 3.61 KB on Phantasialand). `/api/parks/<geo>/<park>/ride-stats`
returns `{ stats }` keyed by attraction id for the rides that have a figure (694 B raw, 338 B gzip,
8 of 40 rides). `ParkMap` mounts only while its tab is shown and `useRideFigures` asks there
(`staleTime: Infinity`), so a park page opened without the map makes no such request.

## Where the remaining weight is

- **The calendar month (51 KB).** `neighborHolidays` (17.9 KB) and `headlinerForecast` (14.9 KB)
  are read only by the day dialog, but the grid cell needs `neighborHolidays.length` for its marker,
  and trimming would cost a fetch per opened day. The fix is upstream: the same holiday object
  repeats per region per day, and `headlinerForecast.rides[].name` repeats five names 31 times.
  Interning them in the API would save about 20 KB with no client change.
- **`/api/analytics/realtime` + `/api/analytics/geo-live`.** Merging looks free on the homepage,
  but continent pages read only `geo-live` (0.7 KB) and would start paying for `realtime`
  (2.4–4.4 KB). Measured, then dropped.

## Blog widgets: what a post may fetch

A post embeds the same client components as a park page, and every widget was measured before it
was built:

| Widget                              | Requests              | Payload                | Verdict            |
| ----------------------------------- | --------------------- | ---------------------- | ------------------ |
| `park-comparison-widget`            | 7 × `/stats`          | ~3 KB each, **21 KB**  | built              |
| `ride-waits-widget`                 | 1 per park named      | ~3 KB each             | built, shares them |
| `hourly-profile-widget`             | 1 × `/stats/hourly`   | **~2 KB**              | built              |
| the same, off `/attractions/<slug>` | 8 × attraction detail | 53 KB each, **425 KB** | rejected           |

The rejected row was 45 % `schedule` and 37 % `history` for a widget that draws one hourly curve.
The fix was a backend projection (`/stats/hourly`), the same decision as `LiveParkSnapshot`:
**when a payload is 200× what a table needs, the answer is a projection, not a smaller `select`.**

Every stats-backed table goes through `useParkStatsQueries`, which owns the query key, the stale
window and the `useLoadLast` gate. Its key is byte-identical to `useParkHistoricalStats`'s, so a
post with a `stats-widget` and a `ride-waits-widget` for the same park pays once. `topN` is a closed
set, not a passthrough: it is part of the CDN key, and an arbitrary number would let a caller mint
unlimited cold-compute misses per park.

## The other copy: what the server render serializes

Whatever a Server Component hands to a Client Component is serialized into the RSC payload (the
`self.__next_f.push([1,"…"])` scripts at the end of the document). It is roughly half the bytes of
a park page, paid by **every request including the crawler's**, and never re-fetched. Measured on
production, cache-busted, uncompressed:

| Page               | HTML   | RSC payload | of which park data | of which messages |
| ------------------ | ------ | ----------- | ------------------ | ----------------- |
| Wait-time calendar | 444 KB | 199 KB      | 60.3 KB            | 26.8 KB           |
| Park               | 500 KB | 205 KB      | 39.4 KB            | 36.2 KB           |
| Attraction         | 408 KB | 167 KB      | 3.7 KB             | 33.1 KB           |

`leanParkForAttractionShell` narrows the park to the one ride shown (36.3 → 3.7 KB).
`leanParkForCalendarShell` keeps the twelve attraction fields the calendar route reads
(`ParkTodayPanel`'s headliner rows, `useParkTileItems`) out of the twenty-two it shipped: 39.3 →
15.2 KB, −28.6 KB of HTML but only −1.52 KB brotli (−2.9 %). It is an **allow**-list, unlike its
siblings, so a field the API adds later stays out by default. `pnpm test:calendar-park-projection`
drives it through the real readers (`getStandbyWait`, `getAttractionDisplayStatus`, `isInSeason`),
because a dropped field that a component still reads renders a dash, not an error.

Where it is still heavy:

- **`restaurants`** on the calendar route (6.6 KB raw, about −0.95 KB brotli): `useParkTileItems`
  reads 46 records for a `.length` and an `OPERATING` count. Doing it properly means moving those
  two numbers onto `ParkTileSource`, not inventing a `ParkRestaurant` with an empty name.
- **The `parks` translation namespace** (15.1 KB) arrives whole wherever one client component asks
  for `useTranslations('parks')`; a ride page pays for `parks.calendarPage`, `bestDays`, `dayDetail`
  and more. Narrowing the call sites to sub-namespaces (as `parks.crowdLevels` and `parks.status`
  already are) was measured at −3.0 KB brotli on the ride page across all 23 call sites, and at
  about −5.7 KB per ride page in situ for the four call sites that route reads
  ([decisions](../optimization/decisions.md#2026-09-01--rejected-reopened-2026-09-02-the-parks-namespace-on-the-ride-route)). Not done: next-intl renders a missing
  namespace as its raw key, so every step wants `pnpm check:client-messages` green.
- **Inline SVG**, about 51 KB and 112 icons per page. A `<symbol>`/`<use>` sprite measured 419 B
  worse, not better.

**Cost follows the URL count, not the visitor count.** Twelve hours of production invocations
(before the calendar span cut):

| Route              | Invocations | Active CPU | Transfer out | Distinct URLs |
| ------------------ | ----------- | ---------- | ------------ | ------------- |
| Attraction         | 11 K        | 22 min     | 491 MB       | 42,756        |
| Wait-time calendar | 9.9 K       | 26 min     | 567 MB       | 27,984        |
| Park               | 1.7 K       | 3 min      | 101 MB       | 1,272         |

Each calendar URL was fetched about 0.7 times a day and each ride URL about 0.5: a crawler sweep
that no cache can keep warm. Trimming the payload moves transfer and a little CPU; the number of
renders follows the crawl surface. The calendar surface has since been cut to 5,820 URLs (sitemap,
2026-09-21); see [optimization](../optimization/README.md).

### How to measure it

From the bytes, on a **cache-busted** URL:

```bash
curl -sS -H 'Accept-Encoding: identity' "https://park.fan/de/…/wartezeiten-kalender/2026/10?cb=$RANDOM"
```

Join the `self.__next_f.push([1,"…"])` string literals, JSON-parse them, size each field, and
brotli-diff before against after. **Judge it compressed:** brotli prices repeated JSON keys at
almost nothing, so the raw figure flattered the calendar trim 19×. Two traps, both of which gave a
wrong answer first:

- **A/B inside one build.** A local render diffed against production measures the deploy gap too
  (−3.2 KB read where the truth was −1.52). Rebuild one HTML file twice through the same pipeline,
  with and without the fields.
- **Both sides through the same re-chunking**, or you measure your own serializer (the first attempt
  reported the trimmed page as larger).

A plain fetch returns whatever Cloudflare holds: a `HIT` park page once lacked `statistics` and
`bestVisitTimes`, which read exactly like a projection already working; the fresh render had both.

## Adding a field

Decide which of the four kinds it is ([the rule](../rules/api-budget-per-page.md)). Then run
`node scripts/measure-api-calls.mjs` before and after for the requests, and weigh the RSC payload
for the render: a field can be free in one and expensive in the other. A new request on the park
page needs a reason that is not "it was easier".

### Reading live data without adding a request

A section that wants current waits needs no fetch of its own: a second observer of
`['park-live', …]` with **`enabled: false`** reads the cache `useLiveParkData` fills and re-renders
on every poll without ever requesting. The "now" column of `ParkStatsSection`'s top-ten table works
this way. Two consequences:

- **No seed, no static fields.** The observer passes no `initialData`, so it gets the projection
  as-is. Park-level flags such as `liveWaitTimes` are not in it, and `hasReadableWaitTimes()` would
  read an absent flag as "available": take such a flag as a prop from the server render
  (`ParkStatsSection`'s `hasLiveWaitTimes`).
- **It is opportunistic.** Where nothing else subscribes, the cache stays empty, so the consumer
  must render without the data. On a park page `LiveParkData` always mounts the primary observer;
  on a blog post it depends on the widgets.

## Related

- [Backend integration](../api/backend-integration.md): the client and its relays
- [CDN caching](cdn-caching.md): the windows these responses ride on
- [Park page loading priority](../rules/park-page-loading-priority.md): load order
