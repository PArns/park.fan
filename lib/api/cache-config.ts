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
  nearby: 60, // ⚠️ Using cache: 'no-store' - IP/GeoIP-dependent, must not be cached
  realtime: 120, // ⚠️ Using cache: 'no-store' - live ticker/realtime stats

  // Discovery & Park data. Raised to 24h once the hub pages (continent/country/city) render their
  // ParkCards STATUS-FREE: live status/crowd/wait now come from the client (<LiveParkGrid> →
  // /api/discovery), so the per-locale ISR shells carry only structure (park names/slugs), which
  // changes ~weekly. A new/removed park appears within 24h (or via on-demand revalidate); this
  // collapses the hourly hub-page write churn ~24×.
  geo: 86400, // geo structure changes rarely (was 3600 — hub shells no longer carry live status)
  continents: 86400, // same as geo
  parks: 300, // popular parks frontend data-cached 5 min - slow-moving popularity ranking
  // Shell TTL for the park/attraction static prerender (see PARK_MAX_AGE / ATTRACTION_MAX_AGE in
  // lib/api/parks.ts). The shell is only an SSR seed; live wait times/status come from the client
  // poll via getParkByGeoPathFresh (no-store), so the shell can revalidate every 6h instead of
  // hourly — ~6× fewer park ISR writes, with the live data staying genuinely fresh.
  parkDetail: 21600, // shell revalidate 6h - live wait times via getParkByGeoPathFresh
  waitTimes: 21600, // shell revalidate 6h - live wait times via getParkByGeoPathFresh

  // Static data (still using revalidate)
  calendar: 900, // /v1/parks/:slug/calendar - API: 900s (past/today) / 1800s (future); the forecast under it only changes ~13h, and today's crowdLevel is patched client-side via a separate 5-min today-only fetch — so 5 min here was pure rebuild churn
  weather: 300, // /v1/parks/:slug/weather - API: 3600s
  predictions: 86400, // /v1/parks/:slug/predictions/yearly - API: 86400s
  holidays: 86400, // Holiday data - API: 86400s
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
