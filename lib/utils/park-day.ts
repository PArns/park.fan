import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * The calendar day an instant falls on in the park's zone, as `YYYY-MM-DD` (what
 * `ScheduleItem.date` and `CalendarDay.date` carry, and what compares correctly as a string).
 * Uses the cached `en-CA` formatter, since callers run on every minute tick and live poll. An
 * `undefined` zone is the runtime's own; an unusable one throws a `RangeError`. The planner's
 * `parkToday` (`lib/planner/park-time.ts`) answers the same string.
 */
export function parkDayOf(at: Date | number, timeZone: string | undefined): string {
  return getDateTimeFormat('en-CA', { timeZone }).format(at);
}

/** `YYYY-MM-DD` plus `days`, calendar-safe: noon UTC on a plain date, so no zone or DST moves it. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Whole calendar days from `from` to `to`, negative where `to` is earlier: a count of nights, from
 * noon UTC on both sides, so the difference is whole by construction.
 */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
