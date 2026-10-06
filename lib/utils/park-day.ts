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
