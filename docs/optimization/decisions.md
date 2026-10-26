# Optimization decisions

One entry per accepted or rejected change, with the measurement that justified it.
Baseline and method: [baseline-profile.md](./baseline-profile.md).

---

## 2026-09-01 — Phase 0 re-plan (ORCHESTRATOR)

**Decision: the phase plan in the brief is replaced.**

The brief assumed expensive renders serving human traffic, fixable by slimming backend
payloads (Phase 2) and shrinking the prerender matrix (Phase 4). Production logs say
otherwise: **74 % of invocations are two page routes, 87 % of requests miss every cache,
and the traffic is a crawler sweep of a 59,772-URL published surface** — Dutch 35 % vs
German 6 % on a German-first site, 57 % unique paths inside a 102-second window, requests
for a Paris ferris wheel's May 2027 calendar in Dutch.

Cost reconstructs as `invocations × (CPU + bytes)` to within 15 % of the bill. Invocations
are set by crawl volume against the URL surface, so any lever that does not reduce
invocations, CPU/invocation or bytes/invocation cannot reduce spend.

**Rejected outright, with reasons:**

| Brief item                                                                    | Why rejected                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-DIET as "the highest-leverage agent"                                      | The park fetch is served from Vercel's Data Cache, not the backend. Measured origin TTFB ~85 ms; backend cold latency is 0.45 s but almost never on the critical path. The billed ~150 ms is render, not wait. |
| "Precompute historical aggregates — the calendar recomputes them per request" | It does not. `summarizeCalendarMonth` does identical ≤31-element work for past and current months.                                                                                                             |
| Phase 4, restrict `generateStaticParams`                                      | The attraction route has had none since PR #147. Largest remaining generator is the glossary at ~1,644 paths — a rounding error on the build line.                                                             |
| "Reducing `generateStaticParams` moves Build CPU → ISR Writes"                | Already happened, in the opposite direction, in June 2026. See PR #118 → #147.                                                                                                                                 |

**Kept from the brief:** the cost-shifting discipline, one-lever-per-PR, and the Verifier's
48 h measurement rule.

---

## 2026-09-01 — ACCEPTED: memoize `getParkByGeoPath` per request

**Lever:** CPU/invocation. **Files:** `lib/api/parks.ts`.

All three hot routes call `getParkByGeoPath` twice per request — once in
`generateMetadata`, once in the page body. Next's fetch dedupe covers the network but
hands each call site its own `Response` clone, so `response.json()`,
`withParkCoordinates()` and `leanParkForShell()`'s three full passes over
`attractions`/`shows`/`restaurants` ran twice, the second time to produce a `<title>`.

Measured payloads being parsed twice (live API, 2026-09-01):

| Park          | attractions |  raw JSON |
| ------------- | ----------: | --------: |
| Phantasialand |          40 |  61,804 B |
| Efteling      |          37 |  62,193 B |
| Europa-Park   |          96 | 112,927 B |

Wrapped in React `cache()`. Per-request only — cross-request caching is still
`PARK_REVALIDATE` (86400 s), unchanged.

**Verification:** `tsc --noEmit` clean, eslint clean, prettier clean,
`test:calendar`, `test:calendar-park-projection`, `test:live-park-counts`,
`test:calendar-month`, `test:content-changes` all pass.

**Cost-shift check:** none. No change to fetch count, cache windows, or bytes on the wire.

**Expected effect:** removes one full park parse + transform per request on the routes that
are 74 % of traffic. Not yet measured in production — pending 48 h.

---

## 2026-09-01 — ACCEPTED: prewarm cron warms one locale, not six

**Lever:** invocations. **Files:** `app/api/cron/prewarm/route.ts`.

The cron ran every 6 h over **213 parks × 6 locales = 1,278 URLs**, ~5,100 full
`force-dynamic` SSR renders per day ≈ **10 % of all production invocations**.

Its docblock described the pre-#147 world verbatim: _"Park & attraction pages are
on-demand ISR (statically rendered + edge-cached on first request) … This route fetches
those URLs once to populate the edge/ISR cache so real visitors get a HIT."_ Since PR #147
those pages are `force-dynamic`. There is no per-URL shell to populate.

What the run does still warm is the Data Cache entry behind `getParkByGeoPath` — and that
entry is **keyed by the backend URL, not the locale** (documented in `lib/api/parks.ts`),
so all six locales share one. Five of every six requests filled a cache entry that the
first had already filled.

Now one URL per park in `defaultLocale`. `localizedUrls` is untouched because
`api/cron/indexnow` legitimately needs all six.

**Verification:** as above — typecheck, lint, format, five test suites green.

**Cost-shift check:** none. No new writes, no new fetches; the backend sees the same 213
park requests it saw before.

**Expected effect:** 1,278 → 213 renders per run, ~5,100 → ~850/day. Roughly **−8 % of all
invocations** with no behavioural change. Pending 48 h confirmation.

---

## 2026-09-01 — DEFERRED: bodyless 308 for out-of-range calendar months

> **Superseded on 2026-09-21 (PAR-373)** — done, by the route this entry rejected. Read the entry
> at the end of this file for what changed about the reasoning: the month window did move into the
> proxy, and it is not a second copy of the rule. What stands here is the measurement.

**Measured:** any out-of-range month (`/wartezeiten-kalender/2025/3`, `/2030/1`) returns
`308` carrying a **71,238-byte, uncompressed `id="__next_error__"` HTML document** — no
`content-encoding`, byte-identical across URLs, plus a Cloudflare challenge script. 4 % of
sampled requests are 308s ≈ 60 K/month ≈ **4.3 GB/month** of egress for a response whose
only payload should be a `Location` header.

**Why deferred, not done.** The body is inherent to `permanentRedirect()` thrown from a
Server Component in a dynamic route. Next's own guide is explicit: _"If you'd like to
redirect before the render process, use `next.config.js` or Proxy"_
(`node_modules/next/dist/docs/01-app/02-guides/redirecting.md:87`). Doing that means
deciding the month window in `proxy.ts` — but the window depends on the park's
`scheduleCoverage.to` and its timezone, so a proxy-level check would be a **second copy of
the month rule, living where nothing renders it**. That is the exact failure mode
CLAUDE.md's agent-surface rule names.

Value at stake is a fraction of a percent of the transfer line. It is not worth a
duplicated routing rule.

**Better framing:** these 308s exist because the calendar sitemap published those months
and time moved on. Fixing the crawl surface (lever 1) removes the cause rather than the
symptom. Revisit there.

---

## 2026-09-01 — ACCEPTED: calendar back span 12 → 3

**Lever:** invocations. **Files:** `lib/parks/calendar-segments.ts`,
`scripts/test-calendar-month.mjs`.

`PARK_CALENDAR_MONTH_SPAN.back` is the single source for the three things that must agree
about how far back a calendar month URL may reach: the route's range check, the month
index, and the sitemap. One constant, so one edit.

Three measurements justified the cut:

1. The calendar sitemap held **2,007 URLs per locale, 1,491 of them (74 %) past months** —
   on the route that is 36 % of traffic, ~158 ms Active CPU and 553 MB egress per 12 h.
2. The backend warms `/calendar` for **−1…+3 months only**; outside that it costs **15–20 s
   cold against 0.4–0.9 s warm**. Every month advertised past −3 was a guaranteed cold
   path, 213 parks × 6 locales of them.
3. The number was set to grow on its own. `parkCalendarMonthsBack` is capped by this span
   but limited by the archive, and on 2026-09-01 only 8 of 12 months existed. At the
   January 2027 saturation the calendar surface would have gone **12,042 → ~17,200 URLs**
   with no edit.

Forward stays at 12 — that half is the planning surface and is already trimmed per park by
`scheduleCoverage`.

**Measured effect** (verified by running the real functions against the live clock):

|                                     | before |                      after |
| ----------------------------------- | -----: | -------------------------: |
| `parkCalendarMonthsBack(2026-09)`   |      8 |                          3 |
| past months per park in the sitemap |      7 |                          2 |
| past calendar URLs, all locales     |  8,946 |                      2,556 |
| **removed now**                     |        |             **6,390 URLs** |
| avoided at Jan-2027 saturation      | 14,058 | 2,556 → **11,502 avoided** |

**Verification:** eslint, prettier, full `pnpm build` (exit 0), and
`test:calendar-month`, `test:calendar`, `test:content-changes`,
`test:calendar-park-projection`, `test:live-park-counts`, `test:opening-hours-schema`,
`test:holiday-names` all pass. Three tests in `test-calendar-month.mjs` had the old span in
their **premise**, not just their expected value — they read `parkCalendarMonthsBack` at
months where the archive floor was the binding constraint, which a span of 3 makes untrue.
They were re-anchored to months where each still proves its own property, and stay
parameterized on the constant.

**Cost-shift check — one, and it is real.** The 6,390 removed URLs do not stop being
requested the moment they leave the sitemap. They now resolve to the hub with a `308`
(`permanentRedirect`), and that redirect carries the **71 kB uncompressed `__next_error__`
body** documented in the deferred entry above. Per request that is _more_ bytes than the 200
it replaces (71 kB uncompressed vs ~57 kB brotli), against lower CPU (the redirect fires
before the heavy render). At ~25 fetches/URL/month that is roughly **+2 GB/month during the
decay**, falling to zero as crawlers drop the URLs.

Net still clearly negative on spend — the requests end, the renders end with them, and the
January growth never happens. But it raises the value of the deferred bodyless-308 work
by roughly 3x for as long as the decay runs — still small in absolute terms. Worth revisiting
now rather than later.

**Follow-up measurement, 2026-09-21 (PAR-368).** Three weeks later, against production: the
orphaned months still answer `308` and the body has grown to **81,963 B** uncompressed with no
`content-encoding` (+13.5 % on the 72,235 B measured on 2026-09-03) — but the cost shift this
entry worried about was paid off two days after it was written: the round of 2026-09-03 put a
`cdn-cache-control` on the redirect and moved the Cache Rule onto it, and the 308 has been a
Cloudflare `HIT` since. Re-verified here (`MISS` on the first fetch of a fresh month URL, `HIT`
with a growing `age` after), so the "+2 GB/month during the decay" above stopped describing the
bill on 2026-09-03 rather than today.

The decay itself cannot be read from outside — Cloudflare Path Analytics and GSC are the only
sources for the request volume, and neither is reachable from a runner. The population is, and
it is the part that changes the reading:

|                                             |        URLs | how it was counted                                                             |
| ------------------------------------------- | ----------: | ------------------------------------------------------------------------------ |
| this cut, months 2026-01…2026-05            |       6,300 | 5 × 210 parks × 6, boundary checked on the wire (2026-05 → 308, 2026-06 → 200) |
| forward `scheduleCoverage` trim, 2026-08-28 |     ~10,560 | (11 × 210 − 550) × 6, from the live sitemaps                                   |
| back months before the archive starts       |       5,088 | 4 × 212 × 6, listed on 2026-08-27 and dead on arrival                          |
|                                             | **~21,948** |                                                                                |

Two things the table does not say on its own. The 6,300 uses 210 parks where the 6,390 above
uses 213: the catalogue shrank by three in three weeks, and every figure here is only as current
as its park count. And the forward row is today's untrimmed window minus today's listing, not a
diff against the 2026-08-27 listing — the two windows are offset by a month, so up to 1,260 of
it (2027-08) was never listed. That row is an estimate with a ±1-month edge, not a count.

