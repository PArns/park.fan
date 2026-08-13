# Caching Strategy

## Philosophy: Respect API Cache Headers

**Important Change (Feb 2026):** The frontend now uses `cache: 'no-store'` for live data endpoints to **respect API cache headers** and avoid double-caching (Frontend + API).

The API already implements aggressive caching:

- **Redis cache**: 5 min for integrated responses
- **HTTP cache headers**: 120s for live data, 60s for search
- **Cloudflare CDN**: Additional edge caching with `stale-while-revalidate`

By using `cache: 'no-store'`, Next.js respects the API's `Cache-Control` headers instead of adding an additional caching layer.

---

## ISR (Incremental Static Regeneration)

Next.js ISR controls revalidation per route:

| Route      | Render     | revalidate | API Cache | Strategy                                                                 |
| ---------- | ---------- | ---------- | --------- | ------------------------------------------------------------------------ |
| Homepage   | Static ISR | 3600 (1h)  | 120s      | Prerendered HTML; live counts/statuses overlay client-side via RQ        |
| Continent  | Static ISR | 86400 (1d) | 120s      | Geo structure (rarely changes); live counts via `useGeoLiveStats`        |
| Country    | Static ISR | 86400 (1d) | 300s      | Prerendered status-free; live park stats via React Query                 |
| City       | Static ISR | 86400 (1d) | 300s      | Prerendered status-free; live park stats via React Query                 |
| Park       | Dynamic    | —          | 300s      | `force-dynamic` (zero shell writes); data-cache snapshot + live via RQ   |
| Attraction | Dynamic    | —          | 300s      | `force-dynamic` (zero shell writes); detail client-loaded via /api route |
| Search     | Dynamic    | —          | 60s       | `force-dynamic`; uses `cache: 'no-store'`                                |

> **Temperature unit & static park pages:** weather/calendar values are server-rendered
> in BOTH °C and °F and toggled purely by CSS (`.u-metric` / `.u-imperial`, driven by
> `html[data-temp-unit]` which an inline script in the root layout sets before paint — see
> `components/common/unit-display.tsx`). This removed the per-request `temp_unit` cookie
> read, and the park/attraction fetches (`getParkByGeoPath`, `getAttractionByGeoPath`,
> `getParkWeatherNowcast`, the `stats` retry) render as on-demand ISR (edge-cached) with no
> unit flash. Live wait times/weather stay fresh via client-side React Query (`LiveParkData` /
> `useWeatherNowcast`, 5-min poll).

---

## Minimizing ISR Writes (Jun 2026)

**Root cause:** park & attraction pages were **dynamic** (no ISR writes at all) until they were
switched to **static ISR with `revalidate: 300`** (the dual-unit CSS / on-demand-ISR change). That
flipped ISR writes on across the _entire_ catalog × 6 locales — Vercel ISR Write Units went from
near-zero to ~250k/day. Vercel bills an **ISR write** every time a cache unit (route shell or
`'use cache'` data entry) revalidates and is persisted, and under Cache Components a route shell's
effective revalidate is the **MIN cacheLife of the `'use cache'` reads in its static portion**. The
park & attraction shells are the highest-cardinality routes (`N_parks`/`N_attractions × 6 locales`),
so the 5-min floor multiplied across them dominated the bill.

**Key insight:** the shells don't need live freshness. Wait times, **open/closed status**, weather
and today's crowd level are all refreshed **client-side** (React Query, `cache: 'no-store'`,
5-min poll + refetch on mount/focus — see `use-live-park-data.ts`); the server-rendered values are
only an SSR seed replaced on mount. **For any visitor with JS the shell TTL is invisible** — it only
governs first paint, no-JS visitors and crawlers. The shell content that matters for SEO/no-JS
(name, description, attraction list, FAQ, structured data) changes at most daily.

**Changes:**

