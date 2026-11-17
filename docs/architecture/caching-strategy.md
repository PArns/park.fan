# Caching strategy

What the app caches itself: how each route renders, the Data Cache windows of the server fetches,
how invalidation reaches them, what an ISR write costs, and the browser's React Query cache. The
caches in front of the app (Vercel's CDN, Cloudflare, the deploy purge) are in
[CDN caching](cdn-caching.md); the API's own Redis and HTTP caching is the backend's
([backend caching strategy](https://github.com/PArns/v4.api.park.fan/blob/main/docs/architecture/caching-strategy.md)).

## The model

A server render carries **day-stable structure** (names, ride lists, schedules, FAQ figures,
structured data) read from the Vercel Data Cache. Every **"now" value** (status, wait times,
weather, today's crowd) is loaded in the browser and polled, and replaces the server's copy on
mount. So a cached page can be old without showing anything stale to a reader with JavaScript;
its age only matters to crawlers, no-JS readers and the first paint. The backend pushes cache
tags when data really changes, so the time-based windows can be long.

A baked live value is only safe while the page's window is shorter than the value's meaningful
lifetime. For "open / closed / N min" that is minutes, so it belongs in a client overlay. Example:
park and ride references in a blog post are resolved on the server (`lib/blog/park-resolver.ts`)
and overlaid in the browser (`lib/blog/use-blog-live.ts`, `lib/blog/live-overlay.ts`,
`components/blog/blog-{park,attraction}-card-live.tsx`) from two batch calls per park named:
`useRegionParks` and `useParkWaitTimes`, plus `useAttractionDetail` once a card is on screen.

## How each route renders

| Route                                                                                | Render                                     | Window                                                                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Park, ride, calendar (hub and months), `average-wait-times`, `with-kids`             | `force-dynamic`, no `generateStaticParams` | edge only (`CDN-Cache-Control`); structure from the Data Cache                                                    |
| Glossary term, blog post, news post                                                  | `force-dynamic`, no `generateStaticParams` | edge only, one day                                                                                                |
| Homepage                                                                             | ISR, `export const revalidate = 604800`    | seven days: every fetch it runs (`getGlobalStats`, `getGeoStructure`, the layout's `getGeoMenu`) is cached a week |
| `/parks`, continent, city                                                            | ISR, built by `generateStaticParams`       | seven days (`CACHE_TTL.geo` / `.continents`, `getGeoLiveStats`)                                                   |
| Country                                                                              | ISR, built                                 | one day (`getCountrySummary`, `CACHE_TTL.countrySummary`)                                                         |
| Blog and news listings, indexable tags, glossary index, guides, planner, legal pages | ISR, built                                 | the shortest fetch each executes                                                                                  |
| Thin (`noindex`) tag archives, single-park cities (a 308)                            | on-demand ISR (`dynamicParams`, not built) | per deployment; next candidates to move to `force-dynamic`                                                        |
| Search                                                                               | dynamic (`searchParams`)                   | `no-store`, never cached                                                                                          |

The windows above are derived from the code: a route's ISR window is the **shortest** `revalidate`
among the fetches it executes, and `export const revalidate` is only a default any shorter fetch
beats ([a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md)).
The proof is `initialRevalidateSeconds` per URL in `.next/prerender-manifest.json` after a build
(the build table's revalidate column shows the same). Why a page that nobody reads back renders
per request instead of on-demand ISR, and what a route that stays ISR needs:
[an ISR route needs both halves](../rules/an-isr-route-needs-both-halves.md).

## Data Cache windows

Server fetches cache through `fetch` with `next: { revalidate, tags }`. Windows live in `CACHE_TTL`
(`lib/api/cache-config.ts`) or in the fetcher's named constant
([the rule](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md)).

| Data                                   | Fetcher                                                  | Window                                  | Tags                            |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------- | ------------------------------- |
| Park structure (SSR seed)              | `getParkByGeoPath` (`lib/api/parks.ts`)                  | `PARK_REVALIDATE`, 1 day                | `parks`, `park:<geo path>`      |
| Attraction detail (SSR)                | `getAttractionByGeoPath`                                 | `ATTRACTION_REVALIDATE`, 1 day          | `attractions`                   |
| Geo structure, continents, header menu | `getGeoStructure`, `getContinents`, `getGeoMenu`         | `CACHE_TTL.geo` / `.continents`, 7 days | `geo`                           |
| URL enumeration (sitemaps, IndexNow)   | `getSitemapAttractions`, geo reads in sitemap code       | `CACHE_TTL.geoSitemap`, 1 day           | `geo`                           |
| Country summary                        | `getCountrySummary`                                      | `CACHE_TTL.countrySummary`, 1 day       | `geo`                           |
| Best-days snapshot                     | `getBestDaysCalendar` (`lib/api/integrated-calendar.ts`) | `BEST_DAYS_REVALIDATE`, 3 days          | `best-days:<slug>`              |
| Calendar month summary                 | `fetchCalendarMonth`                                     | `CALENDAR_MONTH_REVALIDATE`, 1 day      | `parks`, `park-calendar:<geo>`  |
| Historical stats, hourly profile       | `lib/api/stats.ts`                                       | `CACHE_TTL.stats`, 1 day                | `parks`                         |
| Nowcast seed                           | `getParkWeatherNowcast`                                  | `NOWCAST_SEED_TTL`, 1 hour              | `weather`                       |
| Global and per-continent counters      | `getGlobalStats`, `getGeoLiveStats` (SSR seed only)      | 7 days                                  | `analytics`                     |
| Ticker (admin only)                    | `getTickerData`                                          | 600 s                                   | `analytics`                     |
| ML dashboard and metrics history       | `getMLDashboard`, `getMLMetricsHistory`                  | 1 day (training runs daily)             | `ml`                            |
| Glossary ride lists                    | `lib/api/glossary-rides.ts`                              | 7 days                                  | `glossary-rides`, `attractions` |
| Popular parks, most-viewed parks       | `getPopularParks`, `getMostViewedParks` (API route only) | 1800 s / `CACHE_TTL.pageViews`          | `popular-parks`, `page-views`   |
| Live park for the MCP server           | `getParkByGeoPathForAgents`                              | `CACHE_TTL.agentPark`, 300 s            | as the park                     |

Uncached (`no-store`): search (`lib/api/search.ts`), the day plan (`lib/api/plan.ts`) and the
`*Fresh` fetchers behind the browser relays, whose only cache is their CDN window.

Windows that look short but match their data: `CACHE_TTL.geoSitemap` is the same geo structure as
`CACHE_TTL.geo`, asked for a day fresh because a sitemap is how a new park gets discovered (a page
shell may list last week's parks; a sitemap may not); `getCountrySummary` changes daily; the
ticker's 600 s pins no page, because its only consumer is `/admin/analytics`.

## Invalidation

`/api/revalidate` (POST, `REVALIDATE_SECRET`) takes `tags` and `paths`; `"expire": 0` makes the
next request wait for fresh data instead of being served the old copy once more (used for a park's
status flip and the forecast). The backend pushes `["geo", "parks", "attractions"]` on renames,
merges and retirements, `["parks", "attractions"]` on curated writes, a park's own tag when it opens
or closes, `best-days:<slug>` and `park-calendar:<geo>` after each forecast warmup, and a park's own
tag with `park-calendar:<geo>` after the schedule sync. A tag reaches the Data Cache and, where a
relay names it in `Vercel-Cache-Tag`, that relay's copy at Vercel's CDN; never Cloudflare
([routes the backend rings](cdn-caching.md#routes-the-backend-rings)). A newly ingested park gets no
`geo` push, so it reaches the menu and the hub lists up to a week late; its own page is live at
once. Contract: [backend integration](../api/backend-integration.md#on-demand-revalidation).

## One park-day on several surfaces

The calendar grid and its day dialog, „Prognose heute" with the best-days section, a month page's
summary and Parky's day tip all say how busy one park-day will be, often on one page. Each is cached
for its own window, so once the forecast warmup (twice a day, [the API's forecast
ring](https://github.com/PArns/v4.api.park.fan/blob/main/docs/architecture/caching-strategy.md#the-forecast-ring))
moves a day, a surface still on the old copy contradicts one already on the new. On 2026-11-15 a
visitor reported through Parky that the today panel and the day dialog named different levels for
the same day, and a tip written for the new level is hidden by `tipAgreesWithLevel` for as long as
the dialog beside it shows the old one.

So every surface built on the calendar or the best-days snapshot ends at the same ring: the backend
sends `best-days:<slug>` and `park-calendar:<geo>` (`parkCalendarCacheTag`,
`lib/api/integrated-calendar.ts`) for each rebuilt park in one call with `"expire": 0`, and again 16
minutes later. How far behind the ring a reader can still be:

| Surface                                               | Reads                                                                         | Behind the ring, at most                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Calendar grid, day dialog (also from the today panel) | `/api/parks/<geo>/calendar` (`useCalendarData`)                               | 70 min at Cloudflare (`FORECAST_WINDOW`), an hour more in a tab open across the ring             |
| „Prognose heute", best-days section, weekday hover    | `/api/parks/<geo>/best-days` (`useParkBestDaysCalendar`)                      | the same 70 min, 30 min more in an open tab                                                      |
| Best-days and the crowd FAQ in the first HTML         | `getBestDaysCalendarSeed`, Data Cache                                         | the page's edge window: 2 h on a park page and the calendar hub, 7 days 1 h on a month URL       |
| Month summary                                         | `getCalendarMonthSeed`, Data Cache                                            | the page's edge window, as above                                                                 |
| Parky's day tip                                       | `/api/parks/<geo>/parky-tip` (`PARKY_TIP_WINDOW`), keyed by the days it reads | 70 min at Cloudflare, an hour in the browser; today's tip an hour; „nothing to say" five minutes |

What can still differ, and for how long:

- **A relay against its neighbour, for up to 70 minutes after a ring.** Each relay's Cloudflare copy
  was filled at its own time, so in that hour one surface may already show the new level and the
  other the old. The tip guard hides a tip written for another level than the dialog shows for
  those minutes rather than showing it. At the API the tip is keyed by the status and level of every
  day its sentence reads, so a sentence naming a quieter neighbour is written again once that
  neighbour moves.
- **A month URL's summary against its grid, for up to a week.** The sentences are in the HTML, which
  Cloudflare and Vercel keep 7 days and an hour on a month URL ([edge windows](cdn-caching.md#edge-windows));
  the ring renews only the Data Cache entry the next render reads. On the hub, which shows the
  current month, it is two hours. A `Vercel-Cache-Tag` on the page and a Cloudflare purge by tag
  would close it; neither is built.
- **The day dialog's „bisher" on today, by up to about an hour.** `todayCrowdLevel` is the day so
  far when the copy was made, and nothing rings during the day, so it trails the live level by the
  copy's age. A calendar range holding the park's today is therefore kept half an hour at Vercel
  and half an hour at Cloudflare (`CALENDAR_TODAY_WINDOW`), not until the ring. The live „Andrang
  jetzt" in the today panel is the live poll's and is never compared with it
  ([crowd levels](../api/backend-integration.md#crowd-levels)). Parky's tip for today reads the same
  level with the same window (`PARKY_TIP_TODAY_WINDOW`), but the two copies are made at different
  moments, so for a while one can be newer than the other. The tip names the level it was written
  from (`todayCrowdLevel`), and `tipAgreesWithLevel` hides it where the dialog has another one for
  today, as it does for another forecast level: no „bisher ruhig" over „Heute bisher: hoch". The tip
  shows again once both copies name the same level, within the hour.
- **The trip planner and the region hubs, by up to about three hours.** `/api/trip-regions/…` reads
  through the Data Cache under `trip-region:<region>`, which the forecast warmup does not ring,
  for `CACHE_TTL.tripRegionData` (1 h) on top of the API's own hour (`trip-regions:calendar:v2`,
  not evicted by the warmup) and an hour at the edge; a URL nobody asked for in a day can be served
  once from its day of `stale-while-revalidate`.
- **`/plan/day` against the dialog's headliner forecast.** `/plan/day` is `no-store` here and 15
  minutes at the API; its minutes come from the hourly forecast, the dialog's from the daily one per
  headliner. They differ by model, not by cache, and no window can make them agree.

What a ring costs: for about 200 parks, 400 tags in eight POSTs, twice a day and again 16 minutes
later. Each `park-calendar:` tag ends the park's Data Cache entries (one month summary per month a
page rendered, at most the 13 the month index links) and its relay copies at Vercel: about five
month windows, one or two single days, one best-days snapshot and a tip per day and language asked,
in each Vercel region that served them, so on the order of 2,000 to 4,000 entries a ring. Only an
entry asked for again is refilled, once: a function call and one API read from Redis, 51 KB for a
month, 1.9 KB for a day, 14.8 KB for best-days ([API budget](api-budget.md)). That replaces the
refill the expiry used to cause once a day for the calendar and once an hour for best-days. The
hour at Cloudflare adds up to 24 refills a day per hot URL, each a hit at Vercel with no function
call: for 200 parks with three hot relay URLs in two Cloudflare tiers, about 29,000 edge requests
and at most 1 GB uncompressed a day. Not measured yet: read `x-vercel-cache` and `age` on a second
request after the next warmup's ring ([measuring](cdn-caching.md#measuring)).

## What an ISR write costs

Vercel bills an ISR write for every object it persists: one render stores HTML and RSC, billed in
compressed 8 KB units, and a `notFound()` or a redirect is stored the same way. Every deployment
has its own ISR cache, so an unbuilt page is written again after each deploy. Before giving a route
a static shell, price it:

```
writes/day ≈ locales × (86400 / revalidate) × (stored bytes / 8 KB) × share of URLs requested
```

Two past spikes, both from this formula:

- **Per-URL shells (June 2026).** Making park and ride pages static ISR (PR #118) turned on one
  write per URL × 6 locales across the catalog: 220–410K write units a day. PR #147 made them
  `force-dynamic` again. `cacheComponents` stays off for the same reason: under it a page with
  content in its first paint must prerender, and a prerendered param page is a write per URL.
- **A five-minute homepage shell (June 22 to July 2026).** About 600 KB per regeneration × 6
  locales × 288 windows a day, 45–100K units a day, and its `getGeoStructure(300)` pinned the blog,
  glossary and guide pages to five minutes as well. Fixed by moving every live figure into a client
  overlay and lengthening the windows.

Diagnose a spike with Observability → ISR → Routes in Units (written against read per route), the
`.next/prerender-manifest.json` diff, and `NEXT_PRIVATE_DEBUG_CACHE=1` on a local `next start`,
which logs every `FileSystemCache: set`. `pnpm probe:isr` (`scripts/isr-cache-probe.mjs`) classifies
`x-vercel-cache` per sampled URL; production challenges non-browser clients, so run it against a
local build or a preview.

## A negative cache may only hold a settled answer

`/api/parks/…/stats` caches a miss on purpose (`STATS_MISSING_CACHE`, an hour plus six of
stale-while-revalidate). That is right only for an answer that will not change inside the hour.
A fetcher must tell "the API answered, and the answer is no" (a 404 → `null`) from "we never got
an answer" (throw), and only the first may be cached. `getParkHistoricalStats` once returned `null`
for both, so a backend restart wider than its retry ladder (`RETRY_DELAYS_MS`, 0 / 1.5 / 3 / 5 s)
was stored at the edge as a fact about the park. A park with thin history is not a miss: the API
answers it with a 200. `pnpm test:stats-fetchers`.

The same at the pages: wrapping `getParkByGeoPath` in `catchNonFatal` turned a 500, a final 429 or
a timeout into `notFound()`, which Cloudflare holds for an hour and Search Console files as a 404.
The park-family pages call it bare (it already returns `null` only for the API's own 404), the geo
hubs use `nullOnNotFound` (`lib/api/client.ts`), and `catchNonFatal` is kept for content a page can
render without (a country summary, the homepage counters). `pnpm test:page-fetch-misses`.

## Browser cache (React Query)

- **Defaults** (`lib/providers.tsx`): `staleTime` and `gcTime` 5 minutes, no refetch on focus,
  one retry. The client comes from `createQueryClient()` (`lib/query-client.ts`), which keeps
  `gcTime: Infinity` on the server ([a server render arms no timer](../rules/a-server-render-arms-no-timer.md)).
- **Live polls** share `LIVE_POLL_QUERY_OPTIONS` (`lib/hooks/live-poll-options.ts`): a 5-minute
  `refetchInterval`, refetch on focus and reconnect, two retries, and a 15 s timeout per poll
  (`LIVE_POLL_TIMEOUT_MS`). `useLiveParkData` (key `['park-live', continent, country, city, park,
simState]`) passes the server render as `initialData` with `initialDataUpdatedAt: 0`, so the seed
  counts as stale and the first poll runs on mount. What the poll carries:
  [API budget per page](api-budget.md#the-live-poll-90-kb--40-kb).
- **Longer windows** where the data is slower: the calendar month (`CALENDAR_STALE_TIME_MS`, 1 hour),
  ride positions and figures (`staleTime: Infinity`, once per tab).

### A cached entry may only seed the question it answered

`useNearbyParks` seeds its query from `localStorage` (`nearby-parks-v3`) through `initialData` and
`initialDataUpdatedAt`, so `staleTime` applies to whatever it finds. An entry written by the IP
request (no coordinates; city-level at best) once seeded the GPS query that followed a location
grant, React Query called it fresh, and no coordinate request went out for five minutes: a visitor
at the Phantasialand gate got the generic homepage instead of the in-park hero. An entry may seed a
query only when both asked the same question; `sameLocationBasis` (`lib/nearby/nearby-cache.ts`)
compares them, in both directions. A reload inside the window still sends nothing, and
`placeholderData` still paints the previous result. `pnpm test:nearby-cache`.

### Offline: nothing is stored, by decision

A cold start without network shows the browser's error page on a park or ride page. Decided in
PAR-423: nothing gets built (gap G4 in [personas and scenarios](../product/personas-and-scenarios.md)).

- Park and ride pages answer `private, no-cache, no-store`, which nothing in this repo can replace
  ([CDN caching](cdn-caching.md#why-a-pages-window-is-cdn-cache-control)), so the browser keeps no
  HTML: back button, reload and a discarded tab all fail offline (checked in Chromium with
  `setOffline(true)`). A snapshot in IndexedDB would never be read, and could not fill the page
  anyway: `LiveParkSnapshot` is a projection, not the park.
- What would work: a network-first `fetch` listener in `public/sw.js` (navigation preload, every
  good response copied into Cache Storage, the copy served only on a network error). It never
  serves stale content online, so it survives a deploy and a purge. The price, which was not paid,
  is registering the worker for every park-page visitor (today it registers only after a push
  opt-in), giving it scope over the whole origin. If the question returns, measure TTFB with and
  without the worker first.

## Related

- [CDN caching](cdn-caching.md): Cloudflare and Vercel in front of the app, edge windows, the deploy purge
- [API budget per page](api-budget.md): what each request and payload carries
- [Optimization](../optimization/README.md): cost measurements and the decision log
