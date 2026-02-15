/**
 * Cache TTL configuration aligned with API cache headers.
 *
 * IMPORTANT: Most live data endpoints now use cache: 'no-store' to respect
 * API cache headers and avoid double-caching (Frontend + API).
 *
 * The API already implements aggressive caching:
 * - Redis cache (5 min for integrated responses)
 * - HTTP cache headers (120s for live data, 60s for search)
 * - Cloudflare CDN caching
 *
 * These TTL values are kept for documentation and for endpoints that still
 * use revalidate (calendar, weather, static data).
 */
export const CACHE_TTL = {
  // Live data - NOW USING cache: 'no-store' to respect API headers
  // API cache: 60s (search), 120s (analytics), 300s (parks, wait times)
  search: 60, // ⚠️ Using cache: 'no-store' - respects API 60s cache
  nearby: 60, // ⚠️ Using cache: 'no-store' - respects API cache
  realtime: 120, // ⚠️ Using cache: 'no-store' - respects API 120s cache

  // Discovery & Park data - Using cache: 'no-store' for live data
  geo: 120, // ⚠️ Still using revalidate - geo structure changes rarely
  continents: 120, // ⚠️ Still using revalidate - geo structure changes rarely
  parks: 300, // ⚠️ Using cache: 'no-store' for live park lists - respects API 300s cache
  parkDetail: 300, // ⚠️ Using cache: 'no-store' - respects API 300s cache
  waitTimes: 300, // ⚠️ Using cache: 'no-store' - respects API 300s cache

  // Static data (still using revalidate)
  calendar: 3600, // /v1/parks/:slug/calendar - API: 300s (past) / 3600s (future)
  weather: 3600, // /v1/parks/:slug/weather - API: 3600s
  predictions: 86400, // /v1/parks/:slug/predictions/yearly - API: 86400s
  holidays: 86400, // Holiday data - API: 86400s
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