| Lever                                   | Before | After         | Effect                                                                  |
| --------------------------------------- | ------ | ------------- | ----------------------------------------------------------------------- |
| `PARK_MAX_AGE` (park shell)             | 300s   | **3600s**     | Park shell writes ~12× fewer; keeps schedule/status reasonably fresh    |
| `ATTRACTION_MAX_AGE` (attraction shell) | 300s   | **21600s**    | Dominant route (highest cardinality, no schedule in shell) → ~72× fewer |
| `getServerNowMs` (`server-time.ts`)     | 300s   | **`'hours'`** | Removes the hidden 5-min floor it pinned on the park shell              |
| `getParkWeatherNowcast` (shell seed)    | 900s   | **3600s**     | Was capping the park shell at 15 min; client poll stays fresh           |
| `getParkHistoricalStats`                | 300s   | **3600s**     | Retry loop already warms cold compute in one fill; data is daily        |
| `getPopularParks`                       | 300s   | **1800s**     | Slow-moving ranking; feeds generateStaticParams + home seed             |
| `pickHeroImage` (homepage shell)        | 300s   | **`'hours'`** | Decorative rotation pinned the 6-locale homepage to 5-min writes        |
| Analytics (`getGlobalStats`/ticker/geo) | 300s   | **600s**      | Minor — single shared keys streamed in homepage Suspense holes          |

> The park shell floor is the **MIN** of `getParkByGeoPath`, `getServerNowMs` **and**
> `getParkWeatherNowcast` — all three had to be raised together, otherwise the lowest one would
> have kept the shell pinned (e.g. the nowcast alone capped it at 15 min).

**Update (Jun 7 2026) — 7-day shells + lean ISR snapshot + warm-by-prebuild:**

- **Both shells revalidate every 7 days** (`PARK_MAX_AGE`/`ATTRACTION_MAX_AGE = 604800`). The shell
  carries only day-stable, SEO-relevant structure (name, attraction list + links, FAQ, JSON-LD,
  summary stats); every "today/now" value and all live data (status, wait times, weather, history,
  forecast) is client-derived, so a 7-day-old shell never shows stale live data to a JS visitor. 7d
  cuts time-based ISR-write **frequency** ~7× vs 1 day.
  - Reaching 7d meant raising **every** `'use cache'` read in the shells' MIN — they were all on a
    1-day floor that silently capped the 7-day shell: `getCurrentYear` (Footer → every route),
    `getParkSlugIndex` + its nested `getGeoStructure`, the park `generateStaticParams` geo read, and
    `getParksNearLocation` (NearbyParksSection). Always verify with `next build`'s per-route
    `revalidate` column — a single nested short cacheLife caps the whole route.
- **Lean ISR snapshot (write _size_).** `leanParkForShell` (baked into every per-park/per-attraction
  × per-locale write and serialized as `initialData`) now also strips the heavy per-attraction
  `statistics.history` sparkline series — the biggest size chunk. The live no-store poll
  (`leanParkForLive`) keeps the full data; the card sparkline is `history ?? []`, re-supplied
  client-side. FAQ (summary stats) + SEO links are unaffected.
- **Attraction detail** (`history` + `hourlyForecast`) loads **client-side** via the CDN-cached
  `/api/parks/.../attractions/<slug>` route (`useAttractionDetail`; `s-maxage=600` + SWR) — off the
  ISR shell entirely.
- **Warm by prebuild + cron (no cold renders).** `generateStaticParams` prebuilds the **top ~20
  popular parks** × 6 locales — warm with full SEO HTML on preview + prod from the first request; the
  attraction long-tail and less-popular parks stay on-demand (single seed). Prebuilding **every** park
  (~156) was tried but overran a fresh Vercel build — too many cold `getParkByGeoPath` fetches, and a
  single fetch error inside a `'use cache'` boundary fails the whole prerender (a local build hid it
  via `.next/cache`). The **prewarm cron** (`vercel.json`, every 6 h) warms the rest of the popular
  set in prod + recovers from eviction. (Preview only warms the top ~20 — Vercel crons don't run on
  previews.)

**Next step (not yet done):** on-demand revalidation — backend webhook → `revalidateTag` when
park/attraction data actually changes, so TTLs can go to ∞ and time-based writes nearly vanish. The
`best-days:<slug>` tag already exists.

> **⚠️ Superseded (Jul 2026):** the PPR/Cache-Components model described below was later
> abandoned. Current state: `cacheComponents` is **off** (`next.config.ts`), the park and
> attraction routes are **`export const dynamic = 'force-dynamic'`** with **no
> `generateStaticParams`** (only the continent/country/city hub pages still prebuild), and the
> shell values come from the shared Data Cache (`PARK_REVALIDATE` / `ATTRACTION_REVALIDATE` in
> `lib/api/parks.ts`) instead of ISR page shells. The summary table at the top of this page
> reflects the current model; the sections below are kept as historical context for why.

**Architecture decision (Jun 2026, superseded — see above) — keep Cache Components (PPR); accept cold-fill writes.**

