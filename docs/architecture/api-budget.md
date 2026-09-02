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
| `restaurants[46]`              |  9.7 KB | not in five minutes — but once a day, see below                             |
| `schedule[17]`                 | 13.5 KB | no, and every consumer already takes it as a prop                           |
| `shows[4]`                     |  1.3 KB | not in five minutes — but once a day, see below                             |
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

### The day-scoped block: shows and restaurant status

"Does it change within five minutes" was the wrong question for two of those rows, and the site
answered it wrongly for as long as the projection existed. Shows and restaurant statuses do not
move between two polls — they move once, at opening — and nothing carried them across that moment:
the poll left them out, and the server render's copy comes from a fetch cached for
`PARK_REVALIDATE`. Whatever that entry happened to be written with stood for the rest of the day.

Written overnight, which is the usual case, it is written wrong twice over. The API answers with a
show's showtimes **for today** and reports every show as CLOSED for exactly as long as the park is
closed (`park-integration.service.ts`), so a 04:00 entry says "yesterday's times, nothing running"
— and that is what park.fan served all day on 2026-09-01: Phantasialand's four shows dated
2026-08-31 under "Keine Vorstellungen heute", 0 of 46 restaurants open at 13:38, while the API
answered `OPERATING` with today's times for all of them. Europa-Park and Efteling the same. It is
also why "refresh shortly before opening" does not work: measured on Magic Kingdom 70 minutes
before its gates, the showtimes are already right and all 15 shows still read CLOSED.

So the block travels on request. `leanParkForLivePoll(park, { daily: true })` adds it, the proxy
turns `?full=1` into that flag, and `useLiveParkData` asks for it on a tab's first poll, every 30
minutes after, and once more whenever the park's own status flips. **Upstream this is free** — the
proxy fetches the whole park on every poll either way and used to drop the block on the floor; the
only cost is 5.1 KB to the browser twice an hour instead of twelve times — ~10 KB an hour rather
than ~61. (Measured against a running server: a normal poll is 41.6 KB and carries neither key, a
`?full=1` poll 46.9 KB.)

Shows go over whole and restaurants projected, because membership differs: the API drops a show
with no showtimes today, so the set is itself a statement about today and the merge replaces it
wholesale. Restaurants keep theirs, so only `status`/`waitTime`/`partySize`/`operatingHours` ride
along and the card reads name, slug and coordinates from the server render — 4.0 KB against 9.9.
An absent block means unchanged, never empty, and the hook carries the freshest one it has seen
into the next cached snapshot so a lean poll cannot fall back to the morning copy.
`pnpm test:live-park-daily-block` pins all of that.

That leaves the server render, which is what a crawler and the first paint see. It is fixed from
the other side: the fetch carries a per-park tag (`parkCacheTag`, the geo path — slugs are not
globally unique, `disneyland-park` is Anaheim and Paris), and the backend POSTs that tag to
`/api/revalidate` with `"expire": 0` the moment the park's status flips. One small request per park
per transition, and only the parks somebody then visits are re-fetched — where a cron would sweep
all 213 on a clock that fits none of their timezones.

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

## Blog widgets: what a post may fetch

A blog post is not a park page, but it embeds the same client components, and the budget rule
does not soften just because the route is cheaper. Every widget here was measured before it was
built:

| Widget                              | Requests              | Payload                | Verdict            |
| ----------------------------------- | --------------------- | ---------------------- | ------------------ |
| `park-comparison-widget`            | 7 × `/stats`          | ~3 KB each, **21 KB**  | built              |
| `ride-waits-widget`                 | 1 per park named      | ~3 KB each             | built, shares them |
| `hourly-profile-widget`             | 1 × `/stats/hourly`   | **~2 KB**              | built              |
| the same, off `/attractions/<slug>` | 8 × attraction detail | 53 KB each, **425 KB** | rejected           |

The last row is what the hourly table used to cost, and the breakdown says why: **45 % is
`schedule`** and 37 % is `history`. The widget renders an hourly curve and nothing else, so even
the useful half was 176 KB. The fix was a backend projection — `/stats/hourly`, the same shape of
decision as `LiveParkSnapshot` — which answers the same eight rides in ~2 KB. **This is the
pattern: when a payload is 200× what a table needs, the answer is a projection, not a smaller
`select`.**

