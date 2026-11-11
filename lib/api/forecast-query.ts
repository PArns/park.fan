/**
 * The API leaves the forecast fields of a mixed route (park detail, ride detail, `/stats/day`,
 * `/favorites`) out unless the request carries `forecast=true` and a key; the server's `x-auth-key`
 * counts as one. A query flag rather than the key alone, because Cloudflare caches by URL and would
 * otherwise hand the server the copy it cached for a caller without a key (backend
 * `docs/frontend/api-keys.md`).
 */
export const FORECAST_QUERY = 'forecast=true';

/** `path` with the forecast flag added to its query string. */
export function withForecast(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}${FORECAST_QUERY}`;
}