We evaluated moving the high-cardinality routes (attraction/park) to **dynamic + CDN** (no ISR
writes). It is **not possible while `cacheComponents: true`**: both escape hatches fail the build —
`connection()` outside `<Suspense>` → _"Uncached data accessed outside of `<Suspense>`"_, and
`export const dynamic = 'force-dynamic'` → _"not compatible with `nextConfig.cacheComponents`"_. PPR
**requires** every route to have a static, ISR-persisted shell. We keep PPR (the SSR shells are worth
it for SEO) and accept its write model.

**Write model under PPR** (verified locally with `NEXT_PRIVATE_DEBUG_CACHE=1` + per-fetch logging —
both routes cache correctly, **MISS→HIT**, ~1 write then served):

- **Cold-fill** — first generation of a path: the shell + ~1 PPR segment per route level (attraction
  ≈ 7) + shared `'use cache'` data. **Inherent.** Happens per unique path on first crawl, after
  eviction, and after **every deploy** (a deploy resets the ISR cache → full re-fill). This is the
  dominant volume — tens of thousands of attraction paths × 6 locales, **crawler-driven** (not user
  traffic: a park click is ~1 write, then HIT). **Not reducible in code under PPR** — only
  operationally (fewer deploys; Vercel ISR is durable, so warm paths stay warm).
- **Time-based** — re-write every TTL. Currently 7 d → **0** with on-demand revalidation.

**Levers (priority):** ① on-demand revalidation (kills time-based writes; needs the backend webhook)
· ② fewer prod deploys (each is a full catalog re-fill) · ③ lean shell + `initialPark` trim (smaller
writes + better retention → less eviction — done) · ④ long TTL (done, 7 d). The per-cold-fill
**count** (shell + segments) can't be lowered without flattening the URL (breaks SEO) — it's the
price of PPR for a deep, high-cardinality route.

**Update (Jun 22 2026) — homepage "Global Stats" + "Live Activity" server-rendered into the shell.**

The homepage sections from **Global Stats** downward now render **server-side into the 5-min static
shell** instead of client-fetching their data. This removes three React Query hooks (and their
no-store `/api/...` round-trips) from the home bundle — less client JS competing with the
render-blocking CSS on first paint (the home-page LCP bottleneck) — and bakes the stats into the
prerendered HTML (SEO / no-JS). The visitor-facing trade-off is ≤5-min staleness, which is exactly
the hero/shell rotation window.

- `GlobalStatsSection` → `async` server component: `getGlobalStats(300)` + server-side background
  resolution (`getParkBackgroundImage` / `getAttractionBackgroundImage`). Deleted `use-global-stats.ts`
  and `use-park-backgrounds.ts` (now unused — `/api/parks/backgrounds` has no internal caller left).
- `LiveActivitySection` / `LiveActivityGrid` → per-continent open counts come from `getGeoLiveStats(300)`
  (props); `useGeoLiveStats` is no longer used on the homepage (it stays for the geo pages).
- **Featured ("beliebte") parks** → `FeaturedParksSlot` / `PopularParksGrid` are now server components
  rendering `extractFeaturedParks(getGeoStructure(300))` directly (homepage, blog, glossary, howto). The
  old `/api/featured-parks` client poll returned that **same** 300s-cached geo data, so it was pure
  overhead — route + `featured-parks-section-client.tsx` deleted.
- `getGlobalStats` / `getGeoLiveStats` now take a `revalidate` arg (default 600); the homepage passes
  **300** so the Data Cache entry shares the shell's revalidate window. This **supersedes the 600s row
  above** for the `realtime` + `geo-live` keys (ticker stays 600s, still client-streamed).

**Update (Jul 2026) — hourly homepage shell + client-live overlays (write-regression fix).**

The Jun 22 change above re-created the write problem it had once been designed around: a 5-min
static shell × 6 locales × ~600 KB HTML+RSC per regeneration (Vercel bills ISR writes **per 8 KB
stored**, so one homepage regeneration ≈ 75 units) ≈ **45–100k write units/day** — the entire Jun
19–Jul 2 bill of 614k units. Two mechanisms drove it:

