import { cacheLife } from 'next/cache';

/**
 * Cache-Components-safe "current time" helpers.
 *
 * Under `cacheComponents`, reading `new Date()` / `Date.now()` directly in a server
 * render is forbidden (it would bake a non-deterministic value into the static shell).
 * These helpers read the clock inside a `'use cache'` boundary, so the value is captured
 * at cache-fill time and refreshed on the given cadence — correct for display values
 * (copyright year, "today") where a few minutes/hours of staleness is fine. For truly
 * live values (countdowns, "x min ago"), use a Client Component instead.
 */

/**
 * Current calendar year (for copyright lines). Read in the Footer, which is part of EVERY route's
 * static prerender — so its cacheLife is a global MIN that pins every route's revalidate. At 'days'
 * it silently capped park/attraction at 1-day (defeating the 7-day shell TTL). 'weeks' lifts that
 * floor; the year still self-corrects within a week of Jan 1, which is plenty for a footer.
 */
export async function getCurrentYear(): Promise<number> {
  'use cache';
  cacheLife('weeks');
  return new Date().getFullYear();
}

/**
 * Current epoch milliseconds, captured at cache-fill time. Refreshes daily.
 *
 * Consumers only need day-granular precision (calendar month boundaries, "today's" schedule
 * lookup, the yyyy-MM-dd date in structured data). This is read in the park/attraction static
 * shell, so its cacheLife is the MIN that pins the whole route's revalidate: at 'hours' it
 * silently capped park/attraction at a 1h revalidate, defeating the intended 6h TTL (a hidden
 * per-park × per-locale write multiplier). 'days' lifts that floor so the 6h shell TTL actually
 * applies; for truly live values use a Client Component instead.
 */
export async function getServerNowMs(): Promise<number> {
  'use cache';
  cacheLife('days');
  return Date.now();
}

/** Today's date as `YYYY-MM-DD` in the given IANA timezone. Refreshes hourly. */
export async function getServerToday(timeZone: string): Promise<string> {
  'use cache';
  cacheLife('hours');
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
