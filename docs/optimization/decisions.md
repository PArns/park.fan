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
requested the moment they leave the sitemap. They now resolve to the hub with a `301`, and
that redirect carries the **71 kB uncompressed `__next_error__` body** documented in the
deferred entry above. Per request that is _more_ bytes than the 200 it replaces (71 kB
uncompressed vs ~57 kB brotli), against lower CPU (the redirect fires before the heavy
render). At ~25 fetches/URL/month that is roughly **+2 GB/month during the decay**, falling
to zero as crawlers drop the URLs.

Net still clearly negative on spend — the requests end, the renders end with them, and the
January growth never happens. But it raises the value of the deferred bodyless-308 work
by roughly 3x for as long as the decay runs — still small in absolute terms. Worth revisiting
now rather than later.

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
