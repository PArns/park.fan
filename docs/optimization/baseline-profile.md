# Baseline profile — Phase 0 (PROFILER)

Measured 2026-09-01 against production. No production code was changed.

Everything below is either a direct measurement (marked with its command) or an
arithmetic consequence of one. Where a number is inferred rather than observed it
says so.

---

## 0. Headline: the plan targets the wrong bottleneck

The optimization spec assumes expensive renders serving human traffic, to be fixed by
slimming backend payloads (Phase 2) and shrinking the prerender matrix (Phase 4).

The measurements do not support that. What was actually found:

> **~74 % of Vercel invocations are crawler sweeps of a 59,772-URL published surface.
> 87 % of them miss every cache, because a URL fetched roughly once per day per crawler
> cannot be kept warm in an edge cache. Neither the backend payload nor the build matrix
> is the cost driver — the size of the crawlable URL space is.**

This does not invalidate the render work (§4 lists real, bookable savings). It does mean
the phase order and the expected savings need re-planning before Phase 2 starts.

---

## 1. Traffic composition (measured)

`vercel logs https://park.fan --json`, two independent samples, 100 requests each,
73 s and 102 s windows. Rate: 0.98–1.36 req/s ≈ **26–42 K requests / 12 h**, consistent
with the 26 K/12 h in the brief.

| Route class                                              | Share (n=100, 2nd sample) |
| -------------------------------------------------------- | ------------------------: |
| `[park]/[attraction]` page                               |                  **38 %** |
| `[park]/wait-time-calendar/[[...date]]` page             |                  **36 %** |
| `/api/nearby`                                            |                       6 % |
| `/api/parks/*`                                           |                       4 % |
| everything else (home, blog, glossary, contribute, hubs) |                      16 % |

Two page routes are **74 % of all traffic**. This matches the brief's per-route table
(9.9 K + 11 K of 26 K).

### Cache status

| Status          |    Share |
| --------------- | -------: |
| **MISS**        | **87 %** |
| PRERENDER       |      4 % |
| HIT             |      3 % |
| (empty / other) |      6 % |

### Locale distribution — the tell

| Locale   |    Share |
| -------- | -------: |
| `nl`     | **35 %** |
| `en`     |     17 % |
| `it`     |     10 % |
| `fr`     |     10 % |
| `es`     |      8 % |
| **`de`** |  **6 %** |

park.fan is a German-first site: German blog, German editorial voice, DACH audience.
German is the _sixth_ most requested locale in production. Dutch outweighs it 6:1.

### The paths themselves

Sampled, verbatim:

```
/nl/parks/asia/saudi-arabia/al-moqbel-palaces/six-flags-qiddiya-city/aquaticar
/nl/parks/europe/france/paris/panoramagique/wachttijden-kalender/2027/5
/it/parks/europe/belgium/kasterlee/bobbejaanland/ponyride
/it/parks/asia/china/xiao-gan-shi/fantawild-ft-wild-land-xiaogan/ji-su-chong-lang
/es/parks/europe/belgium/ieper/bellewaerde/het-huis-van-houdini
/de/parks/south-america/brazil/penha/beto-carrero-world/castelo-das-nacoes
/en/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/wait-time-calendar/2026/1
```

A Dutch-language page for a Paris ferris wheel's **May 2027** crowd calendar. An Italian
page for a pony ride in Belgium. 89 page requests touched **37 distinct park scopes**,
57 % of paths unique within a 102-second window.

This is a crawl sweep, not an audience. Corroborating: the only clustered traffic in the
sample was one Hersheypark session issuing five `/api/parks/.../{stats,best-days,calendar,
weather/nowcast}` calls — the signature of one real user, against dozens of one-shot
long-tail page renders.

> **Not measured:** user-agent strings. Vercel's runtime log API does not expose them and
> Cloudflare sits in front, so the crawler attribution is an inference from locale mix,
> path distribution, uniqueness and cache-miss rate — strong, but not a UA breakdown.
> Getting the actual split needs Cloudflare analytics (out of repo). **Do this before
> acting on §5.**

---

## 2. The published crawl surface (measured)

Fetched and counted from the live sitemaps:

| Sitemap                                             |                   URLs |
| --------------------------------------------------- | ---------------------: |
| `sitemap-attractions/{locale}.xml`                  | 7,152 × 6 = **42,912** |
| `sitemap-calendar/{locale}.xml`                     | 2,007 × 6 = **12,042** |
| `sitemap.xml` (parks, hubs, glossary, blog, static) |              **4,818** |
| **Total published, crawlable**                      |             **59,772** |