Every stats-backed table goes through **`useParkStatsQueries`**, which owns the query key, the
stale window and the `useLoadLast` gate in one place. That matters for sharing: the key is
`['park-historical-stats', continent, country, city, parkSlug]`, byte-identical to the one
`useParkHistoricalStats` uses, so a post embedding a `stats-widget` and a `ride-waits-widget` for
the same park pays once. Two `ride-waits-widget`s naming rides in the same park pay once. It had
been three copies of that key in three files, which is one rename away from silently fetching
twice.

**`topN` is a closed set, not a passthrough.** The one deeper request a table needs (`topN=30`,
for a list that names specific rides rather than taking the top of the ranking) is forwarded; any
other value falls back to the backend default. It reaches the CDN as part of the cache key, so an
arbitrary number lets a caller mint unlimited distinct objects per park, each of them a cold-
compute miss on the backend.

All of them are deferred through `useLoadLast`, like every other historical query: a post's live
park cards must never lose the race to a table nobody has scrolled to yet.

## The other copy: what the server render serializes

Everything above measures the **poll**. There is a second copy of the same data on every one of
these pages, and until Sept 2026 nobody had weighed it: whatever a Server Component hands to a
Client Component is serialized into the RSC payload — the `self.__next_f.push([1,"…"])` script
tags at the end of the document — so the client can hydrate. It is roughly half the bytes of a
park page, it is paid by **every request including the crawler's**, and unlike the poll it is
never re-fetched, so nothing about it self-corrects.

Measured on production, cache-busted, uncompressed:

| Page               | HTML   | RSC payload | of which park data | of which messages |
| ------------------ | ------ | ----------- | ------------------ | ----------------- |
| Wait-time calendar | 444 KB | 199 KB      | 60.3 KB            | 26.8 KB           |
| Park               | 500 KB | 205 KB      | 39.4 KB            | 36.2 KB           |
| Attraction         | 408 KB | 167 KB      | 3.7 KB             | 33.1 KB           |

The attraction row is what the rule looks like when it is applied: `leanParkForAttractionShell`
narrows the park to the one ride being shown, and 36.3 KB became 3.7 KB. The calendar row was what
it looks like when nobody asked.

### A page that renders none of a thing must not ship it

The calendar page draws no attraction cards. Two things on that route read `park.attractions` at
all — `ParkTodayPanel`'s headliner rows and `useParkTileItems`, for the nav row's land count and
shortest-headliner hint. Between them they read twelve fields. The route was shipping twenty-two,
for forty rides:

    bestVisitTimes   9.74 KB    ropeDrop  4.52 KB    comparison + baseline + trend   1.4 KB
    statistics       5.07 KB

`leanParkForCalendarShell` takes the attraction list from **39.3 KB to 15.2 KB**: −28.6 KB of HTML
and **−1.52 KB brotli, −2.9 % of the page**, on the route with the highest origin-miss count in the
app.

Note the ratio. Brotli finds repeated JSON keys across forty near-identical objects and prices them
at almost nothing, so the raw figure flatters this change by 19×. **Judge these on the compressed
number** — the same lesson the flat message allowlist taught (10 KB of JSON, 2.3 KB after brotli).

`restaurants` is deliberately untouched and is the next 6.6 KB: `useParkTileItems` reads forty-six
full records for a `.length` and an `OPERATING` count. Projecting them means moving those two
numbers onto `ParkTileSource` (two call sites, two pages); inventing a `ParkRestaurant` with an
empty `name` to satisfy the type would put a lie one render away from a reader. **−0.95 KB brotli**
when somebody does it properly.

It is an **allow**-list, unlike its `delete`-chain siblings, because here the kept set is the short
one — and a field the API adds next month then stays out of this route by default instead of
joining the payload unannounced.

Nothing is lost that a visitor can reach. The five-minute poll still returns `statistics` and
`bestVisitTimes` (`leanParkForLivePoll`), and `mergeLiveParkSnapshot` lays them back over this
seed, which is also why trimming it cannot desync the two components sharing the `['park-live', …]`
key. `pnpm test:calendar-park-projection` drives the projection through the real readers
(`getStandbyWait`, `getAttractionDisplayStatus`, `isInSeason`) rather than a list of key names,
because a field dropped here that a component still reads does not throw — the row renders a dash
and nothing says so.

### Cost follows the URL count, not the visitor count

