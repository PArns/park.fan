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

| Route      | Render     | revalidate  | API Cache | Strategy                                                                  |
| ---------- | ---------- | ----------- | --------- | ------------------------------------------------------------------------- |
| Homepage   | Static ISR | 300 (5m)    | 120s      | Prerendered HTML; data sections via Suspense, live via RQ                 |
| Continent  | Static ISR | 300 (5m)    | 120s      | Geo structure (rarely changes)                                            |
| Country    | Static ISR | 300 (5m)    | 300s      | Prerendered; live park stats via React Query                              |
| City       | Static ISR | 300 (5m)    | 300s      | Prerendered; live park stats via React Query                              |
| Park       | Static ISR | 604800 (7d) | 300s      | Prebuilt (top ~20 popular) + lean shell; live data via RQ on client       |
| Attraction | Static ISR | 604800 (7d) | 300s      | Lean shell + JSON-LD; history/forecast chart + live data via RQ on client |
| Search     | Dynamic    | —           | 60s       | `force-dynamic`; uses `cache: 'no-store'`                                 |

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

**Architecture decision (Jun 2026) — keep Cache Components (PPR); accept cold-fill writes.**

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
- `getGlobalStats` / `getGeoLiveStats` now take a `revalidate` arg (default 600); the homepage passes
  **300** so the Data Cache entry shares the shell's revalidate window. This **supersedes the 600s row
  above** for the `realtime` + `geo-live` keys (ticker stays 600s, still client-streamed).

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

## Discovery / Geo-Structure Cache

`lib/utils/redirect-utils.ts` caches the geo structure for redirect lookups:

- **TTL:** 1 hour
- **Source:** `getGeoStructure(86400)` (24h cache on API side)

---

## Client Cache Strategy (lib/api/)

**Most live data endpoints now use `cache: 'no-store'`** to respect API cache headers:

| Endpoint                   | Frontend Strategy    | API Cache | Reason                         |
| -------------------------- | -------------------- | --------- | ------------------------------ |
| `/v1/search`               | `cache: 'no-store'`  | 60s       | Always fresh search results    |
| `/v1/analytics/*`          | `cache: 'no-store'`  | 120s      | Real-time statistics           |
| `/v1/parks/*` (detail)     | `revalidate: 3600s`  | 300s      | Shell seed; live via RQ        |
| `/v1/parks/*/attractions`  | `revalidate: 21600s` | 300s      | Shell seed; live via RQ        |
| `/v1/discovery/geo`        | `revalidate: 3600s`  | 120s      | Geo structure (rarely changes) |
| `/v1/discovery/continents` | `revalidate: 3600s`  | 120s      | Geo structure (rarely changes) |
| Calendar                   | `revalidate: 3600s`  | 300-3600s | Schedule data (changes daily)  |
| Weather                    | `revalidate: 3600s`  | 3600s     | Forecast data (changes hourly) |
| Predictions                | `revalidate: 86400s` | 86400s    | ML predictions (changes daily) |

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