The calendar sitemap publishes months out to **2027/8** — 213 parks × month for near
months, still 21–39 parks/month a year out.

### Why this is the cost

1.5 M invocations/month ÷ 59,772 URLs ≈ **25 fetches per URL per month** — one fetch per
URL roughly every 29 hours. That is the signature of a handful of crawlers each
re-sweeping the whole surface every few days.

**Edge caching structurally cannot fix this.** Cloudflare's cache is per-URL per-PoP;
60 K rarely-requested HTML objects spread over Cloudflare's PoPs are evicted long before
they are requested again. Measured directly: a _popular_ URL is a Cloudflare `HIT`
(`age: 39309`, 11 h old), while the long-tail sweep runs at 87 % origin MISS.

---

## 3. Cost model validation

| Line item            | Reconstructed from measurements                        |
| -------------------- | ------------------------------------------------------ |
| Fluid Active CPU     | 1.5 M invocations × 0.15 s = **~62.5 CPU-hours/month** |
| Fast Origin Transfer | 1.5 M × 57 kB = **~85 GB/month**                       |

Both reconstruct the corresponding invoice lines to within ~15 %. **Cost = invocations × (CPU + bytes)**, and invocations
are set by crawl volume against the URL surface. Any lever that does not reduce
`invocations`, `CPU/invocation` or `bytes/invocation` does not reduce spend.

---

## 4. Per-request anatomy

### 4.1 Latency (measured, cache-busted so Cloudflare and Vercel both MISS)

| Request                            | Origin TTFB |
| ---------------------------------- | ----------: |
| attraction HTML                    |    79–96 ms |
| park HTML                          |      ~89 ms |
| calendar month HTML                |      ~86 ms |
| attraction **RSC** (`RSC: 1`)      |   97–164 ms |
| park **RSC**                       |     ~205 ms |
| `api.park.fan/v1/parks/...` direct |   91–120 ms |

The backend call is **not** on the critical path for most renders: it is served from
Vercel's Data Cache (`next: { revalidate: PARK_REVALIDATE }`), so the ~150 ms of billed
Active CPU is almost entirely _render_, not _wait_. This refutes the spec's premise that
"the backend's latency is being paid for at Vercel's compute rate" for these routes.

### 4.2 Bytes (measured, `curl --compressed` vs `accept-encoding: identity`)

| Page         | Raw HTML | Brotli (wire) |
| ------------ | -------: | ------------: |
| attraction   |   409 kB |   **56.8 kB** |
| park         |   502 kB |        ~67 kB |
| calendar hub |   438 kB |        ~58 kB |

Compression is working end to end (brotli negotiated). Composition of the raw HTML:

| Component                     |        attraction |          park |      calendar |
| ----------------------------- | ----------------: | ------------: | ------------: |
| **RSC flight payload**        |     185 kB (45 %) | 228 kB (45 %) | 216 kB (49 %) |
| SSR markup                    |            169 kB |        199 kB |        166 kB |
| inline `<svg>` (Lucide icons) | 51 kB / 115 icons |   54 kB / 118 |   51 kB / 111 |
| JSON-LD                       |            4.2 kB |   **21.7 kB** |        4.9 kB |

Largest single rows inside the flight payload:

- **26–29 kB — `RouteMessages` (next-intl route-delta namespaces)**, plus 7.7 kB for the
  layout chrome provider. ~35 kB of translations per page, on every page.
- **41.3 kB — `initialData`** (full park object) into a Client Component on the park page.
- **15.8 kB — the `AmusementPark` JSON-LD**, serialized a second time into the flight
  payload on top of its copy in the HTML.
- **54.6 kB — the calendar's whole `<article>` subtree** in flight form.

Every server-rendered byte ships twice: once as HTML, once as flight.

### 4.3 Render-path waste (from code audit)

Found by the calendar profiler, `docs`-verifiable:

1. **`getParkByGeoPath` is not wrapped in React `cache()`** (`lib/api/parks.ts`). It is
   called identically from `generateMetadata` and from the page body. Next dedupes the
   underlying `fetch`, but `response.json()`, `withParkCoordinates()` and
   `leanParkForShell()` (three `.map()` passes over attractions/shows/restaurants) run
   **twice per request** — the second time to produce a `<title>`.
