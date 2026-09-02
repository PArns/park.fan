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
5. **Der Sitemap-Varianten-Slug ist für 7 Bahnen invertiert:** `/v1/sitemap/attractions` listet
   `raven` **und** `raven-2`, `getAttractionPaths()` verwirft `raven-2`, weil die Basis existiert
   — aber das Park-Payload enthält nur `raven-2`. Verifiziert: `…/raven` → **404**, `…/raven-2` →
   **200**. Kostenmäßig belanglos (80 Invocations/Tag); es geht darum, dass 7 echte Ride-Seiten
   aus der Sitemap unerreichbar sind und an ihrer Stelle eine 404 im Index steht. Im selben
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
