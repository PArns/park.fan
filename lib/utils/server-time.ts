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

/** Current calendar year (for copyright lines). Refreshes daily. */
export async function getCurrentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

/**
 * Current epoch milliseconds, captured at cache-fill time. Refreshes hourly.
 *
 * Consumers only need day-granular precision (calendar month boundaries, "today's" schedule
 * lookup, the yyyy-MM-dd date in structured data). The previous 5-min cadence pinned every
 * route shell that reads this (the park page) to a 5-min revalidate floor — forcing a fresh
 * ISR write per park × locale every 5 min regardless of the park TTL. Hourly removes that
 * hidden floor; for truly live values use a Client Component instead.
 */
export async function getServerNowMs(): Promise<number> {
  'use cache';
  cacheLife('hours');
  return Date.now();
}

/** Today's date as `YYYY-MM-DD` in the given IANA timezone. Refreshes hourly. */
export async function getServerToday(timeZone: string): Promise<string> {
  'use cache';
  cacheLife('hours');
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
