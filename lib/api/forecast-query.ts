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

/**
 * Statuses with which the API refuses the server's key on a forecast read: missing, revoked or
 * expired (401), or a park the key does not cover (403).
 */
const KEY_REFUSED = new Set([401, 403]);

let refusalLogged = false;

function noteRefusal(status: number): void {
  if (refusalLogged) return;
  refusalLogged = true;
  console.warn(
    `[forecast] The API refused this server's data key (${status}); pages render without forecasts. Check API_DATA_KEY.`
  );
}

/**
 * Reads `path` with the forecast flag, and once more without it when the API refuses the server's
 * key. A revoked, expired or park-limited site key then costs a page its forecast fields instead
 * of the page; the log says so once per process. `read` rejects with an error carrying the HTTP
 * `status`, as `ApiError` does.
 */
export async function readWithForecast<T>(
  path: string,
  read: (path: string) => Promise<T>
): Promise<T> {
  const flagged = withForecast(path);
  if (flagged === path) return read(path);
  try {
    return await read(flagged);
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    if (typeof status !== 'number' || !KEY_REFUSED.has(status)) throw error;
    noteRefusal(status);
    return read(path);
  }
}

/** {@link readWithForecast} for a plain `fetch`, which answers a refusal rather than throwing. */
export async function fetchWithForecast(url: string, init?: RequestInit): Promise<Response> {
  const flagged = withForecast(url);
  const response = await fetch(flagged, init);
  if (flagged === url || !KEY_REFUSED.has(response.status)) return response;
  noteRefusal(response.status);
  return fetch(url, init);
}
