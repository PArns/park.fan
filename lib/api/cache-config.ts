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
  search: 300, // frontend data-cached 5 min - navigation metadata, not live data
  nearby: 60, // ⚠️ Using cache: 'no-store' - IP/GeoIP-dependent, must not be cached
  realtime: 120, // ⚠️ Using cache: 'no-store' - live ticker/realtime stats

  // Discovery & Park data
  geo: 3600, // geo structure changes rarely
  continents: 3600, // same as geo
  parks: 300, // popular parks frontend data-cached 5 min - slow-moving popularity ranking
  parkDetail: 300, // revalidate 300s (ISR-cacheable) - live wait times refreshed client-side
  waitTimes: 300, // revalidate 300s (ISR-cacheable) - live wait times refreshed client-side

  // Static data (still using revalidate)
  calendar: 900, // /v1/parks/:slug/calendar - API: 900s (past/today) / 1800s (future); the forecast under it only changes ~13h, and today's crowdLevel is patched client-side via a separate 5-min today-only fetch — so 5 min here was pure rebuild churn
  weather: 300, // /v1/parks/:slug/weather - API: 3600s
  predictions: 86400, // /v1/parks/:slug/predictions/yearly - API: 86400s
  holidays: 86400, // Holiday data - API: 86400s
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
