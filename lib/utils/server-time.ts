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

/** Current epoch milliseconds, captured at cache-fill time. Refreshes every ~5 min. */
export async function getServerNowMs(): Promise<number> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 900 });
  return Date.now();
}

/** Today's date as `YYYY-MM-DD` in the given IANA timezone. Refreshes hourly. */
export async function getServerToday(timeZone: string): Promise<string> {
  'use cache';
  cacheLife('hours');
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
