/**
 * Cache TTL configuration aligned with API cache headers.
 * These values are coordinated with the backend API to ensure
 * optimal freshness while avoiding unnecessary requests.
 *
 * Rule: Frontend cache should never be shorter than API cache,
 * as it would only increase request count without fresher data.
 */
export const CACHE_TTL = {
  // Live data (1-2 minutes) - critical for UX
  search: 60, // /v1/search - fastest freshness for search results
  nearby: 60, // /v1/discovery/nearby - critical for homepage "Nearby Parks"
  realtime: 120, // /v1/analytics/realtime - Most/Least Crowded on homepage

  // Discovery & Park data (2 minutes)
  geo: 120, // /v1/discovery/geo - geo navigation with live status
  continents: 120, // /v1/discovery/continents/* - country/city lists
  parks: 120, // /v1/parks - park lists with status
  parkDetail: 120, // /v1/parks/:c/:co/:city/:park - park detail page
  waitTimes: 120, // /v1/parks/:slug/wait-times - wait times view

  // Static data (longer cache)
  calendar: 3600, // /v1/parks/:slug/calendar - rarely changes
  weather: 3600, // /v1/parks/:slug/weather - weather forecast
  predictions: 86400, // /v1/parks/:slug/predictions/yearly - ML predictions (24h)
  holidays: 86400, // Holiday data (24h)
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
