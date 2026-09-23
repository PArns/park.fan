import type { ScheduleItem } from '@/lib/api/types';

/**
 * Whether the park's day is over at `atMs`: it does not operate today, or today's last
 * operating window has closed. `null` when the schedule cannot say — no entry for today in the
 * park's timezone, or an operating entry without a closing time.
 *
 * Read off the SCHEDULE, not off wait times or showtimes, and that is the point of it. The
 * park page renders from a structure snapshot that is cached for up to a day
 * (`PARK_REVALIDATE` in `lib/api/parks.ts`), so the waits and showtimes in the first HTML can be
 * yesterday's, and the first live poll replaces them straight after mount. A layout decided from
 * those grew or shrank one poll after every load. The schedule covers the next 17 days, so a
 * day-old snapshot still carries today's entry, and the poll does not change it.
 *
 * `ParkTodayPanel` asks this once, with the server's clock, and keeps the answer for the visit.
 */
export function isParkDayOver(
  schedule: readonly ScheduleItem[] | null | undefined,
  timezone: string,
  atMs: number
): boolean | null {
  if (!schedule?.length) return null;
  const today = new Date(atMs).toLocaleDateString('en-CA', { timeZone: timezone });
  const entries = schedule.filter((s) => s.date === today);
  if (entries.length === 0) return null;
  const operating = entries.filter((s) => s.scheduleType === 'OPERATING');
  if (operating.length === 0) return true;
  let lastClose = -Infinity;
  for (const s of operating) {
    const close = s.closingTime ? new Date(s.closingTime).getTime() : NaN;
    if (!Number.isFinite(close)) return null;
    lastClose = Math.max(lastClose, close);
  }
  return atMs >= lastClose;
}