2. **`getParkSlugIndex()` rebuilds a site-wide geo index on every request**
   (`lib/utils/redirect-utils.ts:26-45`), looping all continents → countries → cities →
   ~212 parks. Called unconditionally from the calendar page (`page.tsx:278`). Only the
   underlying 7-day fetch is cached, not the derived index.
3. **5–6 sequential `getTranslations()` calls** per render (calendar `page.tsx:127-128,
272-274, 318-319`), all independent, none batched.
4. **`seasonsPromise` fired after the blocking park fetch** (`page.tsx:290`) though it
   depends only on route params.
5. **Untrimmed park fields cross into three Client Components** (`ParkTodayPanel`,
   `ParkNavTiles`, `ParkCalendarPanel` all take the same `park`): `restaurants` (46 full
   records, used for a `.length`), full `schedule`, `shows`, `weather`, `analytics`.

**Refuted:** `summarizeCalendarMonth` is cheap (≤31-element array ops) and does the same
work for past and current months. There is no per-request recomputation of immutable
historical aggregates — the spec's hypothesis 4 is wrong for this route. What _is_ wrong
is the cache policy: `CALENDAR_MONTH_REVALIDATE` (6 h) applies identically to a
permanently-immutable past month and to today.

### 4.4 The attraction route: 60 % of every parsed park is discarded

Measured live against `api.park.fan`:

| Park          | attractions |   payload | `attractions[]` | the one ride the page renders |
| ------------- | ----------: | --------: | --------------: | ----------------------------: |
| Phantasialand |          40 |  60.17 kB | 38.45 kB (64 %) |           2,232 B — **5.7 %** |
| Europa-Park   |          96 | 110.28 kB | 69.02 kB (63 %) |           1,628 B — **2.3 %** |

The page fetches the whole park to render one ride. The only genuine sibling read in the
whole route is a park-wide rope-drop `.some()` at `[attraction]/page.tsx:542`, which needs
one boolean — not 40–96 full records. Combined with the missing `cache()` (§4.3.1), the
cost is **2 × JSON.parse + up to 4 full-array passes** over every sibling attraction, per
request, on the highest-invocation route in the app.

Refuted on this route: `RopeDropCard`, `RideProfileSection`, `AttractionFAQSection`,
`RideSectionNav` and the badges are all Server Components — nothing large crosses to a
client component here (`LiveAttractionData`'s `initialPark` is already trimmed to 3.7 kB by
`leanParkForAttractionShell`). There is no media-catalog leak. The attraction route's
egress problem is the generic one from §4.2, not a fat prop.

> **Stale since the ride-page redesign (Sept 2026).** `RideSectionNav` no longer exists.
> Its replacement `RideNavTiles` and the header card's `RideLiveHeader` are Client
> Components, because both draw live values, and each takes the ride's own record across
> the boundary — `RideNavTiles` as `attraction`, `RideLiveHeader` and `LiveAttractionData`
> as `leanParkForAttractionShell(park, attraction)`, called once per call site. So the same
> attraction is serialized into the RSC payload more than once and the "nothing large
> crosses" half of this paragraph wants re-measuring. The rest of the section — the 60 % of
> every parsed park that is discarded, the sibling-array passes, the missing `cache()` —
> is untouched by that change.

One free fix already documented but never implemented: `SeasonalBadge` uses **6 flat keys**
and pulls the whole **17.22 kB `parks` namespace** onto this route.

### 4.5 Two sources of pure waste

**a) The prewarm cron warms a cache that no longer exists.**
`app/api/cron/prewarm/route.ts` runs every 6 h (`vercel.json`) and fetches
**213 parks × 6 locales = 1,278 URLs** per run — **~5,100 full SSR renders/day**. Its own
docblock still describes the pre-#147 world: _"Park & attraction pages are on-demand ISR
(statically rendered + edge-cached on first request)."_ Since PR #147 they are
`force-dynamic`; there is no ISR entry to populate. This is **~10 % of all invocations,
achieving nothing**, and nobody re-read the docblock after the revert.

**b) A 308 redirect ships a 71 kB uncompressed error document.**
Any out-of-range calendar month — `/wartezeiten-kalender/2025/3`, `/2030/1` — returns
`308` **with a 71,238-byte `id="__next_error__"` HTML body and no `content-encoding`**
(measured; both URLs, byte-identical). 4 % of sampled requests are 308s ≈ 60 K/month
≈ **4.3 GB/month** of egress for responses whose only payload should be a `Location`
header. Crawlers hit these continuously: every month, previously-valid month URLs roll
out of range while crawlers keep requesting them.

