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
  // /api/parks/live), so the per-locale ISR shells carry only structure (park names/slugs), which
  // changes ~weekly. This collapsed the hourly hub-page write churn ~24×.
  //
  // Then to a week, because 24h was still a clock running against a doorbell. `getGeoMenu()` is
  // awaited in `app/[locale]/layout.tsx`, so this TTL was the SHORTEST fetch revalidate on the
  // whole locale tree and therefore set the ISR clock for every prerendered page under it —
  // including 222 blog tag pages and the static pages, which reach the network not at all. 2,992
  // pages re-rendered daily to produce the same bytes.
  //
  // The doorbell is `revalidateTag('geo')`, and the backend already rings it: park rename
  // (park-rename.service.ts), park merge, attraction merge and attraction retirement all POST
  // `["geo", "parks", "attractions"]` to /api/revalidate. What it does NOT ring for is a newly
  // ingested park, so that one case now takes up to a week to reach the nav menu and the hub
  // lists. It is a small case and a small delay: the park's own page is `force-dynamic` and
  // therefore live and servable the moment the API knows about it — only its appearance in the
  // header menu and the city hub waits.
  geo: 604800, // 7d — structure changes rarely; real changes arrive via the `geo` tag
  continents: 604800, // same as geo
  parks: 300, // popular parks frontend data-cached 5 min - slow-moving popularity ranking
  // Data-Cache TTL for the park/attraction structure fetch (see PARK_REVALIDATE /
  // ATTRACTION_REVALIDATE in lib/api/parks.ts). The pages render force-dynamic; this only gates
  // the shared fetch cache for the SSR seed. Live wait times/status come from the client poll via
  // getParkByGeoPathFresh (no-store), and all "today/now" content is client-derived, so the
  // cached structure can revalidate once a day and live data still stays fresh.
  parkDetail: 86400, // structure fetch 1d - live wait times via getParkByGeoPathFresh
  waitTimes: 86400, // structure fetch 1d - live wait times via getParkByGeoPathFresh

  // Static data (still using revalidate)
  calendar: 900, // /v1/parks/:slug/calendar - API: 900s (past/today) / 1800s (future); the forecast under it only changes ~13h, and today's crowdLevel is patched client-side via a separate 5-min today-only fetch — so 5 min here was pure rebuild churn
  weather: 300, // /v1/parks/:slug/weather - API: 3600s
  predictions: 86400, // /v1/parks/:slug/predictions/yearly - API: 86400s
  holidays: 86400, // Holiday data - API: 86400s
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
