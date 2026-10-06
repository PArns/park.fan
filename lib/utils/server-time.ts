/**
 * Server-side „current time" helpers. On per-request pages they are fresh; on prerendered pages
 * they resolve at build or revalidation time, fine for day or year granularity. Live values
 * (countdowns, „x min ago") belong in a Client Component. Kept `async` for the existing callers.
 */

import { parkDayOf } from '@/lib/utils/park-day';

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
  return parkDayOf(Date.now(), timeZone);
}
