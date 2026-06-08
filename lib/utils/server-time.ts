/**
 * Server-side "current time" helpers.
 *
 * With Cache Components disabled, server code may read `new Date()` / `Date.now()` directly. On the
 * `force-dynamic` park/attraction/home pages these resolve per request (always fresh); on the
 * statically-prerendered pages (Footer year, etc.) they resolve at build time, which is fine for
 * display values where day/year granularity is enough. For truly live values (countdowns,
 * "x min ago"), use a Client Component instead.
 *
 * They remain `async` so existing `await` call sites and `Promise` return types are unaffected.
 */

/** Current calendar year (for copyright lines). */
export async function getCurrentYear(): Promise<number> {
  return new Date().getFullYear();
}

/** Current epoch milliseconds. */
export async function getServerNowMs(): Promise<number> {
  return Date.now();
}

/** Today's date as `YYYY-MM-DD` in the given IANA timezone. */
export async function getServerToday(timeZone: string): Promise<string> {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}