1. **Shell churn:** `export const revalidate = 300` × 288 windows/day × 6 locales.
2. **Fetch pinning:** a static route's effective ISR window is the **MIN of all its `fetch`
   revalidates** — `getGeoStructure(300)` (featured slot), `getGlobalStats(300)`,
   `getGeoLiveStats(300)`, `getTickerData()`@600 and `ml.ts`@1800 all pinned routes down; the
   featured slot pinned **blog, glossary-term and howto pages** to 5 min too, and re-wrote the
   ~114 KB geo Data-Cache entry 288×/day.

Fix (mirrors the park/hub-page **shell + client-overlay** model — the shell carries day-stable
structure, everything "now" is client-refreshed):

| Lever                                        | Before           | After                                                             |
| -------------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| Homepage `export const revalidate`           | 300              | **3600** (~12× fewer shell writes)                                |
| `getGlobalStats` / `getGeoLiveStats` default | 600 (home: 300)  | **3600** — SSR seed only                                          |
| `getTickerData` (shell seed)                 | 600              | **3600** via arg; proxy keeps 600 for polls                       |
| `getMLDashboard` / `getMLMetricsHistory`     | 1800             | **3600**                                                          |
| Featured slot `getGeoStructure`              | 300              | **default (24h)** — structure-only baking                         |
| "Open parks" counts (global + per-continent) | baked, ≤5m       | client overlay: `useGlobalStats` / `useGeoLiveStats` (5-min poll) |
| Featured card status/crowd/wait/schedule     | baked, ≤5m       | client overlay: `FeaturedParkCardsLive` → `useRegionParks`        |
| Hero photo rotation                          | per 5-min window | re-picked per regeneration (~hourly)                              |

Net effect: the "live" numbers are now **fresher** than before (5-min client poll + refetch on
focus vs. a baked 5-min snapshot), while homepage shell writes drop ~12× and the geo entry drops
from 288 to ~1 write/day. `/{locale}/parks` inherits the 3600s default for its baked counts.

> **Rule of thumb before giving any route a static shell:** writes/day ≈ locales ×
> (86400 / revalidate) × (stored size / 8 KB) × traffic-utilization. And check `next build`'s
> revalidate column — one forgotten 300s fetch pins the whole route back down.

