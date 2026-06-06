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

| Route      | Render     | revalidate | API Cache | Strategy                                                  |
| ---------- | ---------- | ---------- | --------- | --------------------------------------------------------- |
| Homepage   | Static ISR | 300 (5m)   | 120s      | Prerendered HTML; data sections via Suspense, live via RQ |
| Continent  | Static ISR | 300 (5m)   | 120s      | Geo structure (rarely changes)                            |
| Country    | Static ISR | 300 (5m)   | 300s      | Prerendered; live park stats via React Query              |
| City       | Static ISR | 300 (5m)   | 300s      | Prerendered; live park stats via React Query              |
| Park       | Static ISR | 3600 (1h)  | 300s      | On-demand ISR; live wait times + weather via RQ on client |
| Attraction | Static ISR | 3600 (1h)  | 300s      | On-demand ISR; live wait times via React Query on client  |
| Search     | Dynamic    | —          | 60s       | `force-dynamic`; uses `cache: 'no-store'`                 |

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

**Problem:** Vercel bills an **ISR write** every time a cache unit (route shell or `'use cache'`
data entry) revalidates and is persisted. Under Cache Components, a route shell's effective
revalidate is the **MIN cacheLife of the `'use cache'` reads in its static portion**. The park &
attraction shells are the highest-cardinality routes (`N_parks`/`N_attractions × 6 locales`), so a
short shell TTL multiplied across them dominated the write bill.

**Key insight:** the shells don't need live freshness. Wait times, weather and today's crowd level
are all refreshed **client-side** (React Query, `cache: 'no-store'`); the server-rendered numbers
are only an SSR seed replaced on mount. The shell content that matters for SEO/no-JS (name,
description, attraction list, FAQ, structured data) changes at most daily.

**Changes:**

| Lever                                   | Before        | After        | Effect                                              |
| --------------------------------------- | ------------- | ------------ | --------------------------------------------------- |
| `PARK_MAX_AGE` (park/attraction shell)  | 300s          | **3600s**    | Park + attraction shell writes ~12× fewer (dominant) |
| `getServerNowMs` (`server-time.ts`)     | 300s          | **`'hours'`** | Removes the hidden 5-min floor it pinned on the park shell |
| `getParkHistoricalStats`                | 300s          | **3600s**    | Retry loop already warms cold compute in one fill; data is daily |
| Analytics (`getGlobalStats`/ticker/geo) | 300s          | **600s**     | Minor — single shared keys streamed in homepage Suspense holes |

> Both `PARK_MAX_AGE` **and** `getServerNowMs` had to be raised together: the park shell floor is
> their MIN, so lifting only one would have left it pinned at 300s.

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
| `/v1/parks/*/attractions`  | `revalidate: 3600s`  | 300s      | Shell seed; live via RQ        |
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
