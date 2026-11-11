/**
 * The API leaves the forecast fields of a mixed route (park detail, ride detail, `/stats/day`,
 * `/favorites`) out unless the request carries `forecast=true` and a key; the server's `x-auth-key`
 * counts as one. A query flag rather than the key alone, because Cloudflare caches by URL and would
 * otherwise hand the server the copy it cached for a caller without a key (backend
 * `docs/frontend/api-keys.md`).
 */
export const FORECAST_QUERY = 'forecast=true';

/**
 * Whether this server holds a key the API takes for forecasts: its data key (`API_DATA_KEY`), or the
 * throttle bypass key (`API_AUTH_KEY`) until the API stops accepting it there. Without either,
 * `forecast=true` turns a page's read into a 401; leaving the flag off renders the page without its
 * forecast fields instead, which is what a preview or a local checkout without secrets gets.
 */
export function serverHoldsForecastKey(): boolean {
  return Boolean(process.env.API_DATA_KEY || process.env.API_AUTH_KEY);
}

/** `path` with the forecast flag added to its query string, when the server can open it. */
export function withForecast(path: string): string {
  if (!serverHoldsForecastKey()) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${FORECAST_QUERY}`;
}
