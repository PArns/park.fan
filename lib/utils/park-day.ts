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

/** A written day with month name and year, the default of {@link formatParkDay}. */
const LONG_DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

/** A park-local `YYYY-MM-DD` at noon UTC, the instant no zone moves to another day. */
function parkDayInstant(isoDay: string): Date {
  return new Date(`${isoDay}T12:00:00Z`);
}

/**
 * A park-local `YYYY-MM-DD` as a written date in `locale`. Anchored at noon UTC and formatted in
 * UTC, so no zone moves the day; long month and year unless `options` says otherwise.
 */
export function formatParkDay(
  locale: string,
  isoDay: string,
  options: Intl.DateTimeFormatOptions = LONG_DAY
): string {
  const day = parkDayInstant(isoDay);
  if (Number.isNaN(day.getTime())) return isoDay;
  return getDateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(day);
}

/**
 * Two park-local days as one range in `locale`'s own shape: „16.–27. November 2026", „4. Januar –
 * 25. März 2027", one date where both are the same day. `formatRange` drops what the two ends
 * share, which no hand-built „{from} – {to}" can do in six languages.
 */
export function formatParkDayRange(
  locale: string,
  fromIso: string,
  toIso: string,
  options: Intl.DateTimeFormatOptions = LONG_DAY
): string {
  const from = parkDayInstant(fromIso);
  const to = parkDayInstant(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return `${formatParkDay(locale, fromIso, options)} – ${formatParkDay(locale, toIso, options)}`;
  }
  return (
    getDateTimeFormat(locale, { ...options, timeZone: 'UTC' })
      .formatRange(from, to)
      // CLDR's Italian range pattern pads the day („04 gennaio") although `day: 'numeric'` asks
      // for no padding, in Node and in Chromium alike.
      .replace(/(^|\D)0(\d)/g, '$1$2')
  );
}