---

## 5. Why the obvious fix is already blocked

The three hot routes are `export const dynamic = 'force-dynamic'` and emit
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.

This is not an oversight. The history (`docs/troubleshooting/isr-write-explosion.md`):

- **PR #118** (2026-06-02) made park/attraction pages static ISR → ISR Write Units
  exploded to **220–410 K/day** (one write per unique URL × 6 locales, billed per 8 kB).
- **PR #147** (2026-06-09) reverted to `force-dynamic`, removed `generateStaticParams`.
  Zero shell writes — at the price of zero origin cacheability.
- Setting a CDN header on these routes was attempted **twice** (via `headers()` in
  `next.config.ts:807-836` and via `proxy.ts`), deployed, and reverted both times: a
  dynamic _page_'s own `no-store` always wins. The code comment reads "Do not try this
  again from here."

The only cache layer on these routes today is a Cloudflare dashboard Cache Rule (Edge TTL
override) shipped with PR #288 — out of repo, unverifiable from here, and ineffective
against a long-tail sweep for the reason in §2.

**The site is trapped between two bad options — ISR writes or zero cacheability — and it
is trapped there because the URL space is 60 K wide.** Both options are cheap at 5 K URLs
and expensive at 60 K.

---

## 6. Ranked levers (replaces the spec's phase plan)

| #   | Lever                                                                                                                                   | Attacks        | Est. effect                                                   | Risk                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------- | ----------------------------------- |
| 1   | **Shrink the published crawl surface** — calendar months beyond +3 (12,042 URLs today), and the locale × long-tail-ride matrix (42,912) | invocations    | up to **−60 %** of all invocations                            | SEO decision — owner's call         |
| 2   | **Bot management** at Cloudflare / Vercel Firewall for non-search crawlers                                                              | invocations    | proportional to the (unmeasured) bot mix                      | needs UA data first                 |
| 3   | **Delete or fix the prewarm cron** (§4.5a)                                                                                              | invocations    | **−10 % invocations**, zero user impact                       | none — it is a no-op today          |
| 4   | **Return a bodyless 308** for out-of-range calendar months (§4.5b)                                                                      | bytes          | −4.3 GB/mo                                                    | low                                 |
| 5   | `cache()` around `getParkByGeoPath`, `getParkSlugIndex`                                                                                 | CPU/invocation | removes 1 park transform + 1 212-park index build per request | low, mechanical                     |
| 6   | Narrow the attraction page's park fetch (§4.4)                                                                                          | CPU/invocation | ~60 % less JSON parsed on 38 % of traffic                     | medium — needs a backend projection |
| 7   | `SeasonalBadge` → flat keys, drop the 17.22 kB `parks` namespace                                                                        | bytes          | −3.0 kB brotli on the top route                               | low                                 |
| 8   | Trim park object before it crosses to Client Components (41.3 kB `initialData`)                                                         | bytes          | park page only                                                | low                                 |
| 9   | Stop double-shipping JSON-LD (park page: 15.8 kB)                                                                                       | bytes          | ~15 kB raw                                                    | low                                 |
| 10  | Icon strategy — 111–118 inline SVGs, 51 kB raw/page                                                                                     | bytes          | needs sprite/symbol                                           | medium                              |
| —   | OG route                                                                                                                                | —              | **already 30-day CDN-cached and deterministic — not a lever** | —                                   |

Levers 3–5 and 7–9 are Phase-1-shaped: mechanical, low risk, individually measurable, no
architectural change. Levers 3 and 4 are free — they fix things that are simply broken.
Levers 1–2 are where the money is, and both are decisions rather than refactors.

**Explicitly de-prioritized versus the spec:** backend response DTOs and field selection
(§4.1 — the backend is not on the critical path), historical aggregate materialization
(§4.3 — the recomputation does not exist), and the build matrix (the attraction route has
had no `generateStaticParams` since PR #147; the largest remaining generator is the
glossary at ~1,644 paths, which is a rounding error on the build line).

---

## 7. Phase 0 exit gate

- [x] CPU breakdown for both hot routes
- [x] RSC payload size per route, correlated to the egress figures
- [x] Sequential-await inventory
- [x] Immutable-recompute question answered (negative — see §4.3)
- [ ] **Blocked:** user-agent split. Needs Cloudflare analytics access.