**GSC's 15,917 "page with redirect"** comes from the coverage report quoted in PAR-368. It was
not measured here and carries that report's date, not this one's. It fits inside the calendar's
~21,948 without needing a second source, so the cut is **at most 40 % of it**. A proportional
reading gives 29 %, but that assumes Google drew its redirects evenly from the population, which
nothing here shows and the city hubs (which also 308) argue against — 40 % is the number with a
reason behind it.

The one thing that is not a transition: every month boundary drops one more month out of the
three, which is 210 × 6 = **1,260 fresh redirects per rollover**, indefinitely.

---

## 2026-09-01 — REJECTED: drop the `parks` namespace from the attraction route

**Proposed lever:** bytes. **Rejected before implementation.**

The claim was that `SeasonalBadge` pulls the whole 17,638 B `parks` namespace onto
the highest-invocation route for six keys. The six keys are real (185 B of 121 top-level
keys), but `SeasonalBadge` is not the only consumer. Asking the generator's own analyzer
(`analyzeRouteNamespaces().consumers`) rather than grepping:

```
/parks/…/[attraction] — 'parks' <- 4 files
    components/parks/attraction-history-day.tsx
    components/parks/attraction-history-grid.tsx
    components/parks/neighbor-holidays-marker.tsx
    components/parks/seasonal-badge.tsx
```

Fixing one changes nothing; the namespace only leaves the route when all four stop reading
the root. All four read small static key sets (~20 keys combined), so it is doable — by
restructuring `messages/*.json` across six locales.

**Why it was rejected anyway.** ~16.5 kB raw, but the payload is brotli'd on the wire and
translation JSON compresses extremely well: ~3 kB actual. At ~660 K attraction requests per
month that is **~2 GB**, against a six-locale message migration guarded
by `validate:translations`. CLAUDE.md already records this exact trap: "the old flat
allowlist looked like it saved 10 KB of JSON and was worth 2.3 KB after brotli."

Not worth the risk. Revisit only if the messages are being restructured for another reason.

---

## 2026-09-01 — REJECTED: the backend payload deletions

**Proposed lever:** bytes + backend CPU. **Rejected — the premise does not hold.**

The API-DIET audit named `statistics.history` as "the biggest payload driver, ~230–260 kB
for a 40-attraction park", three always-`null` statistics fields as free to delete, and
`comparison`/`baseline` as shipped-but-never-rendered.

Measured against the live endpoint instead:

| Component                 | Europa-Park (109.1 kB, 96 attractions) | Phantasialand (60.2 kB, 40) |
| ------------------------- | -------------------------------------: | --------------------------: |
| `statistics.history`      |                                **0 B** |                     **0 B** |
| `statistics` (rest)       |                                **0 B** |                     **0 B** |
| the three null fields     |                                **0 B** |                     **0 B** |
| `comparison` / `baseline` |                                **0 B** |                     **0 B** |
| `restaurants`             |                       15.3 kB (14.0 %) |             9.5 kB (15.8 %) |
| `shows`                   |                       13.7 kB (12.6 %) |                      1.2 kB |
| `queues`                  |                         9.4 kB (8.6 %) |                      3.8 kB |
| `typicalWaits`            |                         7.7 kB (7.1 %) |             7.7 kB (12.9 %) |
| `schedule`                |                                 6.6 kB |                      4.7 kB |
| `rideProfile`             |                                 5.7 kB |                      4.3 kB |

