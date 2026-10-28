# Optimization decisions

The decision log of the cost track: one entry per accepted, rejected or deferred change, with the
measurement that decided it, oldest first. Read [the overview](README.md) first; add an entry here
for every cost change, and correct an old entry with a dated note rather than rewriting it.

Each entry names its lever (invocations, CPU per invocation, bytes per invocation, ISR writes,
build minutes), the files, the measurement, the cost shift it causes elsewhere, and what is still
open.

---

## 2026-09-01 — Baseline: the bill is a crawler sweep of the URL surface

Measured against production before any change; it replaced the phase plan of the original brief,
which assumed expensive renders serving people, fixable by slimming backend payloads and the
prerender matrix.

**Traffic** (`vercel logs`, two samples of 100 requests, 73 s and 102 s; ≈ 26–42 K requests per 12 h):

| Route class                                  | Share |
| -------------------------------------------- | ----: |
| `[park]/[attraction]` page                   |  38 % |
| `[park]/wait-time-calendar/[[...date]]` page |  36 % |
| `/api/nearby`                                |   6 % |
| `/api/parks/*`                               |   4 % |
| everything else                              |  16 % |

87 % of requests missed every cache (`x-vercel-cache: MISS`), 4 % `PRERENDER`, 3 % `HIT`. Locales:
`nl` 35 %, `en` 17 %, `it` 10 %, `fr` 10 %, `es` 8 %, `de` 6 %, on a German-first site. 57 % of paths
were unique within 102 s (a Dutch page for a Paris ferris wheel's May 2027 calendar, an Italian page
for a pony ride in Belgium). That is a crawl sweep, not an audience. User agents were not measured
(Vercel's log API does not expose them, Cloudflare sits in front); the attribution is an inference.

**Crawl surface** (live sitemaps): 42,912 ride URLs (7,152 × 6), 12,042 calendar URLs (2,007 × 6,
months out to 2027/8), 4,818 others, **59,772** in all. 1.5 M invocations a month over 59,772 URLs is
about 25 fetches per URL a month, one every ~29 h. A popular URL was a Cloudflare `HIT`
(`age: 39309`); the long tail cannot stay warm in a per-PoP cache.

**Cost model.** `invocations × 0.15 s` ≈ 62.5 CPU-hours a month and `invocations × 57 kB` ≈ 85 GB of
origin transfer each reconstruct their invoice line within ~15 %. So **cost = invocations × (CPU +
bytes)**, and a lever that does not reduce invocations, CPU per invocation or bytes per invocation
does not reduce spend.

**Per request.** Origin TTFB 79–96 ms (ride HTML), ~89 ms (park), 97–205 ms for RSC requests; the park
fetch comes from the Data Cache, so the billed ~150 ms is render, not waiting on the backend. Raw
HTML 409–502 kB (57–67 kB brotli), about 45 % of it RSC payload: 26–29 kB of route messages, 41.3 kB
of park `initialData` on the park page, the 15.8 kB `AmusementPark` JSON-LD a second time, 51 kB of
inline Lucide SVG.

**Rejected from the brief:** API payload slimming as the main lever (the backend is not on the
critical path); "precompute historical aggregates" (`summarizeCalendarMonth` does ≤ 31-element work);
restricting `generateStaticParams` (the ride route has had none since PR #147).

---

## 2026-09-01 — ACCEPTED: memoize `getParkByGeoPath` per request

**Lever:** CPU per invocation. **Files:** `lib/api/parks.ts`.

The hot routes called it twice per request (`generateMetadata` and the page). Next dedupes the
fetch but hands each caller its own `Response`, so the JSON parse and the park trims ran twice on
62–113 kB payloads, the second time for a `<title>`. Wrapped in React `cache()`; cross-request
caching stays `PARK_REVALIDATE`. **Cost shift:** none.

---

## 2026-09-01 — ACCEPTED: prewarm cron warms one locale, not six

**Lever:** invocations. **Files:** `app/api/cron/prewarm/route.ts`.

The cron rendered 213 parks × 6 locales every 6 h (~5,100 renders a day, ~10 % of invocations)
under a docblock that still described per-URL ISR shells, which PR #147 had removed. What it does
warm is the Data Cache entry behind `getParkByGeoPath`, keyed by the backend URL and shared by all
six locales. It now requests one URL per park in the default locale, once a day (`vercel.json`).
**Cost shift:** none.

---

## 2026-09-01 — ACCEPTED: calendar back span 12 → 3

**Lever:** invocations. **Files:** `lib/parks/calendar-segments.ts`, `scripts/test-calendar-month.mjs`.

`PARK_CALENDAR_MONTH_SPAN.back` is the one constant behind the route's range check, the month index
and the sitemap. The calendar sitemap held 2,007 URLs per locale, 74 % of them past months, on the
route that was 36 % of traffic; the backend warms `/calendar` only for −1…+3 months; and the span
was set to grow on its own as the archive filled (12,042 → ~17,200 URLs by January 2027).

|                                     | before | after |
| ----------------------------------- | -----: | ----: |
| past months per park in the sitemap |      7 |     2 |
| past calendar URLs, all locales     |  8,946 | 2,556 |
| removed now                         |        | 6,390 |

Forward stays at 12 months, trimmed per park by `scheduleCoverage`.

**Cost shift:** the removed URLs keep being crawled and answer 308 to the hub, and that redirect
carried a 71–82 kB uncompressed body, more than the page it replaced. Cloudflare has cached it since
2026-09-03 and the body was removed on 2026-09-21 (entry below).

**Follow-up, 2026-09-21 (PAR-368).** Orphaned calendar URLs, from the sitemaps and the wire: this
cut 6,300 (5 months × 210 parks × 6), the forward `scheduleCoverage` trim of 2026-08-28 about
10,560, back months listed before the archive began 5,088, **about 21,948** in all. Search
Console's 15,917 "page with redirect" fits inside that, so the cut is at most 40 % of it. Every month
rollover adds 210 × 6 = **1,260** new redirects, indefinitely. The calendar surface counted from the
live sitemap was 970 URLs per locale (5,820, 210 parks).

---

## 2026-09-01 — REJECTED, reopened 2026-09-02: the `parks` namespace on the ride route

**Lever:** bytes per invocation. The ride route ships the whole `parks` translation namespace
(17.6 KB raw) for four client components that read about 20 keys between them
(`attraction-history-day`, `attraction-history-grid`, `neighbor-holidays-marker`, `seasonal-badge`;
ask `analyzeRouteNamespaces().consumers`, not grep). Rejected on 2026-09-01 at an estimated ~3 KB
brotli (~2 GB a month) against a six-locale message migration.

Re-measured on 2026-09-02 on production HTML with brotli at **quality 4**, which reproduces the
wire body to within 226 B (quality 11 flatters every difference by ~20 %): **−5.7 to −5.9 KB per
ride page, −10.4 %, ~3.8 GB a month**, and the migration is four call sites moving twelve keys into
sub-namespaces (`parks.holidayContext.*`, `parks.seasonal.*`). Open; see
[the overview](README.md#open-levers).

---

## 2026-09-01 — REJECTED: the backend payload deletions

**Lever:** bytes and backend CPU. The audit named `statistics.history` (~230–260 kB per park), three
always-`null` statistics fields and `comparison`/`baseline` as dead weight. Measured against the live
park endpoint, none of them was in the payload (Europa-Park 109.1 kB, Phantasialand 60.2 kB); the
heavy parts were `restaurants` (14–16 %), `shows`, `queues` and `typicalWaits`. The `null` fields
are deliberate in the list view (`park-integration.service.ts`, "Expensive to calculate per-ride in
list") and computed on the attraction endpoint. The frontend trims the rest before a reader sees a
byte, so there is nothing to delete upstream.

Backend findings from the same audit, not scheduled and not re-checked since: `getParkStatistics()`'s
`history` is computed and read by no caller; `calculateParkOccupancy` runs twice per cache-miss
request; no N+1 in the attraction loop.

---

## 2026-09-01 — ACCEPTED: stale-while-revalidate on `/calendar` (backend)

**Lever:** latency. **Repo:** `v4.api.park.fan` (`5dcfb52`, `src/parks/parks.controller.ts`).

`/calendar` was its controller's only endpoint without SWR. The audit's "15–20 s cold" did not
reproduce; measured with unique `from`/`to` ranges the worst case was 2.75 s. Recorded as a latency
fix, not a saving. Superseded the next day by the calendar windows below.

---

## 2026-09-01 — ACCEPTED: the ISR clock, 5,032 → 657 regenerations a day

**Lever:** ISR writes and invocations. **Files:** `lib/api/cache-config.ts`, `lib/api/glossary-rides.ts`,
`lib/blog/park-resolver.ts`, `lib/api/analytics.ts`, `lib/api/ml.ts`, `components/home/hero-*.tsx`.

`prerender-manifest.json` showed 2,992 pages revalidating daily and 85 hourly, none by its own
choice: each inherited the shortest fetch `revalidate` it executed. The rule that came out of it is
[a `revalidate` at a call site is somebody else's page](../rules/a-revalidate-at-a-call-site-is-somebody-elses-page.md).

| Fetch                                                    | Was | Now     | Held                    |
| -------------------------------------------------------- | --- | ------- | ----------------------- |
| `CACHE_TTL.geo` / `.continents` (the layout's menu read) | 1 d | 7 d     | every prerendered page  |
| `glossary-rides`                                         | 1 d | 7 d     | 1,644 glossary pages    |
| `getGeoStructure(3600)` in `lib/blog/park-resolver.ts`   | 1 h | default | all 60 blog posts       |
| `getGlobalStats` / `getGeoLiveStats` (SSR seeds)         | 1 h | 7 d     | homepage, `/parks`      |
| `lib/api/ml.ts`                                          | 1 h | 1 d     | homepage and `/fancast` |

**5,032 → 1,076 → 657 regenerations a day (−86.9 %).** The week is safe because the backend already
pushes `geo`/`parks`/`attractions` tags on renames, merges and retirements; `glossary-rides` gained
the `attractions` tag, which is pushed. A newly ingested park reaches the menu and hubs up to a week
late. The hottest-parks heat banner was **removed** (owner's decision): it compared a live reading
with a threshold and had no client overlay, so it alone held the homepage to hourly.

Negative result: `export const revalidate = 604800` on the blog route moved no page; a fetch always
wins. What found the homepage's clock after four failed guesses was walking the route's import graph
and listing every reachable `revalidate` literal. Still inconsistent: `/api/glossary-term-ids` sets
`revalidate = 3600` while `next.config.ts` calls the list "immutable until the next deploy".

---

## 2026-09-02 — ACCEPTED: today reads the forecast, and the calendar may stand a day

**Lever:** invocations, transfer, correctness. **Repos:** both (`calendar.service.ts`,
`parks.controller.ts`, `park-metadata.processor.ts`; `park-calendar-grid.tsx`,
`park-calendar-day-detail.tsx`, `calendar-month-summary.ts`, `integrated-calendar.ts`,
`use-calendar-data.ts`, `app/api/parks/[...path]/route.ts`, `next.config.ts`).

`calendar.service.ts` overwrote today's `crowdLevel` with the live occupancy reading so the tile
matched the park header. It was the only value in the payload that moved every five minutes, so
every window above it was short, and through `best-days.service.ts` it reached a 26-hour snapshot and
server-rendered prose recommending "today" as a quiet day. The override is gone: the tile says what
the day was forecast to be, the header says what it is now, and the day dialog shows both on one
scale (`todayCrowdLevel` and `crowdLevel`).

| Layer                   | Before         | After                                        |
| ----------------------- | -------------- | -------------------------------------------- |
| Backend `/calendar`     | 900 / 1800 s   | 86400 s; 604800 s for a range wholly past    |
| Backend SWR             | 3600 s         | equal to the TTL, 1 h for a range with today |
| Proxy `/api/…/calendar` | `s-maxage` 300 | 86400 + 86400 SWR                            |
| SSR month summary       | 6 h, `parks`   | 24 h, `parks` + the park's own tag           |
| React Query             | 5 min          | 1 h (`CALENDAR_STALE_TIME_MS`)               |
| Month page / hub        | no window      | `CDN-Cache-Control` (later 7 days / 1 h)     |

What makes a longer window honest rather than wrong: `assembleFromMonthCaches` re-derives `isToday`
and `crowdLevel` against a fresh "today" (the month cache is read again tomorrow);
`sync-schedules-only` pushes the park's tag, because a schedule correction is the only thing that
changes a month within a day; and the month seed carries that per-park tag, since `parks` alone is
all-or-nothing. The hub stays at an hour because it renders the current month by the park's clock.

**Cost shift:** the saved bytes move to Cloudflare, and between deploys nothing can purge it.

---

## 2026-09-02 — REVIEW: the two largest levers are in the Cloudflare dashboard

Two parallel audits (calendar and ride route) with adversarial review, 87 proposals, measured
against production. The hypothesis that something made the HTML uncacheable was false: no
`Set-Cookie` (`proxy.ts` drops it), `Vary` only the RSC headers and `Accept-Encoding`, and Cloudflare
answered `HIT` to requests with cookies and with Googlebot's user agent. What it found instead:

1. **308s on expired month URLs were `BYPASS`**: the cache rule made 200s cacheable and not 308s.
   About 5,500 per 12 h, 36.7 % of calendar invocations and 388 MB, at 1.41× the bytes of the page
   they replaced. Fix: a status-code TTL for 308 and 301, one dashboard field. Done 2026-09-03.
2. **The ride route could never fill its cache**: a ~12 h edge TTL against a ~42 h crawl interval
   caps hits at 12/(12+42) = 22 %; 10 % measured. Fix: windows per path family. Done 2026-09-03.
3. **Every prerendered page was `cf-cache-status: DYNAMIC`**, because the rule covered only
   `/*/parks/*` (1,793 requests, 116 MB per 12 h of pure egress). Done 2026-09-03 with windows for
   every page.

The code levers it ranked are tracked in [the overview](README.md#open-levers).

**Rejected:**

- **ISR or on-demand revalidation instead of `force-dynamic`**: buys what the CDN buys, at
  ~1.5 M write units a day; the deploy cadence kills it.
- **An icon sprite**: as `<symbol>` + `<use>` it measured 419 B worse, not 7.5 KB better.
- **A lean ride-shell projection replacing the park payload**: multiplies the Data Cache entry by 34.
- **Folding `/stats/day` into the attraction detail**: different cadence and failure domain.
- **A `robots.txt` disallow on the month tail**: after levers 1–2 it was worth ~8 % for a permanent
  SEO loss; if the sweep is AI crawlers, blocking those costs no SEO.

---

## 2026-09-03 — ACCEPTED: `CDN-Cache-Control` for the whole `/*/parks/*` prefix, and the rule reads it

**Lever:** invocations and transfer (the precondition for the dashboard levers above).
**Files:** `next.config.ts`; Cloudflare dashboard.

The question was "we optimized and I see no improvement". None of the five changes of 2026-09-01/02
could move the CDN lines of the two expensive routes: the memoize shows in the Compute tab, the
prewarm warms the park route, the span cut acts on future crawls, the ISR clock touches only
prerendered pages, and SWR changes latency. A sample of 40 sitemap URLs per route read 10 % `HIT`
(rides) and 12 % (calendar).

Verified first that `CDN-Cache-Control` survives a dynamic page, Vercel and Cloudflare (calendar month
URL in production, two parks, two locales). It then went on every page under `/*/parks/*`, because a
rule switched to "use cache-control header if present" would stop caching any page there without one.
In the same round the Cloudflare rule became "Frontend cache" (no path matcher, `/api/` and `/admin/`
excluded, header-driven, status-code TTLs, serve-stale on), the `/_next` rule with Vary "Bypass
caching" was deleted (all 20 images of a ride page had been `BYPASS`), and windows were added for
every page outside `/parks/` too. Current config: [CDN caching](../architecture/cdn-caching.md).

| After the round, against production                      | Before                              | After            |
| -------------------------------------------------------- | ----------------------------------- | ---------------- |
| 308 on an expired month URL                              | `BYPASS`, 72,190 B from Vercel each | `HIT`            |
| 404                                                      | `MISS`                              | `HIT`            |
| Geo hubs                                                 | `DYNAMIC`                           | `HIT`            |
| Homepage, blog, feeds, glossary, guides, legal, sitemaps | `DYNAMIC`, no window                | `HIT`            |
| `/_next/image`                                           | `BYPASS`                            | `HIT` per format |

The ride window started at 48 h + 24 h SWR and was cut to 24 h + 1 h soon after, because the
oldest copy a reader gets is the sum (hit ceiling ~53 % → ~36 % at a 42 h crawl interval). The hit
rate moved over days, not hours: an entry turns into a hit only when its URL returns inside its
window. **Cost shift:** none at the origin; the browser still caches nothing.

---

## 2026-09-10 — ACCEPTED: the build's own profile, and the 124 s nobody had timed

**Lever:** Build CPU Minutes. **Files:** `scripts/generate-image-crops.mjs`,
`scripts/vercel-ignore-build.sh`, `vercel.json`.

Timed per step on 4 cores, cold vs warm (`.next/cache` restored): image crops 124 s / 0.16 s, the
other `prebuild` steps 8.6 s, Turbopack 46 / 1.5 s, `tsc` 52 / 7.6 s, prerendering 3,151 pages 154 s
either way. Vercel restores `.next/cache`, so compile and type-check were already warm in production.
The crops were not: freshness was an `mtime` check, a checkout stamps every file and the crops are
gitignored, so every Vercel build cut 426 identical files sequentially on one core.

Freshness is now a content hash (source bytes, focal point, geometry, sharp/libvips version) against a
copy in `.next/cache/image-crops`, pruned to the current sources, and the loop runs at
`cpus().length`. Full `pnpm build`, three runs from a Vercel-like state: **284.3 s → 165.6 s
(−41.8 %)**; the parallel loop alone gives 196.9 s, which is what a build with a new photo falls back
to. Not a KV store or Blob: 426 network objects per build to save a second of local copying.

The prerender phase is 92 % of a warm build and CPU-bound: `staticGenerationMaxConcurrency: 24`
measured slower than the default 8. Rejected: `mozjpeg: false` (miss path 44 → 11 s for +21 % image
bytes); narrowing `tsconfig` (all 995 checked files are app code). pnpm runs `prebuild` once.

`ignoreCommand` (`scripts/vercel-ignore-build.sh`) skips a build whose diff against
`VERCEL_GIT_PREVIOUS_SHA` touches only an anchored allowlist (`docs/`, `todo.md`, `CLAUDE.md`,
`.github/`), and builds whenever it cannot be sure. `content/blog/**`, `public/media/**` and
`messages/**` are deliberately absent: each feeds a generator. A skipped build that should have run
is silent (a published post stays invisible), a needless one costs minutes, so `pnpm test:ignore-build`
drives the real script against a throwaway repository for every input a build reads.

> **Superseded 2026-10-26:** the `[skip deploy]` merge-batch marker and its `git ls-remote` poll are
> gone; production builds start from a debounced deploy hook. See the 2026-10-26 entry and
> [deploys](../development/deploys.md).

---

## 2026-09-10 — ACCEPTED: the build prerendered 618 pages whose whole output is a redirect

**Lever:** Build CPU Minutes. **Files:** `app/[locale]/parks/[continent]/[country]/[city]/page.tsx`.

A single-park city 308s to its park, and `app/sitemap.ts` never listed one, but the route's
`generateStaticParams` built all of them: 103 of 145 cities, 618 of 870 city pages. It now applies the
same predicate (`city.parks.length > 1`, also `cityHasOwnPage()`); `dynamicParams` still renders and
308s an old URL on demand. 3,151 → 2,533 prerendered routes, 165.6 → 150.9 s (**−47 %** with the crop
fix). Change the predicate in all three places together.

Checked and rejected in the same audit: "the crop cache pushes `.next/cache` past Vercel's 1 GB cap"
(measured 461.9 MB) and "197 of 426 crops have no consumer" (all three ratios land in the park and
ride JSON-LD `image` through `buildStructuredImage`).

---

## 2026-09-21 — ACCEPTED: the bodyless 308, three weeks after it was deferred

**Lever:** origin transfer. **Files:** `proxy.ts`, `lib/parks/calendar-redirects.ts`,
`lib/parks/calendar-segments.ts`, `lib/utils/servable-route.ts`, the calendar page.

Deferred on 2026-09-01: a proxy-level month check looked like a second copy of the month rule, and
4 % of requests looked small. Both were wrong: the 308s were 36.7 % of calendar invocations, and
`lib/parks/calendar-redirects.ts` **imports** the rule (`PARK_CALENDAR_SEGMENTS`,
`isParkCalendarMonthInRange`, `currentParkCalendarMonth` …) from the module the route reads. The
park-dependent halves resolve without the API: the extreme timezones (`Etc/GMT+12`, `Etc/GMT-14`)
bracket every park's current month, and `scheduleCoverage.to` can only shorten the forward window, so
a month outside the widest window for every candidate is outside for every park; anything else falls
through to the route.

The body was the route's not-found page rendered through both layouts after the redirect was thrown
(77,152 B of it RSC payload), so it grew with the layout and applies to all 15 redirect call sites.
Measured on `next start`, same build twice: an out-of-window month **75,832 B → 66 B** (1,149×
smaller), status, `Location` and `CDN-Cache-Control` unchanged, in-window and malformed URLs
unchanged. A middleware `Location` must be absolute (`new URL(target, request.url)`); a bare path
answered 500. The other ten page-render redirects need an API lookup and stay in the render
([the rule](../rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md)).
**Cost shift:** none; invocations unchanged.

---

## 2026-09-28 — ACCEPTED: less CPU per render, fewer invocations for shared answers

**Lever:** CPU per invocation and invocations. **PR:** #637.

| Per render on the `force-dynamic` routes                   | Before     | After        |
| ---------------------------------------------------------- | ---------- | ------------ |
| Glossary matcher, per `parseGlossarySegments` call         | 453–550 µs | 16–19 µs     |
| Park trim, Europa-Park shell (`leanParkAtFetch`, one pass) | 638 µs     | 115 µs       |
| Shell + park-page trim                                     | 737 µs     | 171 µs       |
| Continents document: menu, city counts, slug index         | 2.0–2.3 ms | 0.19–0.29 ms |

The continents fetch still runs in every render (a TTL memo would drop the page's `revalidate` and
`geo` tag after the first render in a worker); the parsed document is reused while its ETag is
unchanged (`perContinentsDocument`). `initialRevalidateSeconds` was identical on all 2,655
prerendered routes. `/api/parks/near` and `/api/analytics/{ticker,realtime,geo-live}`, the same for
everybody, moved from `no-store` to a 60 s window. Failures stopped inheriting windows
([the rule](../rules/an-api-route-passes-only-slugs-upstream.md)).

---

## 2026-10-16 — ACCEPTED: one prerender worker per core, and the tag archives nobody indexes stay unbuilt

> **Corrected 2026-10-26.** The thin tags are not cached "with the same one-week window a built one
> gets": Vercel's ISR cache is per deployment, so each is rendered and written again after every
> deploy. See [2026-10-26](#2026-10-26--accepted-a-page-nobody-reads-back-renders-per-request-not-on-demand-isr).

**Lever:** Build CPU Minutes. **Files:** `next.config.ts`, `app/[locale]/blog/tag/[tag]/page.tsx`.

Vercel's builder has 2 cores and Next's `experimental.cpus` defaults to cores − 1, so one worker
rendered 3,692 pages (5.6–5.9 min, 77 % of the build). `experimental.cpus: availableParallelism()`
gives one worker per core; locally on two cores, 408 s → 277 s. `exportPagesInBatches` gives each
worker one contiguous slice, so more workers than cores only helped while all 270 posts sat in the
first slice.

720 of the 883 tag pages are below `TAG_INDEX_MIN_POSTS` (`noindex`, no sitemap). `generateStaticParams`
now lists only the indexable ones (`isIndexableTag`): 2,972 pages, **408 s → 247 s (−39 %)**, peak
memory 3.7 GB of 8.

Where prerender time goes: glossary terms 35 % (618 ms each), blog posts 23 % (2,434 ms), tags 19 %,
news 9 %. A profile puts most of it in React's Flight and Fizz renderers and 15 % in GC; of our code
only markdown (4.5 %) and `lib/blog/tags.ts` (1.9 %) show. A glossary page is 410 KB of HTML, 101 KB
of it the header, whose mega-menu is server-rendered for the link graph on purpose.

Checked and not done: `optimizeCss` (Pages Router only); `staticGenerationMaxConcurrency` above 8
(slower); `typescript.ignoreBuildErrors` (the build's `tsc` is the only type check, `checks.yml` runs
none); a larger builder (a billing setting; `cpus` would now use it).

---

## 2026-10-20 — ACCEPTED: the glossary renders on demand, and the media check asks all parks at once

> **Superseded 2026-10-26.** The term pages are now `force-dynamic`, not on-demand ISR: at about ten
> deploys a day each term URL was written again almost every time it was crawled (9.0K units written
> against 300 read in 12 hours). See [2026-10-26](#2026-10-26--accepted-a-page-nobody-reads-back-renders-per-request-not-on-demand-isr).

**Lever:** Build CPU Minutes. **Files:** `app/[locale]/glossary/[term]/page.tsx`,
`scripts/generate-media-manifest.mjs`.

The 1,644 glossary pages were 31 % of static generation (191 s of 3,014 pages on Vercel). Built per
deployment, they cost a render each whether or not anything asked. Building none: 3,014 → 1,370 pages,
static generation 45 → 31–32 s locally (−30 %; 2 workers on an M-series Mac, whose core is about 4×
a Vercel build core), `.next/server/app` 2.6 → 1.5 GB. The `.segments/`
prefetch files that double every page's RSC bytes are written unconditionally by Next 16.4.

`verifySlugs` in the media manifest read one park at a time from api.park.fan (7 s of `prebuild`
from Washington); every park is now in flight together (0.6 s locally, byte-identical output).

---

## 2026-10-23 — ACCEPTED: the MCP server reads the park from the Data Cache

**Lever:** CPU and upstream calls. **Files:** `lib/agents/mcp-tools.ts`, `lib/api/parks.ts`,
`lib/api/cache-config.ts`.

One client (`python-httpx`) POSTs `/api/mcp` four times every three minutes. Each
`get_park_wait_times` fetched the park `no-store` and parsed the whole payload (113 kB for
Europa-Park). It now reads the live projection held for `CACHE_TTL.agentPark` (300 s, the backend's
wait-time cycle) under the park's tag (`getParkByGeoPathForAgents`), and `get_park_best_days` reads the
page's tagged snapshot. **Open:** request records carry no body, so whether those calls are tool
calls or `initialize`/`tools/list` is unknown.

---

## 2026-10-26 — ACCEPTED: a page nobody reads back renders per request, not on-demand ISR

**Lever:** ISR write units (and build minutes). **Files:** `app/[locale]/glossary/[term]/page.tsx`,
`…/[park]/average-wait-times/page.tsx`, `…/[park]/with-kids/page.tsx`, `app/[locale]/blog/[slug]/page.tsx`,
`app/[locale]/news/[slug]/page.tsx`, `components/blog/blog-content.tsx`, `app/api/cron/indexnow/route.ts`,
`lib/blog/tags.ts`, `scripts/test-edge-windows.mjs`.

The 2026-10-16 and 2026-10-20 entries took pages out of the build on the assumption that an on-demand
render is cached like a built one. On Vercel it is cached for that deployment only, the site deployed
78 times from 19 to 26 October, and a long-tail URL is crawled about every two days, so nearly every
crawl rendered and wrote an entry nobody read. The measurement and the rule:
[an ISR route needs both halves](../rules/an-isr-route-needs-both-halves.md).

Glossary terms, `average-wait-times`, `with-kids`, blog posts and news posts are now `force-dynamic`
with no `generateStaticParams`, behind the one-day `CDN-Cache-Control` they already had. Post widgets
render inline instead of in `<Suspense fallback={null}>`, so a streamed widget cannot push the text
below it. `getParkWeatherNowcast` lost its caller-supplied window. IndexNow no longer submits the thin
tags (`listIndexableTags`). Locally: the build went from 1,535 to 965 pages; the 200, the 404 and the
cross-locale 308 all answer without `x-nextjs-cache`. **Cost shift:** a Cloudflare miss is a render
instead of an ISR read or a render plus write; one write unit costs about 112 ms of `iad1` Active CPU
or 6.7 invocations, and a warm glossary render took 52–68 ms. A `?utm_` variant or a client RSC
request is now a render too.

**Open:** read ISR → Routes → Units two days after the deploy; the five rows should be near 0 written.
The thin tags and the single-park cities are still on-demand ISR and are next.

---

## 2026-10-26 — ACCEPTED: production deploys wait in GitHub Actions, not in Vercel

**Lever:** Build CPU Minutes. **Files:** `vercel.json`, `.github/workflows/deploy-production.yml`,
`scripts/vercel-ignore-build.sh`, `scripts/test-vercel-ignore-build.mjs`.

Build CPU Minutes were the largest line (17 h, $3.58 of $11.59, 19–26 October), and merges from
different sessions minutes apart each built the site. A wait inside the Ignored Build Step costs
build minutes × cores, waiting included (and the `[skip deploy]` poll paid exactly that), so the wait
moved to GitHub Actions: `git.deploymentEnabled.main: false`, a workflow that sleeps
`DEPLOY_DEBOUNCE_MINUTES` (10) and calls a deploy hook, each push cancelling the waiting run. How it
works and how to deploy at once: [deploys](../development/deploys.md). **Cost shift:** every
production deploy, news included, goes out about ten minutes after the last merge unless the commit
says `[deploy now]`. **Open:** confirm the deploy hook creates a deployment while automatic Git
deployments are off for `main`; if not, revert the `git` block in `vercel.json`.
