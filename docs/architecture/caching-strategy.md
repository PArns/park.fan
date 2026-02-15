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

| Route      | revalidate | API Cache | Strategy                                |
| ---------- | ---------- | --------- | --------------------------------------- |
| Homepage   | Dynamic    | 120s      | Uses `cache: 'no-store'` for live stats |
| Continent  | 3600 (1h)  | 120s      | Geo structure (rarely changes)          |
| Country    | 300 (5min) | 300s      | Live park stats                         |
| City       | 300 (5min) | 300s      | Live park stats                         |
| Park       | 300 (5min) | 300s      | Live wait times                         |
| Attraction | 300 (5min) | 300s      | Live wait times                         |
| Search     | Dynamic    | 60s       | Uses `cache: 'no-store'`                |

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
| `/v1/parks/*` (detail)     | `cache: 'no-store'`  | 300s      | Live wait times and status     |
| `/v1/parks/*/attractions`  | `cache: 'no-store'`  | 300s      | Live wait times                |
| `/v1/discovery/geo`        | `revalidate: 120s`   | 120s      | Geo structure (rarely changes) |
| `/v1/discovery/continents` | `revalidate: 120s`   | 120s      | Geo structure (rarely changes) |
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
