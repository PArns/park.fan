import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * The planner's clock, which is the PARK's clock.
 *
 * Every time and every date in the planner is derived from the park's IANA zone.
 * The reader's own offset is never used — not for "today", not for the now line,
 * not for a label. `PlanDay.timezone` has been fetched and serialized since the
 * endpoint existed and was read by nothing.
 *
 * The reason is not tidiness. `add-to-planner-button.tsx` computed today from
 * `getTimezoneOffset()` and used it as the **localStorage key** an entry is
 * filed under, so between 18:00 and midnight in Berlin a Magic Kingdom ride
 * landed on tomorrow's plan for a park where it was early afternoon. That is a
 * misfiling, not a mislabelling, and the visitor's only way to find the entry
 * again would be to guess which day it went to.
 */

/**
 * `YYYY-MM-DD` in the park's own reading.
 *
 * `en-CA` because it formats exactly that way — the same convention
 * `use-today-schedule.ts` already follows. Deriving it from an ISO string would
 * give UTC's date, which is the bug this function exists to stop.
 */
export function parkToday(timeZone: string, now: number = Date.now()): string {
  return getDateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

/**
 * Park-local minutes since midnight.
 *
 * Through the cached formatter: the now line ticks, and a fresh
 * `Intl.DateTimeFormat` per tick is the mistake `wait-time-sparkline-card`
 * already paid for at ~400 constructions a minute.
 *
 * `hourCycle: 'h23'` rather than `hour12: false`, which yields `24` for midnight
 * in several runtimes and would put the now line an entire day down the grid.
 */
export function parkMinuteNow(timeZone: string, now: number = Date.now()): number {
  const parts = getDateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/**
 * Minutes since park-local midnight as `10:30`.
 *
 * Takes MINUTES, never a `Date`, which is what keeps the reader's timezone out
 * of the grid entirely: there is no instant here to convert, so there is nothing
 * for a well-meaning `toLocaleTimeString` to convert wrongly.
 *
 * Past midnight is folded back, so a park closing at 25:00 labels its last hour
 * `01:00` rather than `25:00`.
 */
export function formatGridTime(minute: number): string {
  const wrapped = ((Math.round(minute) % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const rest = wrapped % 60;
  return `${String(hour).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` plus `days`, calendar-safe. Dates here are park-local strings. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
