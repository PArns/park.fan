import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * The calendar day an instant falls on in the park's zone, as `YYYY-MM-DD`.
 *
 * `en-CA` because it formats exactly that way, and `YYYY-MM-DD` is what `ScheduleItem.date` and
 * `CalendarDay.date` carry and what compares correctly as a string. Deriving it from an ISO string
 * would give UTC's day instead of the park's.
 *
 * Through the cached formatter (`lib/utils/intl-format.ts`): the `toLocaleDateString('en-CA',
 * { timeZone })` this replaces built a new `Intl.DateTimeFormat` on every call, and several callers
 * run on every minute tick and every live poll. The output is the same string.
 *
 * An `undefined` zone is the runtime's own (the reader's, in a browser), which is what
 * `toLocaleDateString('en-CA', {})` gave. An unusable zone throws a `RangeError` like the built-in
 * does; a caller that has to survive one catches it.
 *
 * The planner keeps its own `parkToday` (`lib/planner/park-time.ts`); both answer the same string.
 */
export function parkDayOf(at: Date | number, timeZone: string | undefined): string {
  return getDateTimeFormat('en-CA', { timeZone }).format(at);
}
