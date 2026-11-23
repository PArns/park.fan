/**
 * Cache headers for an API route meant to sit in a shared cache. Two caches sit in front of these
 * routes, Vercel's edge and Cloudflare, and Vercel strips `s-maxage` from `Cache-Control` unless a
 * `CDN-Cache-Control` is present; Cloudflare then falls back to its own default TTL (two hours)
 * and serves stale live data. `CDN-Cache-Control` (RFC 9213) reaches both, and `Cache-Control`
 * stays intact for the browser. A route that must not be shared still answers plain `no-store`.
 * See docs/architecture/cdn-caching.md#api-routes.
 */
export function cdnCacheHeaders(value: string): Record<string, string> {
  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
  };
}

/**
 * The headers for an error response from a route under a shared rule in `next.config.ts`. Every
 * key a rule sets: a response without a header of its own takes that rule's window, Cloudflare
 * reads the rule's `CDN-Cache-Control` ahead of the handler's `Cache-Control`, and Vercel reads a
 * rung route's `Vercel-CDN-Cache-Control` ahead of both, so a failure would be shared.
 */
export const NO_STORE: Record<string, string> = {
  ...cdnCacheHeaders('no-store, must-revalidate'),
  'Vercel-CDN-Cache-Control': 'no-store',
};

/**
 * The two windows of a route whose Vercel copy the backend ends by cache tag: the calendar month,
 * the best-days snapshot and Parky's day tip, each a statement about a park-day that the forecast
 * warmup moves twice a day. See docs/architecture/cdn-caching.md#routes-the-backend-rings.
 */
export interface TagPurgedWindow {
  /**
   * Vercel's CDN, as `Vercel-CDN-Cache-Control`, which Vercel reads ahead of `CDN-Cache-Control`
   * and does not pass on. Long, because `/api/revalidate` ends it for every response carrying one of
   * the route's `Vercel-Cache-Tag` tags; it only binds when no ring comes.
   */
  vercel: string;
  /**
   * Cloudflare and the browser, as `CDN-Cache-Control` and `Cache-Control`. No tag reaches either
   * between deploys, so `s-maxage` plus the stale window is how late a ring can reach a reader; a
   * Cloudflare miss is a hit at Vercel, not a function call.
   */
  edge: string;
}

/**
 * What stands when no ring comes: a day, and a stale day, so that nobody waits for the API's per-day
 * aggregation behind a miss.
 */
const UNTIL_RUNG = 'public, s-maxage=86400, stale-while-revalidate=86400';

/** The calendar month and the best-days snapshot: a ring reaches a reader at most 70 minutes late. */
export const FORECAST_WINDOW: TagPurgedWindow = {
  vercel: UNTIL_RUNG,
  edge: 'public, s-maxage=3600, stale-while-revalidate=600',
};

/**
 * Parky's day tip: the forecast's window, and an hour in the browser, which is as long as the month
 * the dialog shows it on stays fresh there (`CALENDAR_STALE_TIME_MS`).
 */
export const PARKY_TIP_WINDOW: TagPurgedWindow = {
  vercel: UNTIL_RUNG,
  edge: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
};

/**
 * How long Vercel, and then Cloudflare, keep an answer that holds the park's today: how busy the
 * day has been so far moves during the day and no ring announces it. Half an hour at each keeps it
 * at most an hour behind the API, whose current month (where the level so far comes from) is two
 * hours old at most after a warmup and is rebuilt by reads every 15 minutes after that. Shorter
 * would mostly re-read what the API has not changed.
 */
const TODAY_SECONDS = 1800;

/** Parky's tip for the park's today itself, which says how busy the day has been so far. */
export const PARKY_TIP_TODAY_WINDOW: TagPurgedWindow = {
  vercel: `public, s-maxage=${TODAY_SECONDS}`,
  edge: `public, max-age=${TODAY_SECONDS}, s-maxage=${TODAY_SECONDS}`,
};

/**
 * A calendar range that holds the park's today, whose „Heute bisher" is the level so far: the
 * month the grid and the day dialog show, and the today panel's single day. No `max-age`, as for
 * {@link FORECAST_WINDOW}: the tab's copy is TanStack's. Also the `next.config.ts` rule of the
 * calendar relay, which cannot see which days a response holds.
 */
export const CALENDAR_TODAY_WINDOW: TagPurgedWindow = {
  vercel: `public, s-maxage=${TODAY_SECONDS}`,
  edge: `public, s-maxage=${TODAY_SECONDS}`,
};

/**
 * How long „nothing to say" from the tip relay is kept, in every cache including the tab's: the
 * API's own window for its 204. What is left to answer 204 for passes within the day (a spent
 * budget, a failed or refused call), and a ring a day away would keep the dialog empty until then.
 */
export const PARKY_TIP_NONE_SECONDS = 300;

/**
 * Parky's day tip when the API has nothing to say. Also the `next.config.ts` rule, which cannot tell
 * a 204 from a 200 nor today's tip from another day's: under `next start` all of them take these
 * minutes, the shortest of the tip's windows, never a 204 the 200's day.
 */
export const PARKY_TIP_NONE_WINDOW: TagPurgedWindow = {
  vercel: `public, s-maxage=${PARKY_TIP_NONE_SECONDS}`,
  edge: `public, max-age=${PARKY_TIP_NONE_SECONDS}, s-maxage=${PARKY_TIP_NONE_SECONDS}`,
};

/** The `next.config.ts` rule of a route the backend rings: its windows without the tags, which name one park. */
export function tagPurgedCacheRule(window: TagPurgedWindow): { key: string; value: string }[] {
  return [
    { key: 'Cache-Control', value: window.edge },
    { key: 'CDN-Cache-Control', value: window.edge },
    { key: 'Vercel-CDN-Cache-Control', value: window.vercel },
  ];
}

/** The handler's headers of a route the backend rings: the rule's, plus the tags that end Vercel's copy. */
export function tagPurgedCacheHeaders(
  window: TagPurgedWindow,
  tags: string[]
): Record<string, string> {
  const headers: Record<string, string> = { 'Vercel-Cache-Tag': tags.join(',') };
  for (const { key, value } of tagPurgedCacheRule(window)) headers[key] = value;
  return headers;
}
