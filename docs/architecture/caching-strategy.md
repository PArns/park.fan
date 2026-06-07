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

| Route      | Render     | revalidate | API Cache | Strategy                                                                  |
| ---------- | ---------- | ---------- | --------- | ------------------------------------------------------------------------- |
| Homepage   | Static ISR | 300 (5m)   | 120s      | Prerendered HTML; data sections via Suspense, live via RQ                 |
| Continent  | Static ISR | 300 (5m)   | 120s      | Geo structure (rarely changes)                                            |
| Country    | Static ISR | 300 (5m)   | 300s      | Prerendered; live park stats via React Query                              |
| City       | Static ISR | 300 (5m)   | 300s      | Prerendered; live park stats via React Query                              |
| Park       | Static ISR | 86400 (1d) | 300s      | On-demand ISR; live wait times + weather via RQ on client                 |
| Attraction | Static ISR | 86400 (1d) | 300s      | Lean shell + JSON-LD; history/forecast chart + live data via RQ on client |
| Search     | Dynamic    | —          | 60s       | `force-dynamic`; uses `cache: 'no-store'`                                 |

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

**Update (Jun 7 2026) — daily shells + lean attraction + no catalog prebuild:**

- **Both shells now revalidate once a day** (`PARK_MAX_AGE`/`ATTRACTION_MAX_AGE = 86400`). The last
  sub-day floors were server-clock reads in the static render (`getServerToday`/`getServerNowMs` in
  the daily chart, history grid, FAQ, opening-hours) — all moved client-side (`useBrowserNow`), so
  the shells are time-independent. Live status/wait times stay fresh via the client poll, so a
  day-old shell never shows stale live data.
- **The attraction route was still the #1 ISR writer** afterwards, because its shell **blocked on
  `getAttractionByGeoPath` and baked the full `history` + `hourlyForecast` time-series into every
  per-attraction × per-locale write**. That detail now loads **client-side** via the CDN-cached
  `/api/parks/.../attractions/<slug>` route (`useAttractionDetail` → the daily chart, history grid
  and accuracy card; `s-maxage=600` + SWR), exactly how the park page offloaded stats/calendar. The
  shell now carries only the lean park snapshot + JSON-LD + FAQ, so each write is far smaller and the
  slow detail fetch can no longer time out and tip the route into dynamic rendering.
- **No more catalog prebuild.** `generateStaticParams` for the park/attraction routes used to
  prerender the most-popular parks (+ their headliner attractions) × 6 locales at build time — pure
  build-time cost + build-time API load, redundant now that every page is on-demand ISR and the
  prewarm cron warms popular pages post-deploy. Each route now returns a single stable seed (Cache
  Components requires ≥1) and everything else is generated on first request.

**Next step (not yet done):** on-demand revalidation — let the backend call a
`revalidateTag`/`revalidatePath` webhook when park/attraction data actually changes, so TTLs can go
beyond a day and time-based write churn nearly disappears. The `best-days:<slug>` tag already exists.

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

- **Refresh on Focus:** Data refreshes when user returns to tab (respects API cache)
- **No Automatic Polling:** Zero background requests to minimize Vercel costs
- **Smart Intervals:** Longer cache for closed parks/rides

### Stale Times by Component

| Component | Open Status | staleTime | Rationale                            |
| --------- | ----------- | --------- | ------------------------------------ |
| Park Data | Open        | 5 min     | Live wait times change frequently    |
| Park Data | Closed      | 1 hour    | Closed parks don't need live updates |
| Search    | -           | 1 min     | Recent searches cached briefly       |
| Calendar  | -           | 5 min     | Schedule rarely changes mid-month    |

### Implementation

```tsx
// lib/hooks/use-live-park-data.ts
const isOpen = park?.status === 'OPERATING';
const staleTime = isOpen ? 5 * 60_000 : 60 * 60_000;

const { data, isFetching } = useQuery({
  queryKey: ['park-live', ...pathParams],
  queryFn: () => fetch(`/api/parks/${pathParams.join('/')}`),
  staleTime,
  refetchOnWindowFocus: true, // Only refresh on user action
  refetchOnReconnect: true,
  // NO refetchInterval - no automatic polling
});

// UI: Subtle loading indicator only during background refetch
{
  isFetching && <Loader2 className="animate-spin" />;
}
```

### Cost Optimization

- **Baseline:** ~2-3 API calls/sec (existing Favorites, Nearby)
- **After Implementation:** ~2-3 API calls/sec (only on focus/reconnect)
- **Impact:** Minimal - no automatic polling
- **Vercel Buffer:** 100k invocations/day = 1.15/sec avg (huge headroom)

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