None of the named fields are in this payload at all. Two further corrections: the three
`null` fields are deliberate (`park-integration.service.ts`, "Expensive to calculate
per-ride in list") and the **attraction** endpoint does compute them, so deleting them from
the shared DTO would break it.

**What is actually heavy** is `restaurants` (14–16 %) — which the calendar profiler
independently found is carried into three Client Components for a `.length`. That is the
real thread, and it is a frontend projection question, not a backend deletion.

---

## 2026-09-01 — ACCEPTED: stale-while-revalidate on `/calendar`

**Lever:** latency (and origin load). **Repo:** `v4.api.park.fan`, commit `5dcfb52`.
**Files:** `src/parks/parks.controller.ts`, new `parks.controller.calendar-cache.spec.ts`.

`/calendar` was the only endpoint on its controller without an SWR directive — confirmed
live: it answered `public, max-age=900, s-maxage=900` while `/best-days` answered
`public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`.

**Correction to the audit.** It called `/calendar` "the worst latency in the whole system,
15–20 s cold". That does not reproduce. The first attempt to measure it was invalid — the
endpoint takes `from`/`to`, not `month`, so three requests silently fetched one default
range. Measured properly with unique ranges:

| Park          | Range     |       TTFB |
| ------------- | --------- | ---------: |
| Phantasialand | in window |     0.14 s |
| Phantasialand | −1 month  | **2.75 s** |
| Phantasialand | −4 months |     0.47 s |
| Phantasialand | −7 months |     0.91 s |
| Phantasialand | +6 months |     1.23 s |
| Vulcania      | −7 months |     0.33 s |

Worst case 2.75 s, not 15–20 s. The change is still correct — an expiry without SWR hands
whoever asks first a rebuild of up to ~3 s — but it is a latency fix, not a large cost
lever. Recorded as such rather than claimed as a saving.

An hour of SWR, not best-days' 86400: that endpoint is a materialized snapshot of a fixed
window, while a `/calendar` range can include today.

**Left open, found while measuring:** the slowest range measured sits **inside** the −1…+3
window `cache-warmup.service.ts:179` already warms. The month cache appears to be keyed by
month while an arbitrary `from`/`to` range misses it. Not addressed.

**Verification:** full backend suite 1,275 passed / 11 skipped across 126 suites, eslint,
prettier, `nest build` clean. Three new tests pin the header on both max-age branches.

---

## 2026-09-01 — ACCEPTED: the ISR clock, 5,032 → 1,076 regenerations/day

**Lever:** ISR writes + invocations. **Files:** `lib/api/cache-config.ts`,
`lib/api/glossary-rides.ts`, `lib/blog/park-resolver.ts`, `lib/api/weather-nowcast.ts`,
`components/blog/blog-weather-widget.tsx`.

The build's `prerender-manifest.json` showed **2,992 pages revalidating every 86,400 s** and
85 hourly. Each regeneration is an ISR write _and_ a full SSR render, so this sat behind
both the ISR line and a slice of invocations.

None of those pages set `revalidate` themselves. Every one of them inherited it, because
Next takes the **shortest** revalidate among a route's fetches. Three fetches were setting
the clock for the whole site:

| Fetch                                                                                | Was   | Now     | Reached                                                                    |
| ------------------------------------------------------------------------------------ | ----- | ------- | -------------------------------------------------------------------------- |
| `CACHE_TTL.geo` / `.continents` — `getGeoMenu()` is awaited in the locale **layout** | 86400 | 604800  | every prerendered page, incl. 222 blog tag pages that fetch nothing at all |
| `glossary-rides`                                                                     | 86400 | 604800  | 1,644 glossary term pages (55 % of all daily regenerations)                |
| `getGeoStructure(3600)`, hard-coded in `lib/blog/park-resolver.ts`                   | 3600  | default | all 60 blog posts, via the `ref:` links in each                            |

**Measured, manifest before vs after:**

| revalidate | before | after |
| ---------- | -----: | ----: |
| 604800     |      0 | 2,844 |
| 86400      |  2,992 |   214 |
| 3600       |     85 |    19 |
| false      |     32 |    32 |

**Regenerations/day 5,032 → 1,076, −78.6 %.**

**Why a longer window is safe here.** These are not clocks against nothing — the backend
already pushes `revalidateTag`. `park-rename`, `park-merge`, `attraction-merge` and
`attraction-retirement` all POST `["geo", "parks", "attractions"]`; `admin-curation` posts
`["parks", "attractions"]` on every curated write. The one gap found: **`glossary-rides` is
a tag no backend service has ever pushed**, so that fetch now carries `attractions`
alongside it — a tag that is pushed, and a ride profile changing is exactly an attraction
write. The residual exposure is a newly _ingested_ park, which nothing pushes `geo` for:
it now reaches the nav menu and hub lists up to a week late. Its own page is
`force-dynamic` and live immediately.

**A negative result worth keeping.** `export const revalidate = 604800` was added to the
blog post route first and the manifest did not move a single page. A fetch always wins over
the route declaration. The export was removed again rather than left in place looking as
though it did the work.

**Cost-shift check:** none. Fewer writes, fewer renders, no new fetches, no larger payloads.

**Verification:** `pnpm release:check` green (lint, format, 1,434 translation keys, client
messages, glossary slugs, glossary content hash), `check:blog-slugs` (2,544 references),
five test suites, and three full production builds with the manifest diffed each time.

**Where it stops.** The 19 pages still hourly are the homepage, `/fancast` and `/parks`
(× 6 locales) plus one API route — live global counters, the ML dashboard and the hottest-parks
band. All five of those sections are Server Components that fetch; none seeds a polling client
query. Moving them client-side is right in principle and is a refactor of the most
CLS-sensitive page in the app, guarded by the height-reservation rule, for ~456
regenerations/day. Left as its own piece of work.

---

## 2026-09-01 — ACCEPTED: the last hourly shells, 1,076 → 657 regenerations/day

**Lever:** ISR writes + invocations. Continues the entry above; cumulative **5,032 → 657/day,
−86.9 %**.

After the first pass, 19 prerendered pages were still hourly: the homepage, `/parks` and
`/fancast` × 6 locales. All three bake live figures. Three of the four sources turned out to
be seeds with a client overlay that already existed, and the helpers said so themselves —
`getGlobalStats` and `getGeoLiveStats` are documented "Only an SSR SEED", refreshed on mount
by `useGlobalStats` / `useGeoLiveStats` through no-store proxies on a 5-minute poll. Both
defaults went to a week, and two call sites (`hero-stats`, `hero-world-panel`) were passing
`3600` explicitly, overriding the default in the same way `park-resolver` did.

**`lib/api/ml.ts`: 3600 → 86400.** Its own docstring read "Changes only on model retraining
(daily at 06:00 UTC); cached 1h … anything lower would pin the homepage shell's ISR window
below its 3600s" — which had the dependency backwards. `MLStatsSection` reaches the homepage
through the AI story chapter, so this fetch _was_ the homepage's window. It held 12 pages to
24 rebuilds a day for a figure that changes once. The new window is the data's actual cadence,
not a floor.

**Removed: the hottest-parks heat banner** (`components/home/hottest-parks-section.tsx`,
`lib/api/weather-hottest.ts`). It was the one homepage section with no client overlay: it
compares a live weather reading against a heat threshold, where a stale value is wrong rather
than merely old, so it alone held the page to hourly. It rendered nothing outside a real heat
wave — which is most of the year — and `HeatWarningBadge` stays, because the park pages use it.
Recoverable from git if a summer wants it back with an overlay of its own. **This is a
user-visible feature removal, decided by the owner, not a refactor side effect.**

|                     |        before |       after |
| ------------------- | ------------: | ----------: |
| homepage (× 6)      |       144/day |       6/day |
| `/fancast` (× 6)    |       144/day |       6/day |
| `/parks` (× 6)      |       144/day |      ~1/day |
| **all prerendered** | **1,076/day** | **657/day** |

One route is still hourly: `/api/glossary-term-ids`, which `next.config.ts` describes as
"immutable until the next deploy" while the route itself sets 3600. 24 regenerations/day —
left alone, noted as an inconsistency.

**Method note.** Four rounds of guessing which fetch set the homepage's clock all missed. What
found it was walking the route's import graph (213 files) and listing every literal
`revalidate` reachable from it. That is the tool for this question; grepping component by
component is not.

**Verification:** `pnpm release:check` green, seven test suites, five production builds with
the manifest diffed each time.

---

## Open — needs a decision, not a refactor

1. **Crawl surface (largest lever).** 42,912 attraction URLs + 12,042 calendar URLs,
   the latter running out to 2027/8. Capping calendar months at +3 takes 12,042 → ~4,300.
   Narrowing the 6-locale × 7,152-ride matrix is the bigger half. Both are SEO decisions.
2. **Bot management.** Some Vercel Firewall rules are already defined; whether any are
   active is a dashboard question, not a repo one.
   The user-agent split that Vercel's log API cannot give us is available in **Cloudflare's
   AI Crawl Control** (present in the dashboard sidebar). That is where the inference in
   baseline-profile.md §1 gets confirmed or corrected, and it must happen before any rule
   is enabled.

3. **Cache Reserve.** Smart Tiered Cache is confirmed **Active** (Cloudflare dashboard, park.fan,
   2026-09-01), so the "long tail diluted across PoPs" half of the
   miss-rate story is already mitigated and is NOT the remaining problem — the 87 % miss
   persists with it on. What tiering does not do is stop eviction, which is Cache Reserve's
   job (R2-backed persistence). Volume is small: ~60 K pages × ~57 kB ≈ 3.4 GB of stored
   objects, against the ~85 GB/month of origin transfer it would displace.

## Backend findings parked for a later phase

From the API-DIET audit of `v4.api.park.fan` — real, but not on the critical path, so not
scheduled yet:

- Three fields (`typicalWaitThisHour`, `percentile95ThisHour`, `currentVsTypical`) are
  hard-coded `null` on every attraction on every request
  (`park-integration.service.ts:856-858`). Free to delete.
- `getParkStatistics()`'s `history` field is computed by a live query and read by **zero**
  callers (all four call sites checked).
- `calculateParkOccupancy` runs twice per cache-miss request
  (`park-integration.service.ts:1101`, `analytics.service.ts:1495`).
- `/calendar` is the worst latency in the system: **15–20 s cold** vs 0.4–0.9 s warm, and
  it is the one endpoint missing `stale-while-revalidate`. Warmup only covers −1…+3
  months, so every crawled month outside that window is a guaranteed cold path — which is
  precisely what the calendar sitemap publishes 12,042 URLs of.
- No N+1: the attraction loop is fully pre-batched, base park fetch is 4 queries.

> One correction to that audit: it estimated ~230–260 kB per park payload from `history[]`
> arrays. Direct measurement against the live API contradicts this — 61.8 kB for
> Phantasialand, 112.9 kB for Europa-Park. Use the measured numbers.

---

## 2026-09-02 — ACCEPTED: heute liest die Prognose, und der Kalender darf einen Tag stehen

**Hebel:** Invocations + Egress + Korrektheit. **Repos:** beide.
**Dateien:** `calendar.service.ts`, `parks.controller.ts`, `park-metadata.processor.ts`;
`park-calendar-grid.tsx`, `park-calendar-day-detail.tsx`, `calendar-month-summary.ts`,
`integrated-calendar.ts`, `use-calendar-data.ts`, `app/api/parks/[...path]/route.ts`,
`next.config.ts`.

Der Auslöser war ein Wunsch nach zwei Dingen, die sich als ein Ding herausgestellt haben.
`calendar.service.ts` überschrieb `crowdLevel` für **heute** mit dem Live-Occupancy-Spot-Reading
aus Redis, damit die Kalenderkachel zum Badge im Park-Header passt. Das war der einzige Wert im
Payload, der sich alle fünf Minuten bewegte — und deshalb die Zahl, an der jede TTL darüber hing:
15 min Backend-Header, 300 s Proxy, 6 h SSR-Seed, 5 min React Query.

Er blieb auch nicht im Kalender. `best-days.service.ts:158` baut seinen Snapshot aus
`buildCalendarResponse` und projiziert `crowdLevel` wörtlich, also reiste die Momentaufnahme in
einen Snapshot mit 26 h Redis-TTL und 72 h Next-Data-Cache — und von dort in servergerenderte
Prosa, die heute als kommenden ruhigen Tag empfahl, auf Basis einer Messung von dem Moment, in
dem der Warmup zufällig lief. Effektiv bis zu ~12 h alt (der Warmup läuft 08:00/20:00 UTC und
pusht danach `revalidateBestDays`), nicht 26 oder 72 — aber ein Spot-Reading gehört in keine
dieser Zahlen.

**Was geändert wurde**

| Schicht                    | vorher           | nachher                                        |
| -------------------------- | ---------------- | ---------------------------------------------- |
| Backend `/calendar` Header | 900 / 1800 s     | **86400 s**, 604800 s für reine Vergangenheit  |
| Backend SWR                | 3600 s           | = TTL, außer bei einem Bereich mit HEUTE (1 h) |
| Proxy `/api/…/calendar`    | s-maxage 300     | **86400** + 86400 SWR                          |
| SSR-Monatszusammenfassung  | 6 h, Tag `parks` | **24 h**, Tags `parks` **+ Per-Park-Tag**      |
| React Query                | 5 min            | **1 h**                                        |
| Seite selbst (Monats-URL)  | keine            | **`CDN-Cache-Control: s-maxage=86400`**        |
| Seite selbst (Hub)         | keine            | **`CDN-Cache-Control: s-maxage=3600`**         |

**Drei Dinge, die eine längere TTL erst ehrlich machen, und ohne die sie falsch statt alt wäre.**

1. `assembleFromMonthCaches` leitet `isToday` und `crowdLevel` jetzt gegen ein frisches „heute"
   neu ab. Der Cache ist nach **Monat** geschlüsselt, also wird der Eintrag des laufenden Monats
   morgen wieder gelesen, und jede tagesrelative Aussage darin ist dann einen Tag alt: `isToday`
   markierte gestern (es war das einzige Feld, das die Funktion nicht korrigierte, während vier
   Nachbarfelder daneben korrigiert wurden), und ein Tag, der beim Schreiben in der Zukunft lag,
   behielt seine Prognose, nachdem er vorbei war. Bei 15 min TTL war das schwer zu treffen, bei
   24 h ist es der Normalfall.
2. `sync-schedules-only` pusht jetzt den Per-Park-Tag. Eine Fahrplan-Korrektur ist das Einzige,
   was sich innerhalb eines Tages an einem Kalendermonat ändern kann; der Job leerte bisher
   seinen eigenen Redis-Cache und hörte auf. Der Kommentar im Controller, der 900 s mit „a
   day-old calendar would outlive the schedule corrections it is meant to show" begründete, hatte
   recht — solange die Korrektur keinen Weg zum Frontend hatte.
3. Der Monats-Seed trägt den Per-Park-Tag. `parks` allein ist alle 213 Parks oder keiner, und
   genau deshalb hat ihn nie jemand für die Korrektur eines einzelnen Parks gepusht.

**Der Hub bekommt eine Stunde, nicht einen Tag**, und das ist keine Vorsicht: er rendert den
**laufenden** Monat aus der Uhr des Parks (`page.tsx:236,295`) und datiert seine Zusammenfassung
gegen `getServerToday(tz)`. Am 1. Oktober lieferte ein 24-h-Hub das September-Raster unter einem
Titel, der September sagt — auf 1.278 URLs. Die 5.652 Monats-URLs tragen ihren Monat im Pfad und
haben diese Abhängigkeit nicht.

**Was der Leser verliert.** Die Kachel für heute kann jetzt „moderat" sagen, während der
Park-Header „hoch" zeigt — das war der Unterschied, den der Override 2026 beseitigt hat. Er kommt
zurück, weil die beiden verschiedene Fragen beantworten: die Kachel sagt, wofür der Tag
vorhergesagt war, der Header, wie es gerade ist. Der Tagesdialog stellt beide weiterhin
nebeneinander, jetzt aber auf einer Skala (`todayCrowdLevel` gegen `crowdLevel`, beides
Tagesaggregate) statt vorher auf zweien.

**`CDN-Cache-Control` ist kein dritter Versuch derselben Sache.** `next.config.ts` hält zwei
gescheiterte Produktionsexperimente fest und schließt mit „Do not try this again from here". Beide
setzten `Cache-Control` — den einen Key, den eine `force-dynamic`-Seite selbst schreibt. Was sie
gemessen haben, ist eine Kollision auf diesem Key, nicht die Unfähigkeit, einen Header zu setzen:
ihre eigene Kontrollbedingung sagt es („a marker header added to the same `source` arrived on the
park URL"). `CDN-Cache-Control` ist RFC 9213 und ein anderer Key. **Nach dem Deploy nachsehen:**
`curl -sI` auf eine Monats-URL, `cdn-cache-control` lesen. Fehlt er, wächst die Notiz um einen
dritten Eintrag. Die Cloudflare-Regel von „ignore cache-control, Edge TTL = N" auf „use
cache-control header if present" umzustellen ist ein separater, manueller Schritt und darf erst
danach passieren.

**Verifikation:** Backend `tsc`, eslint, prettier, `nest build`, 1.282 Tests in 126 Suites grün
(drei neue in `calendar.service.spec.ts` für die neu abgeleiteten Felder, drei neue in
`parks.controller.calendar-cache.spec.ts` für die drei Header-Zweige). Frontend `tsc`, eslint,
prettier, `pnpm release:check`, `pnpm build` (Exit 0, alle 12 Header-Regeln im
`routes-manifest.json`, Monat vor Hub), sechs Testsuiten. Ein Test in `test-calendar-month.mjs`
hatte den Override in seiner **Prämisse** — „today never competes: its crowdLevel is a live
reading" — und ist umgedreht statt angepasst.

**Kostenverschiebung, ausdrücklich:** die eingesparten Bytes verschwinden nicht, sie wandern zu
Cloudflare (Pauschale). Und ein 24-h-Cache an einer Schicht, die **niemand purgen kann**, ist
24 h echte Blindheit für alles, was nicht über einen Tag läuft.

---

## 2026-09-02 — Review-Ergebnis: die zwei größten Hebel liegen im Cloudflare-Dashboard

Zwei parallele Audits (Kalender/Gesamtbild und Ride-Route), je vier bis fünf Leser und sechs
Vorschlags-Perspektiven mit adversarialer Gegenprüfung, gegen Produktion gemessen am 2026-09-02.
87 Vorschläge, davon die folgenden mit Zahlen. **Kein Code-Hebel in diesem Repo kommt auch nur in
die Nähe der ersten beiden Punkte.**

### Gemessen, nicht vermutet

Die Hypothese, die diese ganze Zeile erklären sollte — irgendetwas macht die HTML-Antworten
uncachebar — ist **widerlegt**: keine `set-cookie` auf vier HTML-Antworten (`proxy.ts:39` löscht
sie), `Vary` sind ausschließlich die vier Next-RSC-Header plus `Accept-Encoding`, eine Anfrage mit
Cookies und eine mit Googlebot-UA antworteten beide `cf-cache-status: HIT`. Cloudflare **cacht**
die Kalender- und Ride-Seiten, trotz des `no-store` vom Origin.

Was stattdessen gemessen wurde, in Stichproben aus den echten Sitemaps:

|               | Stichprobe     | HIT-Quote       | max. `age` |
| ------------- | -------------- | --------------- | ---------- |
| Kalender-URLs | n=100          | **25 %**        | 41.989 s   |
| Ride-URLs     | n=30 bzw. n=40 | **10 % / 25 %** | 36.516 s   |

Daraus folgen die zwei Hebel.

**① Die 308 auf ausgelaufene Monats-URLs sind `cf-cache-status: BYPASS`** — auf allen sieben
geprüften. Cloudflares Cache-Rule macht 200 cachebar und 308 nicht, also ist **jeder Crawl einer
verwaisten Monats-URL für immer eine Vercel-Invocation**. Der Body ist 70.520 B **ohne
`content-encoding`** gegen gemessene 50.157 B brotli für eine echte Kalenderseite — der Redirect
kostet das **1,41-fache der Seite, die er verweigert**. Aus der Egress-Identität aufgelöst:
**~5.501 308er pro 12 h = 36,7 % der Kalender-Invocations** (Sensitivität 26–43 %), **388 MB/12 h
= 19,4 % der Transferzeile**. Unabhängig gestützt durch den Sprung der Route von 9,9 K auf 15 K
Invocations pro 12 h am Tag nach dem `back: 12 → 3`-Schnitt, der 6.390 URLs verwaist hat.

Das steht in diesem Dokument als **DEFERRED (2026-09-01, „bodyless 308")**, und alle drei Gründe
sind messbar falsch: die 4 % stammen aus einer Stichprobe **vor** dem Schnitt; „ein Bruchteil eines
Prozents der Transferzeile" sind gemessen 19,4 %; und der tragende Einwand — der Fix hieße eine
zweite Kopie der Monatsregel in `proxy.ts` — setzte voraus, dass ein bodyless Redirect der einzige
Fix ist. Ist er nicht. `BYPASS` auf 308 gegen `HIT` auf 200 bei gleichem Pfad heißt: die Antwort
ist **wegen ihres Statuscodes** uncachebar, und das sagt man einer Cache-Rule.
**→ Cloudflare → Cache Rules → die Parks-Regel → Edge TTL → Statuscode-TTL für 308 (und 301,
wegen der Stadt-Hubs) ergänzen.** Ein Dashboard-Feld, keine Zeile Code, kein dupliziertes Routing.
Sicher per Inspektion: alle sieben Proben lieferten ein byte-identisches, konstantes `Location` —
den Kalender-Hub des Parks. Erwartung: **−5.000 Invocations und −353 MB pro 12 h.**

**② Edge TTL und Tiered Cache.** Zwei Zahlen, die das Repo nicht beantworten kann und die die
Rangfolge von allem anderen entscheiden — beide read-only zu klären:

- **Läuft Tiered Cache?** `decisions.md` (2026-09-01) hält fest, Smart Tiered Cache sei aktiv und
  die 87 % Miss blieben. Die Messung heute sagt 75 % Miss auf dem Kalender, und alle ~~180 Proben
  kamen aus **einem** Colo (`cf-ray …-IAD`), also ist die Lücke zwischen 15.000 Misses/12 h und
  dem Boden eines global geteilten Caches (6.930/12 h) — Faktor 2,16 — mit Colo-Fragmentierung
  vereinbar, aber nicht bewiesen. **Test:** dieselbe kalte URL innerhalb einer Minute aus zwei
  Regionen abrufen. HIT beim zweiten aus einem anderen Colo = Tiered Cache an. MISS = aus, und
  dann ist der Toggle der größte verfügbare Einzelhebel (~~**−8.000 Invocations/12 h, −27 % der
  Site**), kostenlos.
- **Welches Edge TTL trägt die Regel?** Aus 25 HIT-Altern auf ≈12 h eingegrenzt, nicht abgelesen.
  Steht im Dashboard.

Ist beides geklärt, gehört das TTL **nach Pfadfamilie gespalten** statt einer Zahl für ganz
`/*/parks/*`: Monats-URLs 24 h (die App liefert den Header jetzt selbst), Hub ≤1 h, **Ride-Seiten
48–72 h**. Bei den Ride-Seiten liegt der Punkt genau dort: ihr Crawl-Intervall ist **42 h** und ihr
Edge TTL ~12 h, der Cache kann sich also **nie füllen** — die theoretische Obergrenze ist
12/(12+42) = 22 %, gemessen sind es 10 %. Bei 7 d wären es 80 % Decke; realistisch −43 % bis −78 %
der Route, **12,3–22,1 GB/Monat**. Der Preis ist ehrlich zu nennen: **nichts in beiden Repos kann
Cloudflare purgen**, also ist eine kuratierte Korrektur an einer Bahn so lange unsichtbar wie das
TTL läuft. Deshalb 48–72 h als erster Schritt und 7 d als Decke, nicht als Startwert.

**③ Jede prerenderte Seite ist `cf-cache-status: DYNAMIC`.** Die Cache-Rule deckt nur
`/*/parks/*`, also gehen Glossar, Blog, Startseite und Geo-Hubs bei **jedem** Request aus Vercel
raus — `x-vercel-cache: HIT`, aber die Bytes verlassen trotzdem Vercel. 1.793 Requests / 116 MB
pro 12 h. Keine Invocations (es läuft keine Funktion), reiner Egress: Decke **~7 GB/Monat**. Zu
holen sind davon realistisch nur Glossar und Blog, deren Inhalt sich nur beim Deploy ändert; die
Startseite hat ISR-Seeds und gehört auf ein kurzes TTL oder gar nicht hinein.

### Code-Hebel, nach Wert

1. **Das Ride-Shell-Payload braucht eine Allow-Liste, keine Delete-Kette.** `leanParkForShell`
   ist eine Delete-Kette und behält damit alles, was die API morgen ergänzt; 6 der 21 Felder, die
   sie ausliefert, liest niemand. Als Allow-Liste sind es 12 — dasselbe Muster wie
   `leanParkForCalendarShell`, das dort −2,9 % brotli gebracht hat. Achtung beim Naheliegenden:
   `typicalWaits` zu löschen spart **nichts**, weil der Flight es referenziert statt dupliziert.
2. **Der `parks`-Namespace auf der Ride-Route.** In diesem Dokument am 2026-09-01 abgelehnt, mit
   „~3 kB actual, ~2 GB/Monat". In situ nachgemessen, auf dem echten Produktions-HTML und mit
   Brotli **q4** (verifiziert als Produktionsniveau: q4 reproduziert den Wire-Body auf 226 B
   genau, q11 schmeichelt jeder Differenz um ~20 %): **−5.717 bis −5.861 B pro Invocation,
   −10,4 % der Seite, 3,77 GB/Monat.** Das ist 1,9× die abgelehnte Zahl. Und die Migration ist
   kleiner als gedacht: vier Aufrufstellen und zwölf Schlüssel in Sub-Namespaces
   (`parks.holidayContext.*`, `parks.seasonal.*`) — der Mechanismus, den `parks.crowdLevels` und
   `parks.status` schon vorführen —, nicht die 23 Aufrufstellen, mit denen CLAUDE.md die
   siteweite Variante bepreist. Trotzdem eine Sechs-Sprachen-Migration, also
   `pnpm check:client-messages` nach jedem Schritt.
3. **Der Day-Curve-Request ist auf ~92 % der Ride-Seiten eine garantierte 404.** Die Seite rendert
   `DailyWaitTimeChartClient` bedingungslos, also feuert `useRideDayCurve` immer — aber das
   Backend antwortet nur für Bahnen im Top-8-Stundenprofil des Parks (34 von 454 Bahnen über 14
   zufällige Parks = 7,5 %). Fix: ein `hasDayCurve`-Boolean auf der Attraction-Detail-Response,
   die die Seite ohnehin holt, gelesen aus dem **bestehenden** Redis-Eintrag — niemals aus einem
   Compute in der Response, das wäre wieder die Nowcast-im-Park-Fetch-Falle. Bis zu 920
   Invocations/12 h.
4. **`getGeoMenu()` parst 164 KB `/v1/discovery/continents` bei jedem Seitenaufruf der ganzen
   Site**, um 1.893 B Header-Navigation zu erzeugen. Eine Backend-Projektion, keine
   Frontend-Löschung. Der einzige CPU-Posten in diesem Audit, der über 2 ms liegt.
5. ~~**Der Sitemap-Varianten-Slug ist für 7 Bahnen invertiert:** `/v1/sitemap/attractions` listet
   `raven` **und** `raven-2`, `getAttractionPaths()` verwirft `raven-2`, weil die Basis existiert
   — aber das Park-Payload enthält nur `raven-2`. Verifiziert: `…/raven` → **404**, `…/raven-2` →
   **200**. Kostenmäßig belanglos (80 Invocations/Tag); es geht darum, dass 7 echte Ride-Seiten
   aus der Sitemap unerreichbar sind und an ihrer Stelle eine 404 im Index steht.~~ **Behoben
   (PAR-498, PAR-546):** das Backend listet je Name die Zeile, die das Payload serviert, und
   `getAttractionPaths()` filtert nicht mehr nach Slug; siehe `docs/seo/analysis.md` Punkt 8.
   **Weiter offen** ist der zweite Teil. Im selben
   Aufwasch: **7.029 der 7.126 Ride-URLs (98,6 %) tragen dasselbe `<lastmod>` 2026-08-28**, weil
   der erste Durchlauf von `diffSnapshot` jeden unbekannten Key mit „heute" stempelt — genau die
   Pathologie, gegen die der Docstring dieser Datei geschrieben ist.

### Ausdrücklich NICHT

- **ISR / On-Demand-Revalidation statt `force-dynamic`.** Kauft genau das, was der CDN kauft, und
  berechnet dafür ~1,5 M ISR-Write-Units pro Tag. Die Arithmetik, die es killt, ist die
  Deploy-Kadenz, nicht die Write-Größe.
- **Ein Icon-Sprite.** Gemessen als `<symbol>`+`<use>`: **419 B schlechter**, nicht 7,5 KB besser.
  Der Render-Cost-Leser hatte es als größten Einzelposten benannt; die Messung sagt das Gegenteil.
- **Die Backend-Payload-Löschungen** (`statistics.history`, die drei Null-Felder,
  `comparison`/`baseline`). Bleiben abgelehnt — aber die Begründung von 2026-09-01 ist falsch. Der
  richtige Grund ist, dass das Frontend sie ohnehin abschneidet, bevor ein Leser ein Byte sieht.
- **Ein `robots.txt`-Disallow auf den Monats-Tail.** Die Obergrenze wäre −42 % aller Invocations,
  aber sie hängt an der ungemessenen Annahme, dass Invocations der URL-Zahl folgen — was die
  Sitemap-Prioritäten (Hub 0.8, Monate 0.4–0.6) und die interne Verlinkung bestreiten. **Nach ①
  und ② fällt der inkrementelle Wert auf ~8 %** — bei identischem, dauerhaftem SEO-Verlust. Erst
  die Cache-Fragen klären. Und falls der Sweep AI-Crawler sind (Cloudflare AI Crawl Control), gibt
  es dieselbe Reduktion über `TRAINING_CRAWLERS` zu SEO-Kosten null.
- **Eine schlanke Ride-Shell-Projektion, die das ganze Park-Payload ersetzt.** Kostenverschiebung:
  multipliziert den Data-Cache-Eintrag mit 34.
- **`/stats/day` in die Attraction-Detail-Response falten.** Zwei Client-Requests für eine Bahn,
  aber unterschiedliche Kadenz und unterschiedliche Fehlerdomäne — der Fix ist Punkt 3 oben, nicht
  ein Merge.

### Offene Fragen, die nur eine Messung beantwortet

| Frage                                                | Wie                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Läuft Tiered Cache?                                  | Dieselbe kalte URL binnen einer Minute aus zwei Regionen; zweiter Abruf HIT aus anderem Colo = an |
| Welches Edge TTL trägt die Parks-Regel?              | Cloudflare → Caching → Cache Rules ablesen                                                        |
| Hub- vs. Monats-Anteil der 15 K Kalender-Invocations | Cloudflare Path Analytics                                                                         |
| User-Agent-Split des Sweeps                          | Cloudflare AI Crawl Control — entscheidet, ob ①–③ oder ein Crawler-Block der richtige Hebel ist   |
| Wie viele der 15 K sind 308er                        | Vercel-Logs nach Statuscode für die Kalender-Route                                                |
| Kommt `cdn-cache-control` auf der Monats-URL an?     | `curl -sI` nach dem Deploy — Voraussetzung für die Umstellung der Cloudflare-Regel                |

---

## 2026-09-03 — ACCEPTED: `CDN-Cache-Control` für den ganzen `/*/parks/*`-Präfix

**Hebel:** Voraussetzung für den Cloudflare-Hebel ② (Edge TTL nach Pfadfamilie).
**Dateien:** `next.config.ts`. **Stand und Einordnung:** [README.md](./README.md).

Anlass war die Frage „wir haben optimiert und ich sehe keine Verbesserung". Die Antwort ist,
dass keine der fünf Änderungen vom 01./02.09. auf die CDN-Zeile dieser beiden Routen zielen
konnte — die Aufschlüsselung steht im README. Zwei Messungen dazu, gegen Produktion:

| Stichprobe aus der echten Sitemap | n   | `cf-cache-status: HIT` |
| --------------------------------- | --- | ---------------------: |
| Ride-URLs                         | 40  |               **10 %** |
| Kalender-URLs                     | 40  |               **12 %** |

Neun von zehn Abrufen erreichen Vercel. Vercels eigenes Caching-Panel zeigt auf beiden Routen
100 % Miss, und das ist korrekt: beide sind `force-dynamic`, es gibt dort nichts zu treffen.
Cachen kann hier nur Cloudflare.

**Was hier verifiziert wurde, und es war die offene Frage aus dem Kommentar in dieser Datei:**
`CDN-Cache-Control` **wird geroutet**. Eine Kalender-Monats-URL in Produktion antwortet mit

```
cache-control:     private, no-cache, no-store, max-age=0, must-revalidate
cdn-cache-control: public, s-maxage=86400, stale-while-revalidate=86400
```

— der Header überlebt also die dynamische Seite, Vercels Edge und Cloudflare. Auf zwei Parks
und zwei Locales geprüft. Damit ist die Voraussetzung erfüllt, das Edge TTL aus dem Dashboard
in dieses Repo zu holen. **Er trug ihn nur auf dem Kalender**; Ride-, Park- und Geo-Hub-Seiten
hatten keine Regel.

**Warum das nicht nur eine Lücke war, sondern eine Falle.** Die Cloudflare-Regel matcht
`/*/parks/*`. Stellt man sie auf „use cache-control header if present" um, während ein Teil
dieses Präfix keinen Header trägt, fallen genau diese Seiten auf das `no-store` der Seite
zurück und werden **gar nicht** mehr gecacht. Der Präfix ist jetzt vollständig, gegen
`pnpm build && pnpm start` Pfad für Pfad abgefragt:

| Pfad                           |                 `s-maxage` |
| ------------------------------ | -------------------------: |
| Geo-Hubs (`/parks` … `/:city`) |                 3600 (1 h) |
| Park-Seite                     |                 3600 (1 h) |
| Ride-Seite                     |          **172800 (48 h)** |
| Kalender-Hub / -Monat          | 3600 / 86400 (unverändert) |
| `/de/blog`, `/api/*`           |                unverändert |

Die 48 h auf der Ride-Seite sind die Zahl, um die es geht: ihr Crawl-Intervall ist ~42 h, ihr
heutiges Edge TTL ~6–12 h (höchstes beobachtetes `age`: 24.191 s), also **kann sich der Cache
nie füllen** — Decke 22 %, gemessen 10 %. Bei 48 h steigt die Decke auf ~53 %. Der Preis ist
zu nennen: nichts in beiden Repos kann Cloudflare purgen, eine kuratierte Korrektur bleibt so
lange unsichtbar. Deshalb 48 h und nicht die 7 Tage, die technisch möglich wären.

Park-Seite und Geo-Hubs bekommen bewusst nur eine Stunde: der Backend-Tag-Push bei jedem
Statusflip (`parkCacheTag`) wäre unter einem langen Edge-Fenster wirkungslos.

**Wirkung heute: keine, und das ist beabsichtigt.** Die Cloudflare-Regel steht auf „ignore
cache-control header and use this TTL" und gewinnt. Bewiesen am 308 einer ausgelaufenen
Monats-URL: er trägt `cdn-cache-control: public, s-maxage=86400` und ist trotzdem
`cf-cache-status: BYPASS`. Diese Änderung ist die Voraussetzung, nicht der Hebel.

**Cost-shift check:** keiner. Keine zusätzlichen Fetches, keine ISR-Writes, keine geänderten
Bytes. `Cache-Control` bleibt unangetastet, der Browser des Lesers cacht also weiterhin nichts.

**Verification:** `pnpm build` zweimal grün, eslint und prettier sauber, und alle zehn Pfade
oben einzeln gegen `pnpm start` abgefragt — inklusive der beiden Negativproben (`/de/blog`
ohne Header, `/api/parks/live` unverändert bei 60 s) und der Kollisionsprobe, die zählt: der
Kalender-Hub hat dieselbe Segmentzahl wie eine Ride-URL und behält korrekt seine eigene
Stunde statt der 48 h.

**Offen, erst nach dem Deploy prüfbar:** ob Vercel die neuen Header genauso durchreicht wie
den des Kalenders. `curl -sI` auf eine Ride-URL. **Die Cloudflare-Regel darf nicht umgestellt
werden, bevor das bestätigt ist.**

---

## 2026-09-10 — ACCEPTED: the build's own profile, and the 124 s nobody had timed

**Lever:** Build CPU Minutes. **Files:** `scripts/generate-image-crops.mjs`,
`scripts/vercel-ignore-build.sh`, `vercel.json`.

`README.md` says of this line item: „Wer an dieser Zeile sparen will, deployt seltener — nicht
anders." That was never measured. Timed per step on a 4-core box, a production build is:

| phase                              |  cold | warm (`.next/cache` restored) |
| ---------------------------------- | ----: | ----------------------------: |
| `prebuild` — image crops           | 124 s |                        0.16 s |
| `prebuild` — the other seven steps | 8.6 s |                         8.6 s |
| Turbopack compile                  |  46 s |                         1.5 s |
| `tsc` type-check                   |  52 s |                         7.6 s |
| collect page data                  | 2.2 s |                         2.2 s |
| prerender 3,151 pages              | 154 s |                         154 s |
| finalize                           | 0.9 s |                         0.9 s |

Vercel restores `.next/cache` for a Next project with no configuration, and Next puts both the
Turbopack build cache and its own `.tsbuildinfo` in there, so the compile and the type-check are
already warm in production and needed nothing. The crops were the exception, and for a reason
that is invisible locally: freshness was an **mtime** comparison, a git checkout stamps every
file with the checkout time, and the crops are gitignored, so a Vercel builder could only ever
take the cold path. 124 s of every build, or ~40 % of it, cutting 426 files that were
byte-identical to the ones the previous build cut.

**Two changes to that step, and both are needed.** Freshness is now a content hash (source
bytes + the sidecar's focal point + geometry + the sharp/libvips version) against a copy kept
in `.next/cache/image-crops`; and the loop, which was `for (…) await cropOne(…)` with three
cores idle, runs at `cpus().length`. Measured end to end:

| path                                            |  before |  after |
| ----------------------------------------------- | ------: | -----: |
| cache hit (what a Vercel build now does)        |   126 s | 0.93 s |
| cache miss, e.g. a new photo or a cleared cache |   126 s |   44 s |
| one retargeted focal point                      |   126 s |  1.2 s |
| whole `prebuild`                                | 132.4 s | 9.85 s |

The cache costs 106 MB inside a `.next/cache` that was already 312 MB, and it is pruned to the
current source set on every run so it cannot grow with the repo's history.

**Not a KV store, and not Blob.** Both would work and both are the wrong shape: 426 objects
over the network per build, plus a token, to avoid a second of local file copying, for data
that is a pure function of files already in the checkout. Next's own docs settle it — „The
build cache lives in `.next/cache`. Builds only get faster when that directory is restored
before each build." Vercel restores exactly that directory.

**The prerender phase is 92 % of a warm build and stays.** 3,151 pages, of which the glossary
is 1,644 (52 %) and the geo hubs 1,038 (33 %). Phase 0 called the glossary „a rounding error on
the build line", which is wrong by an order of magnitude, but its conclusion survives for a
better reason: the phase is CPU-bound, not IO-bound. `staticGenerationMaxConcurrency: 24`
against the default 8 made it **worse**, 2.9 min against 2.5 min, because the fetch cache is
warm and the pages are not waiting on anything. What is left is fewer pages or more builder
cores, and fewer pages means the ISR writes June 2026 spent a release removing.

**Also measured and rejected:** `mozjpeg: false` cuts the miss path from 44 s to ~11 s and adds
21 % to 100 MB of image bytes, against a bill whose largest single item was images. A double
`prebuild` (pnpm's implicit pre-hook plus the explicit `pnpm prebuild &&` inside `build`) was
checked with a throwaway package and does not happen: pnpm 11 has pre/post scripts off by
default, so the chain runs once. Narrowing `tsconfig` for the build buys nothing either — all
995 checked files are `app/`, `components/` and `lib/`, and `scripts/*.mjs` was never in it.

**Deploy cadence is a real lever, and it is now automatic for the free case.** 3 of the last 40
commits touched only `docs/`, `todo.md`, `CLAUDE.md` or `.github/`, and each built and shipped
an identical site. `ignoreCommand` runs `scripts/vercel-ignore-build.sh`, which diffs against
`VERCEL_GIT_PREVIOUS_SHA` and skips when every changed path is on a short anchored
allowlist. It builds whenever it cannot be sure: no previous SHA, a SHA missing from a shallow
clone, a failed diff, an empty diff. `content/blog/**`, `public/media/**` and `messages/**` are
deliberately absent from the list, because each is the input to a generator and a README inside
one of them is not worth a glob that could skip an article's deploy.

> **Superseded 2026-10-26** for the marker: production builds start from a debounced deploy hook
> (`.github/workflows/deploy-production.yml`), and the script no longer reads `[skip deploy]`.
> "The wait holds the container but burns no Active CPU" was wrong: Vercel bills build minutes
> times cores, waiting included. See the 2026-10-26 entry at the end and
> [deploys](../development/deploys.md).

**The second skip is not about paths at all: a batch of merges.** Every squash merge of a batch
but the last one carries `[skip deploy]` in its message. The batch is not lost, because the diff
runs against the last successful deployment and a skipped build never becomes one, so the
closing merge builds every file the batch touched — 4 PRs merged at once cost 1 build instead of 4. Previews are untouched: a preview belongs to its pull request, where the eventual squash
message does not exist yet. Any commit without the marker builds as well — only `HEAD` is read.

**The marker asks the question; the tip of `main` answers it.** A batch can end early — the
closing merge conflicts, its checks turn red — and the marked commit is then the tip with
nothing behind it. Skipping that one is the silent failure the allowlist is built to avoid, so
the marker alone does not decide. The script polls `git ls-remote <repo URL> refs/heads/main`
every 15 s for up to 5 minutes (`IGNORE_BUILD_POLL_INTERVAL`, `IGNORE_BUILD_POLL_TIMEOUT`): a tip
that has moved past this commit means the batch is still running and the newer build carries
these files too, so this one skips; a tip that is still this commit after the timeout builds, and
so does a failing `ls-remote`. The wait holds the container but burns no Active CPU, which is the
trade that makes it worth making. It replaced an unconditional skip and the manual escape that
went with it — redeploying from the dashboard with **Use project's Ignore Build Step** unchecked
([Vercel docs](https://vercel.com/docs/monorepos#ignoring-the-build-step)) — because nobody is
watching a merge batch at the moment it stalls.

**The URL, not `origin` (2026-09-30).** Until then the script asked `origin`. Vercel's build
checkout is a `git clone --depth=10` with no usable `origin` remote, so `ls-remote` printed
nothing, the failure branch built, and from 2026-09-22 every marked merge shipped a full
production build of its own: the batches saved nothing, and nothing said so, because a build
that should have skipped looks exactly like a build. The script now asks
`https://github.com/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG.git` (the repository is public,
no credentials needed) and fetches a previous SHA outside the 10-deep clone from there too; it
falls back to `origin` only outside Vercel. The test had passed throughout because its checkout
had an `origin`. It now runs the marker cases in a checkout without one and reaches the bare
repository only through the URL, via git's `url.<base>.insteadOf`; against the old script 8 of
its cases fail, the first being a marked commit with `main` already ahead of it, which built.

**The asymmetry is the whole design, so it is pinned rather than argued.** A needless build
costs minutes of Build CPU. A skipped build that should have run is silent: the deploy reports
success, Vercel keeps the previous deployment aliased, and a published article stays invisible
until somebody happens to push again. `pnpm test:ignore-build` (41 cases, part of
`release:check`) drives the real script against a throwaway git repository and asserts the
answer for every input a build step reads — a post in each of the six locales, an author, the
categories, an agent `SKILL.md` whose served bytes carry a build-time SHA-256, homepage content,
a photo, a sidecar, a translation file, the lockfile, `.nvmrc` — plus the two shapes a careless
allowlist gets wrong: a commit touching documentation AND a post (08764e8 is a real one, six
posts alongside `CLAUDE.md`), and `content/blog/README.md`, which an unanchored `README.md`
pattern would swallow. The marker gets a bare repository standing in for GitHub and both answers
the tip can give, against a commit the allowlist would have built: the tip already ahead, an
unmarked commit in that same position, the tip still on the marked commit until the poll times out, and the tip
moved by another process while the poll is running — that last one is the case the loop exists
for, and a script that compared only on its first look passes every other one. The closing
build's own file list is read to prove the skipped merges reached it. Verified separately that nothing in the build reads `docs/`, `CLAUDE.md`,
`todo.md` or the root `README.md`; the only grep hit is `generate-media-manifest.mjs`
explicitly EXCLUDING `README.md` when it collects posts.

**Cost-shift check:** the crop change shifts nothing — no fetches, no ISR writes, identical
output bytes, verified by hashing all 426 crops before and after (`IDENTICAL`). `ignoreCommand`
shifts nothing either; a skipped build leaves the previous deployment aliased, which is what a
tree with no output-relevant change should serve.

**Verification:** `pnpm build` green with the crop cache warm, and `next build` confirmed to
leave `.next/cache/image-crops` intact (426 entries before, 426 after) — the whole mechanism
fails silently if it does not. Crop determinism checked directly: the same source re-encoded
three times gives one hash. Invalidation checked both ways: a retargeted focal point re-cuts 3
crops, reverting it returns the original bytes. The ignore script was run against a real
docs-only commit (exit 0), a real code commit (exit 1, 13 files), a missing SHA and an unknown
SHA (exit 1 both).

**The end-to-end number is measured, not added up.** Three full `pnpm build` runs on the same
box, each starting from exactly what a Vercel builder has — crops absent from the clone,
Turbopack and fetch caches restored — and the middle arm exists to show that neither half of the
change carries it alone:

| arm                                       | full `pnpm build` | crop step |
| ----------------------------------------- | ----------------: | --------: |
| before, as it shipped (mtime, sequential) |       **284.3 s** |    ~124 s |
| parallel loop only, no crop cache         |           196.9 s |    34.6 s |
| after, crop cache restored                |       **165.6 s** |     0.8 s |

**284.3 s → 165.6 s, −118.7 s, −41.8 %.** The parallel loop is −87.4 s of that and the cache
−31.3 s on top, which is why both stay: a build that changes a photo falls back to the middle
row rather than to the first.

**Open:** confirm it on Vercel by comparing Build CPU on the next production deploy against the
~5 min the same build takes today, and read `✂️  Generating aspect-ratio image crops` in the
build log — it prints its own wall-clock and whether each crop was cut, restored or already on
disk.

---

## 2026-09-10 — ACCEPTED: the build prerendered 618 pages whose whole output is a redirect

**Lever:** Build CPU Minutes. **Files:**
`app/[locale]/parks/[continent]/[country]/[city]/page.tsx`.

A city with exactly one park redirects to that park (308, so Google consolidates the signals
on the page that has content). `app/sitemap.ts:238` has carried the predicate for that all
along — `if (city.parks.length > 1)` — and so the sitemap never listed those cities. The
route's own `generateStaticParams` did not carry it, and nothing connected the two.

Counted against the live geo structure: **145 cities, 103 of them with a single park.** At six
locales that is **618 of 870 prerendered city pages, 71 %**, each one fetched, rendered and
written at build time to emit a `Location` header. They are in no sitemap, and nothing links
them — the country page links straight to `/…/<city>/<park>` — so the only visitor is somebody
holding an old URL.

Adding the same predicate to `generateStaticParams` does not remove the redirect:
`dynamicParams` defaults to true, so such a URL renders on demand and still 308s. Measured:

|        | routes prerendered | city routes | full `pnpm build` |
| ------ | -----------------: | ----------: | ----------------: |
| before |              3,151 |         870 |           165.6 s |
| after  |          **2,533** |     **252** |       **150.9 s** |

**−618 routes, −14.7 s.** With the crop fix that is 284.3 s → 150.9 s, **−47 %**.

It is now the same rule in two places, so they move together: change the sitemap's predicate
and change this one, or the build starts prerendering redirects again. The docstring says so at
both ends.

**Verification** against `pnpm build && next start`: Rust (Europa-Park + Rulantica, still
prerendered) answers 200; Brühl (Phantasialand only, no longer prerendered) answers 308 to
`/de/parks/europe/germany/bruehl/phantasialand`; the legacy shape `/de/parks/europe/germany/
phantasialand`, which the second redirect branch exists for, still answers 308 to the same
place; a nonsense slug still 404s. `tsc --noEmit`, eslint and prettier clean.

**Two findings from the same audit, checked and REJECTED:**

- **"The crop cache pushes `.next/cache` past Vercel's 1 GB cap"** — it does not.
  Measured 461.9 MB total (turbopack 340.1, image-crops 108.5, fetch-cache 12.4,
  `.tsbuildinfo` 1.0), i.e. 0.43 GiB. The claim was out by 2.4×. Worth re-measuring if the
  Turbopack cache grows, since that is the half that moves on its own.
- **"197 of 426 crops have no consumer"** — they do. `getParkImageSet` /
  `getAttractionImageSet` reach `versionedImageSet`, and `buildStructuredImage`
  (`components/seo/structured-data.tsx:187`) returns the WHOLE array whenever it holds more
  than one entry, so all three ratios land in the JSON-LD `image` of park and ride pages, which
  is what Google asks for. Cutting two of three would trade an SEO signal for ~20 s on the
  cache-MISS path, which now costs 0.8 s on a hit. `variantFor()` in `lib/media/focus.ts` is
  genuinely dead code, but it is a function, not a crop.

---

## 2026-09-21 — ACCEPTED: the bodyless 308, three weeks after it was deferred

**Lever:** origin transfer. **Files:** `proxy.ts`, `lib/parks/calendar-redirects.ts`,
`lib/parks/calendar-segments.ts`, `lib/utils/servable-route.ts`,
`app/[locale]/…/wait-time-calendar/[[...date]]/page.tsx`.

**What the body actually is.** The deferred entry above called it an `__next_error__` document and
left it there. It is the route's **not-found page**, rendered through the root and locale layouts
after the redirect is thrown — `next/dist/server/app-render/app-render.js`, the `isRedirectError`
branch, sets the status and `location` and then renders
`UNDERSCORE_NOT_FOUND_ROUTE_ENTRY` anyway. Broken down on production's 81,963 B:

```
<head>                  3,502 B   down to <title>Park nicht gefunden</title>
RSC flight payload     77,152 B   the locale layout: header, footer, route messages
Cloudflare script         921 B
content-encoding        (none)
```

That explains the growth the follow-up measurement recorded (72,235 → 81,963 B in eighteen days)
without anything having changed about the redirect: the body is the layout, so it grows with the
layout. It also means this was never specific to `permanentRedirect()` or to the calendar — all
**15** redirect call sites in the app tree carry it.

**Why the objection no longer holds.** The deferred entry rejected a proxy-level check because the
window depends on the park's `scheduleCoverage.to` and timezone, so it would be "a second copy of
the month rule, living where nothing renders it". `lib/parks/calendar-redirects.ts` is not a copy:
it **imports** `PARK_CALENDAR_SEGMENTS`, `parkCalendarPath`, `parseParkCalendarMonthSpelling`,
`isParkCalendarMonthInRange` and `currentParkCalendarMonth` from `lib/parks/calendar-segments.ts`,
the same module the route reads. The two park-dependent halves resolve without the API:

- The timezone only moves which **day** it is, so the extreme offsets bracket every park's current
  month — `currentParkCalendarMonth('Etc/GMT+12')` (UTC−12) and `('Etc/GMT-14')` (UTC+14). They are
  the same month on all but about a day per month, and the pair collapses to one.
- `parkCalendarMonthsForward` shows `scheduleCoverage.to` can only **shorten** the forward window.
  Omitted, the check uses the widest window any park could have.

A month outside that for every candidate is outside for every park. Everything else returns `null`
and falls through to the route, which still owns the rule — including the edge months, which still
308 from the render and still carry the body. One thing about the response is load-bearing and was
measured the wrong way round first: a middleware `Location` must be **absolute**. Handing Next a
bare path throws `ERR_INVALID_URL` inside `new NextURL(...)` and the URL answers **500**, which the
first build here did on all three redirect URLs. `NextResponse.redirect(new URL(target,
request.url), 308)` is correct, and the adapter relativizes the header again when the host matches
the request's — so what reaches the visitor is the same relative `Location` the page sent before.

**Measured effect** (local `next start`, Node 24, same build twice — baseline, then the change):

| URL                                                 |         before |          after |
| --------------------------------------------------- | -------------: | -------------: |
| `/de/…/wartezeiten-kalender/2025/3` (out of window) |       75,832 B |           66 B |
| `/en/…/wait-time-calendar/2026/1` (out of window)   |       75,026 B |           64 B |
| `/de/…/wartezeiten-kalender/2026/09` (padded)       |       77,470 B |           73 B |
| `/de/…/koeln/phantasialand/…/2026/10` (wrong city)  |       77,378 B |       77,375 B |
| `/de/…/wartezeiten-kalender/2026/13` (malformed)    |  404, 75,873 B |  404, 75,956 B |
| `/de/…/wartezeiten-kalender/2026/10` (in window)    | 200, 450,259 B | 200, 450,253 B |

The remaining 64–73 B are the target path as text, which is what `NextResponse.redirect()` writes:
**1,149× smaller** on the first row. Status, `Location` and `CDN-Cache-Control` are unchanged on
every row. The last three rows are the control — they are not supposed to move, and the tens of
bytes between them are build-id noise in the markup, not a behaviour change. Against the ~5,600
redirects per 12 h read off the calendar route, this is the ~400 MB the track has been carrying
since 2026-09-01.

**What stays.** The other ten page-render redirects — `findParkPageRedirect`,
`findRelocatedParkRedirect`, `findRenamedParkRedirect` on the park, ride, city and calendar
routes, the glossary's localized-segment 308, the blog's canonical-slug 307 — each need a lookup
the proxy would have to run on **every** request. Row four above is one of them and does not move.
They are a handful of URLs against 21,948, and buying their bodies back would cost a fetch on every
page view.

**Cost-shift check:** none. No new fetches; the proxy work is a `split('/')` and, on a calendar
month URL only, two `Intl.DateTimeFormat` reads. Invocations are unchanged — a middleware response
is still an invocation — so this is a pure transfer saving.

**Verification:** `pnpm lint`, `pnpm format:check`, `pnpm build` (Node 24, exit 0),
`pnpm test:calendar-month` (60 cases, 11 of them new and pinning both window edges),
`pnpm test:calendar`, `pnpm test:calendar-park-projection`, `pnpm test:content-changes`.

## 2026-09-28 — ACCEPTED: less CPU per render, fewer invocations for shared answers

**Lever:** Fluid Active CPU per invocation and function invocations. **Branch:**
`claude/codebase-doppelpaints-cpu-xg2cxt` (PR #637). The Vercel MCP still had no access to the team,
so nothing here is read off the Compute tab; every number is measured per call against live
payloads, and the effect belongs in **Compute → Active CPU per invocation**, not in the CDN tab (see
the traps in README.md).

**Per render on the force-dynamic routes** (the ~90 % of park, ride and calendar requests that
reach Vercel):

| What                                                              | Before              | After           |
| ----------------------------------------------------------------- | ------------------- | --------------- |
| Glossary matcher, per `parseGlossarySegments` call (≤5 per ride)  | 453–550 µs          | 16–19 µs        |
| Park payload trim, Europa-Park shell                              | 638 µs              | 115 µs          |
| Shell + park-page trim                                            | 737 µs              | 171 µs          |
| Continents document: menu + city counts + slug index, per request | 2.0–2.3 ms          | 0.19–0.29 ms    |
| Geo tree for the park slug index                                  | second 159 KB parse | none (layout's) |

The continents fetch still runs in every render: skipping it with a TTL memo would have dropped the
page's `revalidate` window and `geo` tag on every render after the first in a worker (patch-fetch
records them per fetch). Instead the parsed document is reused while the ETag is unchanged and the
three derivations are keyed on the document. `initialRevalidateSeconds` is identical on all 2,655
prerendered routes before and after.

**Invocations.** `/api/parks/near` (one URL per park) and `/api/analytics/{ticker,realtime,geo-live}`
(one URL for every homepage and hub visitor) answered `no-store` although they are the same for
everybody; they carry the 60 s window of `/api/parks/live` now. Expect the analytics URLs to collapse
well and `near` only on busy parks. Not measured yet: read the invocation count of both before and
after the deploy.

**Failures stopped inheriting windows.** Every 5xx of the park proxy, the search and hourly-weather
errors and the new 502s answer `no-store`; a failed OG card is held 5 minutes, not 30 days. See
[An API route passes only slugs upstream, and says a failure is one](../rules/an-api-route-passes-only-slugs-upstream.md).

---

## 2026-10-16 — ACCEPTED: one prerender worker per core, and the tag archives nobody indexes stay unbuilt

> **Corrected 2026-10-26.** "Cached with the same one-week window a built one gets" holds only
> inside one deployment: Vercel's ISR cache is per deployment, so every thin tag is rendered and
> written again after each deploy. The entry priced the build and not the writes; see
> [2026-10-26](#2026-10-26--accepted-a-page-nobody-reads-back-renders-per-request-not-on-demand-isr).

**Lever:** Build CPU Minutes. **Files:** `next.config.ts`, `app/[locale]/blog/tag/[tag]/page.tsx`.

The builder is not the box the 2026-09-10 profile was taken on. Every production build log now
opens with `Build machine configuration: 2 cores, 8 GB`, and Next's `experimental.cpus` defaults to
`os.cpus().length - 1`. So the log reads `Generating static pages using 1 worker (3692/3692) in
5.9min`: one core renders 3,692 pages while the other waits with the main process, which during
this phase only collects results. Read off two production builds:

| phase                                         | 698c1c3 | fa9adfe |
| --------------------------------------------- | ------: | ------: |
| `prebuild`                                    |   8.1 s |  14.9 s |
| Turbopack compile                             |   7.1 s |  21.3 s |
| `tsc`                                         |   8.0 s |  39.2 s |
| collect page data                             |   4.1 s |   3.8 s |
| **static generation, 1 worker**               | 355.9 s | 338.4 s |
| Vercel's own output step after `next build`   |  56.5 s |         |
| deploy outputs                                |  25.7 s |         |
| create and upload the build cache (880.26 MB) |  42.6 s |         |

The prerender phase is 77 % of everything between the clone and `Build Completed` (464 s).

**Reproduced locally on two cores** (`taskset -c 0,1`, Node 24.22, `.next/cache` and the fetch
cache warm, as Vercel restores them). The arms set `experimental.cpus` directly:

| arm                                  | workers | pages | static generation | `pnpm build` | memory peak |
| ------------------------------------ | ------: | ----: | ----------------: | -----------: | ----------: |
| before, as it ships                  |       1 | 3,692 |           6.1 min |    **408 s** |             |
| one worker per core                  |       2 | 3,692 |           4.0 min |        277 s |             |
|                                      |       3 | 3,692 |           3.9 min |        270 s |             |
|                                      |       4 | 3,692 |           3.8 min |        260 s |             |
| after: per core, indexable tags only |       2 | 2,972 |           3.4 min |    **247 s** |      3.7 GB |
|                                      |       3 | 2,972 |           3.4 min |        240 s |      4.2 GB |
|                                      |       4 | 2,972 |           3.5 min |        252 s |      4.5 GB |

**408 s → 247 s, −39 %.** The local 6.1 min matches Vercel's 5.6 to 5.9, so nothing suggests the phase
waits on the network there. Memory is the peak above an idle box, read from `/proc/meminfo` once
a second, and it leaves the 8 GB builder room.

**Why not more workers than cores.** `exportPagesInBatches` (`next/dist/export/index.js`) cuts the
page list into one contiguous slice per worker, and all 270 blog posts sit in the first slice: with
two workers the first ends at 205 s, the second at 132 s. A third and fourth worker on two cores
let the scheduler even that out, and on the old page set they did buy 17 s. On the new one they
buy nothing measurable and cost up to 0.9 GB. `availableParallelism()` rather than a number also
keeps a developer's 12-core laptop at 12 workers, one more than Next would have started.

**Where the time goes**, from a per-page log of the export worker (sum of page durations, warm, one
worker, 2,866 s in total at eight pages at a time):

| route                       | pages | share | per page |
| --------------------------- | ----: | ----: | -------: |
| `/[locale]/glossary/[term]` | 1,644 |  35 % |   618 ms |
| `/[locale]/blog/[slug]`     |   270 |  23 % | 2,434 ms |
| `/[locale]/blog/tag/[tag]`  |   883 |  19 % |   612 ms |
| `/[locale]/news/[slug]`     |   168 |   9 % | 1,457 ms |
| cities and countries        |   384 |   7 % |   535 ms |

A CPU profile of that worker (an inspector session started inside it, because Next kills its
workers before `--cpu-prof` can write) puts the bulk in React's Flight and Fizz renderers inside
Next's app-page runtime and 15 % in the garbage collector. Of our own code only two things show:
markdown (micromark and `mdast-util-to-hast`, 4.5 %) and `lib/blog/tags.ts` (1.9 %, `listTags` and
the tag translation index rebuilt per page, because React's `cache()` lasts one request). A page
costs what it renders. A glossary term page is 410 KB of HTML, of which 101 KB is the header and
124 KB the inline Flight payload, and `.next/server/app` held 3.2 GB in 26,262 files. That is the
lever behind this one, and it is a product decision (the header is server-rendered for the link
graph), not a build setting.

**The tag archives.** 720 of the 883 tag pages belong to tags with fewer than
`TAG_INDEX_MIN_POSTS` articles: `noindex`, in no sitemap, and still built in all six locales.
`generateStaticParams` now lists the indexable ones (`isIndexableTag`, the predicate the page's
`robots` and the sitemap already ask). `dynamicParams` stays true, so the manifest keeps the route
as `"compute": "blocking"` and a thin tag renders on its first request and is cached with the same
one-week window a built one gets; an unknown tag still 404s. It is the shape
`average-wait-times` and `with-kids` already use. Output after the change: 2.7 GB in 21,222 files.

**Cost shift:** one render per thin tag URL per deployment, when something asks for it. The page
fetches nothing beyond the layout's geo read, which is cached. The worker change shifts nothing:
same pages, same bytes, same fetches.

**Checked and not done:**

- **`optimizeCss: true`** looks like a per-page cost and is not one. Only the Pages Router reads it
  (`server/render.js`, `next/head`); `app-render` never does. It costs nothing and does nothing here.
- **`staticGenerationMaxConcurrency`** stays at 8. The worker renders in fixed batches of that size
  under one `Promise.all`, so the slowest page in a batch holds the other seven, but the phase is
  CPU-bound and the 2026-09-10 entry measured 24 as slower.
- **`typescript.ignoreBuildErrors`** would save 8 to 39 s, and `checks.yml` runs lint and format
  but no `tsc`, so the build's check is the only one. It stays.
- **The glossary on demand** (done on 2026-10-20, see below). 35 % of the phase, but all 1,644 pages are indexed and in the
  sitemap; building them on first request after every deploy moves the renders onto the crawler.
- **A larger builder** is a billing setting in the dashboard. With `cpus` following the core count,
  it would now be used: under the default an 8-core machine runs seven workers, under this one eight.

**Open:** read the preview build of this branch and the next production build. Both should print
`Generating static pages using 2 workers` with about 2,972 pages, and the phase should land near
3.3 min against 5.6 to 5.9. Also unexplained: the 56.5 s between `next build` exiting and
`Build Completed`, which is Vercel's own step and should shrink with the output.

---

## 2026-10-20 — ACCEPTED: the glossary renders on demand, and the media check asks all parks at once

> **Superseded 2026-10-26.** The term pages are no longer built, and no longer ISR either. "Cached
> for `CACHE_TTL.geo`, seven days, exactly as a built one was" was true for one deployment only, and
> at about ten deploys a day each term URL was written again almost every time it was crawled:
> 9.0K units written against 300 read in 12 hours, the largest ISR writer of the site. See
> [2026-10-26](#2026-10-26--accepted-a-page-nobody-reads-back-renders-per-request-not-on-demand-isr).

**Lever:** Build CPU Minutes. **Files:** `app/[locale]/glossary/[term]/page.tsx`,
`scripts/generate-media-manifest.mjs`.

Production build of 4b58073 (2 cores), read off the log: clone, cache and install 14 s, `prebuild`
12 s, compile, `tsc` and page data 23 s, **static generation of 3,014 pages 191 s**, finalize 6 s,
Vercel's own step after `next build` 45 s, deploy outputs 26 s, build cache (922 MB) 30 s.

**What is left in the prerender is Next's renderer.** A CPU profile of the export workers puts
about two thirds in React's Flight and Fizz inside `app-page-turbo.runtime.prod.js` and the
garbage collector. Our own code is small: markdown on a blog post (~18 % of that route's CPU, one
parse per segment, widgets already cut out first), the glossary auto-link regexes (~3 %). The
layout's continents parse is already memoised by ETag. Every page carries a ~200 KB layout, of
which the header is 102 KB, and ~86 KB of that is the hidden mega-menu panels the
[header rule](../rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md)
server-renders for the link graph. That stays. The `.segments/` prefetch files, which double
every page's RSC bytes, are written unconditionally by `collectSegmentData` in Next 16.4 and
cannot be switched off.

Each heavy route built alone (`next build --debug-build-paths`, 2 workers, warm caches, M-series
Mac, about 4× faster per core than the builder):

| route                       | pages |  alone | share of the full 45 s |
| --------------------------- | ----: | -----: | ---------------------: |
| `/[locale]/glossary/[term]` | 1,644 | 14.1 s |                   31 % |
| `/[locale]/blog/[slug]`     |   282 | 12.1 s |                   27 % |

**The glossary.** The 2026-10-16 entry kept the term pages prerendered so the crawler would not
pay for the renders. Against that: the site deploys several times a day, every deploy rendered all
1,644, and between two deploys far fewer are requested. `generateStaticParams` now returns `[]`
(the route stays in `dynamicRoutes` with a blocking fallback, see
[an ISR route needs both halves](../rules/an-isr-route-needs-both-halves.md)). The term data is in
the repo, and the only fetch is the layout's geo read, so a rendered term page is cached for
`CACHE_TTL.geo`, seven days, exactly as a built one was. Measured against `next start`: first
request 159 ms, the next 4 ms (`x-nextjs-cache: HIT`, `s-maxage=604800`); a slug from another
locale still 308s to the local one, an unknown slug still 404s.

A/B, same box, 2 workers, `next build` only, caches warm:

|        | pages | static generation |   `.next/server/app` |
| ------ | ----: | ----------------: | -------------------: |
| before | 3,014 |              45 s | 2.6 GB, 21,509 files |
| after  | 1,370 |       31.3–32.1 s | 1.5 GB, 10,001 files |

**−30 % of the phase**, about 58 s of the 191 s on Vercel, and less than half the files for the
45 s step and the 26 s deploy that scale with the output.

**The media check.** `verifySlugs` read one park's attractions at a time from api.park.fan. From
Washington that is 7 s of `prebuild` waiting on Europe; locally 1.1 s. The promise is cached now
and every park is in flight together: 0.6 s locally, the same warnings, byte-identical manifests.

**Cost shift:** one render per term URL per deployment, when something asks for it, instead of
1,644 per deployment whether or not anything does.

**Open:** read the next production build. It should print about 1,370 pages and land near 2.2 min
for static generation, with the step after `next build` and the deploy both shorter.

---

## 2026-10-23 — ACCEPTED: the MCP server reads the park from the Data Cache

**Lever:** Fluid Active CPU and upstream calls. **Files:** `lib/agents/mcp-tools.ts`,
`lib/api/parks.ts`, `lib/api/cache-config.ts`.

One hour of production request records (`vercel logs requests`, 2026-10-23 12:22–13:22 UTC):
83 POSTs to `/api/mcp`, all `python-httpx`, all through `gru1`, four calls every three minutes
like clockwork. Every `get_park_wait_times` fetched the park `no-store` and parsed the whole
payload (113 kB for Europa-Park). It now reads the live projection held for
`CACHE_TTL.agentPark` (300 s, the backend's own wait-time cycle) under the park's tag;
`get_park_best_days` reads `getBestDaysCalendar`, the page's tagged snapshot.

**Open:** the request records carry no body, so whether the four calls are tool calls or
`initialize`/`tools/list` is unknown. If they are the latter, this saves nothing for that client.

---

## 2026-10-26 — ACCEPTED: a page nobody reads back renders per request, not on-demand ISR

**Lever:** ISR Write Units, and Build CPU Minutes as a side effect. **Files:**
`app/[locale]/glossary/[term]/page.tsx`, `…/[park]/average-wait-times/page.tsx`,
`…/[park]/with-kids/page.tsx`, `app/[locale]/blog/[slug]/page.tsx`, `app/[locale]/news/[slug]/page.tsx`,
`components/blog/blog-content.tsx`, `app/api/cron/indexnow/route.ts`, `lib/blog/tags.ts`,
`scripts/test-edge-windows.mjs`.

**How it got in.** The two build-time entries above (2026-10-16, 2026-10-20) took pages out of the
build and left them to on-demand ISR, on the assumption that a page rendered on its first request
is cached from then on like a built one. On Vercel it is cached for the rest of that deployment.
Each deployment has its own ISR cache, the site deploys about ten times a day (78 production deploys
from 19 to 26 October), and a long-tail URL is crawled about every two days, so nearly every crawl
landed on an empty cache, rendered, and wrote an entry nobody read back. `average-wait-times` and
`with-kids` were built that way from the start.

**Measured**, production, ISR → Routes → Units, the 12 hours to 2026-10-26 13:00 Berlin:
`glossary/[term]` 9.0K units written against 300 read, `average-wait-times` 6.2K against 182,
`blog/tag/[tag]` 3.0K against 1.9K, `with-kids` 1.2K against 32, `[city]` 528 against 1.6K. Built
blog and news posts showed up as rows of their own, each wait-time post 40–80 units written and 0
read: a post's widgets read park data the backend revalidates by tag, and
`/de/blog/walibi-belgium-wartezeiten-tipps.meta` carried
`geo attractions parks park:europe/belgium/wavre/walibi-belgium weather`. One render stores two
objects, HTML and RSC, billed on compressed bytes: `/fr/blog/temps-d-attente-parcs-europe-2026`
wrote 69 units with a size range of 24–45, and every write count in the Count view was even. Team
billing for ISR writes ran at $0.20–0.40 a day, so the money is small; the point is that these writes
bought nothing.

**Done.** Glossary terms, `average-wait-times`, `with-kids`, blog posts and news posts are
`export const dynamic = 'force-dynamic'` with no `generateStaticParams`, and the `CDN-Cache-Control`
day `next.config.ts` already sent is their only cache, as on the park page. The post widgets render
inline instead of in `<Suspense fallback={null}>`, so a streamed widget cannot push the text below
it down; the remaining streamed boundaries on a post are the layout's, the same 26–28 a park page
has. `pnpm test:edge-windows` matches the header rules the way Next does and fails when a localized
segment of one of these routes has no window, which would now mean a render per request.
`getParkWeatherNowcast` lost its caller-supplied window, whose only reason was a post's ISR clock.
IndexNow no longer submits the thin, `noindex` tag archives (`listIndexableTags`, shared with the
sitemap and the build).

**Local proof** (`pnpm build && pnpm start`, Node 22, 4 cores): none of the five routes is in
`dynamicRoutes` any more; the 200, the 404 and the cross-locale 308 all answer without
`x-nextjs-cache` and with `CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600`.
The build went from 1,535 to 965 pages and `.next/server/app` to 614 MB in 7,168 files; static
generation took 2.5 min before and 28.5 s after, but the first run had a cold fetch cache, so the
build time is measured properly in the follow-up.

**Cost shift:** a Cloudflare miss on these routes is a function render instead of an ISR read or a
render plus write. One write unit buys about 112 ms of `iad1` Active CPU or 6.7 invocations; a warm
glossary render took 52–68 ms locally. Requests that bypass Cloudflare's cache key (a `?utm_`
variant, a client RSC request) are now renders too.

**Open:** read the same Units view two days after the deploy; the five rows should be at or near 0
written. The thin tags and the single-park city 308s are still on-demand ISR and are the next
candidates, and the backend's tag pushes still reach the homepage and the hubs.

---

## 2026-10-26 — ACCEPTED: production deploys wait in GitHub Actions, not in Vercel

**Lever:** Build CPU Minutes. **Files:** `vercel.json`, `.github/workflows/deploy-production.yml`,
`scripts/vercel-ignore-build.sh`, `scripts/test-vercel-ignore-build.mjs`,
`docs/development/deploys.md`.

Build CPU Minutes are the largest line of the project's bill: 17 hours, $3.58 of $11.59 from 19 to
26 October (Vercel Usage). The release-branch rule of the PO playbook (2026-10-24) bundles the PRs
of one run, and it works: "Release 2026-10-24: #1034, #1035, #1036, #1037" was one build. It cannot
bundle across sessions, and those merges land minutes apart: 25 October 17:43 (media) and 18:07
(news), 26 October 08:13 (news) and 08:19 (release 2.18.0), each a full build.

A wait inside the Ignored Build Step was the obvious fix and the wrong one. Vercel bills "one minute
of build time multiplied by the number of vCPU cores used", a canceled build counts as a
deployment and its billable duration is rounded up to the next minute
([Vercel](https://vercel.com/docs/builds/managing-builds)). On the two-core machine a ten-minute
wait is 20 CPU minutes per build, twice a whole build, to catch a handful of bursts a week. The
`[skip deploy]` poll paid the same price whenever the tip did not move.

So the wait moved to GitHub Actions, free on a public repository. `git.deploymentEnabled.main: false`
stops the build per push; the workflow sleeps `DEPLOY_DEBOUNCE_MINUTES` (10) and fires a Deploy
Hook, and `concurrency: cancel-in-progress` lets each push cancel the run still waiting. The build
then diffs against the last successful deployment as before, so it carries every merge since. The
marker code is gone from the script and from its test; the test now pins that the build after three
merges lists all three, that a stray `[skip deploy]` neither skips nor waits, and that a previous
deployment outside the shallow checkout is fetched by URL.

**Cost shift:** every production deploy, news included, goes out about ten minutes after the last
merge, unless the commit says `[deploy now]` or the workflow is started by hand.

**Open:** after the first merge, check that the deploy hook creates the deployment with automatic
Git deployments off for `main` (Vercel documents that hooks stop under `github.enabled: false`,
and says nothing about `git.deploymentEnabled`). If it does not, revert the `git` block in
`vercel.json`.