Twelve hours of production invocations, which is the table this audit should have started from:

| Route              | Invocations | Active CPU | Transfer out | Distinct URLs |
| ------------------ | ----------- | ---------- | ------------ | ------------- |
| Attraction         | 11 K        | 22 min     | 491 MB       | 42,756        |
| Wait-time calendar | 9.9 K       | 26 min     | 567 MB       | 27,984        |
| Park               | 1.7 K       | 3 min      | 101 MB       | 1,272         |

The park page is the one people visit and the cheapest of the three. Both routes above it are
`force-dynamic`, so every origin miss is a render, and a crawler walking a sitemap misses the CDN
once per URL per TTL. Divide the columns and the shape is unmistakable: each calendar URL is
fetched about **0.7 times a day** and each ride URL about **0.5** — a daily sweep, against a cache
that could never be warm for it.

That also bounds what this section can win. Trimming the payload moves transfer and a little CPU;
the number of _renders_ is set by the 71,000-URL crawl surface, and the only lever on that is a
product decision about the calendar's twenty-two-month span (212 parks × 22 months × 6 locales).
The span was chosen deliberately — see `PARK_CALENDAR_MONTH_SPAN` for what it already refuses —
so it is named here as the largest remaining cost item, not as a recommendation.

### Where the remaining weight is (server render)

**Translation namespaces are as coarse as their widest consumer.** `parks` is 15.1 KB and arrives
whole on all three routes, because 23 client components ask for `useTranslations('parks')`. A ride
page therefore pays 3.18 KB of `parks.calendarPage` for a page with no calendar, plus
`calendarView`, `bestDays`, `dayDetail` and `seasons`. Narrowing those call sites to the
sub-namespaces the routed map already supports (`parks.crowdLevels` and `parks.status` prove the
mechanism works) measured **−3.0 KB brotli, −5.7 %** on the highest-invocation route in the app.
Not done: next-intl answers a missing namespace by logging MISSING_MESSAGE and rendering the raw
key, so it is 23 chances to ship a visible one, and it wants `pnpm check:client-messages` green at
every step.

**Inline SVG: 51 KB per page, 112 elements**, many of them byte-identical repeats of the same
Lucide icon. A sprite would take most of it, at the cost of a second request and a rule about
which icons may be sprited.

### How to measure it

Not from the code — from the bytes, and on a **cache-busted** URL:

```bash
curl -sS -H 'Accept-Encoding: identity' "https://park.fan/de/…/wartezeiten-kalender/2026/10?cb=$RANDOM"
```

Then join the `self.__next_f.push([1,"…"])` string literals, JSON-parse the concatenation, size each
field, and brotli-diff before against after.

Two traps, both of which produced a wrong answer here first:

- **A/B inside one build.** Diffing a local render against a production one measures the deploy
  gap as well as the change — that read −3.2 KB where the truth was −1.52 KB. Take one HTML file,
  rebuild it twice from the same flight-payload pipeline (once with the fields restored, once
  without), and compare those two.
- **Both sides through the same re-chunking.** Comparing a rebuilt document against the original
  bytes measures your own serializer: the first attempt reported the trimmed page as _larger_.

A plain fetch returns whatever Cloudflare is holding, and a stale copy will lie to you in the
direction that makes you stop looking — a `cf-cache-status: HIT` park page showed `statistics` and
`bestVisitTimes` absent from its attractions, which reads exactly like a projection that is already
working. The fresh render of the same URL had both.

## Adding a field

The question is not "is this field useful" but "which of these is it":

1. **Rendered and volatile** → belongs in the live projection.
2. **Rendered and day-stable** → belongs in the server render, and the merge will carry it.
3. **Rendered and day-_scoped_** → the awkward one, and the one that shipped a bug. It looks like
   case 2, but "the server render carries it" is only true while something re-runs that render
   within the day. Put it in the `daily` half of the projection and make sure the park's cache tag
   is dropped when it changes.
4. **Not rendered** → leave it out. It costs its size on every poll of every open tab **and** in
   the HTML of every request for every URL of that route — the second one is usually the larger
   bill (see [the other copy](#the-other-copy-what-the-server-render-serializes)).

Run `node scripts/measure-api-calls.mjs` before and after for the requests, and weigh the RSC
payload for the render — both halves, because a field can be free in one and expensive in the
other. A new request on the park page needs a
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