**On-demand revalidation is now available** (`/api/revalidate`, POST, secret-protected): the
backend can `revalidateTag` (`geo`, `parks`, `attractions`, `analytics`, `popular-parks`, `ml`,
`weather`, `best-days:<slug>`) or `revalidatePath` when data **actually changes** — the
"read first, only write on change" model. Time-based TTLs remain only as a fallback, so they can
be raised further once the backend webhook is live. See
[backend-integration](../api/backend-integration.md#on-demand-revalidation).

**Update (Jul 2026) — blog park/ride references got the same overlay.**

Blog posts are fully statically generated (`generateStaticParams`, no `revalidate`), and every
park/ride reference in them was resolved **once, at build time** through `lib/blog/park-resolver.ts`
(geo structure @24h + attraction detail @24h). So a post built while the park was shut kept
serving that snapshot for as long as the page lived — which is how the Phantasialand guide showed
all twelve of its coasters as "Geschlossen" in the middle of an operating day.

The shell keeps the build-time resolution (SEO / no-JS still get a fully rendered card), and the
browser lays live values over it. Both sources are **batch calls shared via React Query**, so the
cost is per _park_ named in the post, not per reference:

| Surface                                      | Live source                                          | Notes                                                              |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Park badge, hover preview, `?full` spotlight | `useRegionParks` → `/api/discovery/{cont}/{country}` | Same hook the hub/featured grids use — often already in cache      |
| Ride badge, hover preview, `?full` spotlight | `useParkWaitTimes` → `/api/parks/.../wait-times`     | Lean park-wide snapshot: ~9 KB vs ~95 KB for the full park payload |
| Today's avg/peak + card sparkline            | `useAttractionDetail` → `.../attractions/<slug>`     | Lazy: only once a card is on screen or a hover preview opens       |

Status and wait always come from the 5-min batch even where the detail payload also carries them,
so a card's badge can't disagree with the inline badge next to it in the prose. The park rule
("closed park ⇒ closed rides") is applied on both sides — `resolveAttraction` server-side and
`overlayAttraction` client-side.

Files: `lib/blog/use-blog-live.ts` (hooks), `lib/blog/live-overlay.ts` (pure merges),
`lib/hooks/use-park-wait-times.ts`, `components/blog/blog-{park,attraction}-card-live.tsx`.

> The same trap applies to **any** statically generated page that embeds a live value: baking it
> is only safe if the page's revalidate window is shorter than the value's meaningful lifetime.
> For "open / closed / N min" that window is minutes, so it belongs in a client overlay.

---

## API Cache Headers (Backend)

The API sets the following `Cache-Control` headers:

- **Search**: `max-age=60` (1 min) + `stale-while-revalidate=60`
- **Discovery/Geo**: `max-age=120` (2 min) + `stale-while-revalidate=120`
- **Parks/Wait Times/Attractions**: `max-age=300` (5 min) + `stale-while-revalidate=600`
- **Analytics/Stats**: `max-age=120` (2 min) + `stale-while-revalidate=120`
- **Calendar**: `max-age=300-3600` (5 min for past, 1h for future)
- **Weather/Schedule**: `max-age=3600` (1 hour) + `stale-while-revalidate=7200`
- **Predictions**: `max-age=86400` (24 hours) + `stale-while-revalidate=172800`
- **Holidays**: `max-age=86400` (24 hours) + `stale-while-revalidate=172800`

---

## Next.js Headers

In `next.config.ts`:

- **`/api/*`**: `Cache-Control: no-store, must-revalidate`
- **`/:locale/search`**: `Cache-Control: no-store, must-revalidate`
- **Referrer-Policy**: `origin-when-cross-origin` global

---

## The HTML never reaches Cloudflare's cache (Aug 2026)

Measured against production, every HTML response — prerendered or dynamic — comes back
`cf-cache-status: DYNAMIC`, while `/_next/static/*` and `/_next/image` are `HIT`. So the asset
layer works and the document layer does not: every page view travels to Vercel `iad1` (US East),
including the European traffic this site mostly serves.

| Response                          | Vercel                 | Cloudflare |
| --------------------------------- | ---------------------- | ---------- |
| `/de`, `/nl/woordenboek/…` (ISR)  | `x-vercel-cache: HIT`  | `DYNAMIC`  |
| Park / attraction page            | `x-vercel-cache: MISS` | `DYNAMIC`  |
| `/_next/static/*`, `/_next/image` | `HIT`                  | `HIT`      |

Two things cause it, and only one of them is ours:

**1. Cloudflare does not cache HTML by default.** Its standard cache level only stores static file
extensions, whatever the origin's `Cache-Control` says — and Vercel hands prerendered pages to the
client as `public, max-age=0, must-revalidate`, keeping the `s-maxage` for its own edge. So no
header we can emit turns this on; it takes a **Cache Rule** in the dashboard.

**2. We made the responses uncacheable anyway.** next-intl's middleware wrote
`Set-Cookie: NEXT_LOCALE=…` on every document response whose resolved locale differed from what
`Accept-Language` would pick — most international traffic. A `Set-Cookie` disqualifies a response
from every shared cache in front of the origin, so the rule above would have skipped exactly those
pages. `proxy.ts` now drops the header on non-redirect responses; an explicit language switch
still persists the cookie from the client (`lib/i18n/remember-locale.ts`), which is the only case
where remembering a choice means anything. Nothing in this codebase reads the cookie — next-intl
uses it to resolve the unprefixed `/`, and without it that falls back to `Accept-Language`, the
same header the cookie was derived from.

### What a Cache Rule has to get right

Park and attraction pages are the case worth caching: they are `force-dynamic`, so **every** view
is a full render (`x-vercel-cache: MISS`, always), yet the structure comes from a data cache with
`PARK_REVALIDATE = 86400` and every live value is client-loaded. The HTML is already up to a day
old — rendering it per request buys no freshness at all, and an edge TTL costs none.

- **Edge TTL: override origin.** The page sends `private, no-cache, no-store` (what Next emits for
  `force-dynamic`), and nothing at the origin can change that — see below. The rule has to ignore
  the origin here, which is safe only because the response carries nothing visitor-specific: no
  `cookies()`, no `headers()`, no request IP anywhere in the park page tree, and the temperature
  unit is server-rendered in both units and switched by CSS.
- **Exclude `/api/` from the matcher.** This one is not optional, and it is easy to miss because
  Cloudflare's `wildcard` operator matches across `/`: `/*/parks/*/*/*/*` also catches
  `/api/parks/europe/germany/rust/europa-park`, where the first `*` absorbs `api`. Paired with the
  Edge TTL override that puts the 60-second live wait-time poll into a two-hour edge cache —
  measured as `no-store` from the origin answered with `HIT` and a climbing `age`, i.e. every
  visitor of a park seeing the same wait times for two hours. Add `URI Path does not start with
/api/` as a second condition.
- **Keep the query string in the cache key.** Next distinguishes RSC payloads from HTML with the
  `_rsc` search parameter precisely because CDNs ignore `Vary` (the response carries
  `Vary: rsc, next-router-state-tree, …`, which Cloudflare does not honour). Strip query params
  from the key and a prefetch payload will be served to a browser asking for a document.
- **Leave the unprefixed `/` alone.** It answers with a redirect whose `Location` depends on
  `Accept-Language`; `proxy.ts` tags those `Vary: Accept-Language` and they must not be cached.
- **This does not bring ISR writes back.** Nothing is persisted at the origin — the render still
  happens per request on a miss, the copy lives in Cloudflare. That matters given the Jun 2026
  bill above, and it is the reason to do this at the CDN rather than by giving up `force-dynamic`.

### Why the TTL lives in the dashboard and not in this repo

The override is the unpleasant part of that rule: it is what forces the `/api/` exclusion, and it
puts a number that governs production into a form field nobody reviews. The alternative would be
"use cache-control header if present" — every route carrying its own window, `no-store` protecting
itself. That needs an `s-maxage` on the page response, and there is no way to put one there.

Measured Aug 2026, both routes in, both lost against the page's own `Cache-Control`:

| Attempt                           | Marker header | `Cache-Control` |
| --------------------------------- | ------------- | --------------- |
| `headers()` in `next.config.ts`   | arrives       | page's value    |
| Response header set in `proxy.ts` | arrives       | page's value    |

The `headers()` attempt was deployed to production, not just tried locally: the rule matched (a
marker header on the same `source` arrived on the park URL and correctly not on the `/de/parks/
europe` hub) and the deployment had rolled out (the `data-dpl-id` in the HTML changed first), yet
the response still carried `private, no-cache, no-store, max-age=0, must-revalidate`. The older
"verified against the dev server" note turned out to hold on Vercel too.

So the remaining origin-side lever is giving up `force-dynamic`, which is the ISR-write trade this
whole page exists to avoid. Don't re-run these two experiments.

Worth watching after enabling: Vercel's own usage should stay flat except for a drop in function
invocations. If ISR Write Units move at all, the rule is not what caused it.

### The second rule: `/api/`, and why this one needs no override

The `/api` routes were the opposite case, and the contrast is the useful part. Their windows have
been tuned per route in `next.config.ts` for a long time (300 s for the attraction detail and the
calendar, an hour for stats, a day for the media catalog) and Vercel's edge honoured them —
`x-vercel-cache: HIT` — but Cloudflare answered `DYNAMIC` for all of them, because it caches
nothing under `/api/` without a rule either. So the ride detail every ride-page visitor loads was
being served from `iad1` while its own header said it could sit in a PoP for five minutes.

The rule matches `starts_with "/api/"` + `method eq "GET"`, marks it eligible, and sets Edge TTL to
**"use cache-control header if present, bypass cache if not"** — deliberately not the override the
page rule needs. Every route then carries its own window, and everything that must not be shared
protects itself by already answering `no-store`. Verified against production after enabling:

| Route                                 | Sends            | Cloudflare |
| ------------------------------------- | ---------------- | ---------- |
| `…/attractions/:slug`                 | `s-maxage=300`   | MISS → HIT |
| `…/calendar`                          | `s-maxage=300`   | MISS → HIT |
| `…/stats`                             | `s-maxage=3600`  | MISS → HIT |
| `/api/media`                          | `s-maxage=86400` | MISS → HIT |
| `/api/nearby`                         | `no-store`       | BYPASS     |
| `/api/favorites`                      | `no-store`       | BYPASS     |
| `/api/search`, `/api/analytics/*`     | `no-store`       | BYPASS     |
| `/api/parks/<geo>/<park>` (live poll) | `no-store`       | BYPASS     |

`/api/nearby` is the one to keep an eye on when editing these: it falls back to geolocating the
request IP when the client sends no coordinates, so its response is per-visitor. It is safe here
only because it answers `no-store` and the rule respects that. Give it an `s-maxage` and a shared
cache will hand one visitor's location result to the next.

---

## Discovery / Geo-Structure Cache

`lib/utils/redirect-utils.ts` caches the geo structure for redirect lookups:

- **TTL:** 1 hour
- **Source:** `getGeoStructure(86400)` (24h cache on API side)

---

## Client Cache Strategy (lib/api/)

**Most live data endpoints now use `cache: 'no-store'`** to respect API cache headers:

| Endpoint                   | Frontend Strategy     | API Cache | Reason                                                                     |
| -------------------------- | --------------------- | --------- | -------------------------------------------------------------------------- |
| `/v1/search`               | `cache: 'no-store'`   | 60s       | Always fresh search results                                                |
| `/v1/analytics/*`          | `cache: 'no-store'`   | 120s      | Real-time statistics                                                       |
| `/v1/parks/*` (detail)     | `revalidate: 3600s`   | 300s      | Shell seed; live via RQ                                                    |
| `/v1/parks/*/attractions`  | `revalidate: 21600s`  | 300s      | Shell seed; live via RQ                                                    |
| `/v1/discovery/geo`        | `revalidate: 3600s`   | 120s      | Geo structure (rarely changes)                                             |
| `/v1/discovery/continents` | `revalidate: 3600s`   | 120s      | Geo structure (rarely changes)                                             |
| Calendar (grid)            | `cache: 'no-store'`   | 300-3600s | Grid tab hours+weather; live via RQ                                        |
| Best-days (`/best-days`)   | `revalidate: 259200s` | 3600s     | Precomputed snapshot; `best-days:<slug>` tag revalidated by backend warmup |
| Weather                    | `revalidate: 3600s`   | 3600s     | Forecast data (changes hourly)                                             |
| Predictions                | `revalidate: 86400s`  | 86400s    | ML predictions (changes daily)                                             |

**Why `cache: 'no-store'` for live data?**

- Prevents double-caching (Next.js Data Cache + API Redis Cache + Cloudflare CDN)
- Respects API's optimized `Cache-Control` headers with `stale-while-revalidate`
- Ensures users always get fresh data on page load (no stale wait times)

---

## React Query Client-Side Caching (Feb 2026)

**New:** Live data updates using React Query with smart refresh intervals.

### Strategy

- **5-min auto-poll:** `refetchInterval` keeps wait times/status live while the page is open (catches
  opening/closing), regardless of park status
- **Refresh on focus / reconnect:** also refreshes when the user returns to the tab or reconnects
- **Stale SSR seed:** `initialDataUpdatedAt: 0` anchors the baked shell value as stale, so the hook
  refetches live data immediately on mount (a 7-day shell never shows stale live data to a JS visitor)

### Stale Times by Component

| Component | Open Status | staleTime | Rationale                                              |
| --------- | ----------- | --------- | ------------------------------------------------------ |
| Park Data | Open/Closed | 5 min     | 5-min staleTime + 5-min poll (catches opening/closing) |
| Search    | -           | 1 min     | Recent searches cached briefly                         |
| Calendar  | -           | 5 min     | Schedule rarely changes mid-month                      |

### Implementation

```tsx
// lib/hooks/use-live-park-data.ts
const isOpen = park?.status === 'OPERATING';
const staleTime = isOpen ? 5 * 60_000 : 60 * 60_000;

const { data, isFetching } = useQuery({
  queryKey: ['park-live', ...pathParams],
  queryFn: () => fetch(`/api/parks/${pathParams.join('/')}`),
  staleTime,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 5 * 60_000, // 5-min live poll while the page is open
  initialDataUpdatedAt: 0, // SSR seed is stale → refetch live data on mount
});

// UI: Subtle loading indicator only during background refetch
{
  isFetching && <Loader2 className="animate-spin" />;
}
```

### Cost Optimization

- **Live polling:** ~one `/api/parks/...` call per open page every 5 min (+ on focus/reconnect),
  served `no-store` through the CDN-collapsed proxy — a function response, **not** an ISR write
- **Vercel Buffer:** 100k invocations/day = 1.15/sec avg (plenty of headroom)

### Files

- `lib/hooks/use-live-park-data.ts` - Smart refresh intervals
- `lib/hooks/use-calendar-data.ts` - Calendar caching
- `components/parks/live-park-data.tsx` - Wrapper component
- `components/search/search-bar.tsx` - Search caching
- `lib/providers.tsx` - QueryClient configuration

---

## Related

- [System Overview](system-overview.md)
- Backend: [Caching Strategy](https://github.com/park-fan/v4.api.park.fan/blob/main/docs/architecture/caching-strategy.md)
