import type { ScheduleItem } from '@/lib/api/types';
import { parkDayOf } from '@/lib/utils/park-day';

/**
 * Whether the park's day is over at `atMs`: no operation today, or today's last window has closed.
 * `null` when the schedule cannot say. Read off the schedule rather than waits or showtimes: the
 * park page's cached snapshot can carry yesterday's waits, which the first poll replaces, and a
 * layout decided from them jumped one poll after every load. `ParkTodayPanel` asks once, with the
 * server's clock.
 */
export function isParkDayOver(
  schedule: readonly ScheduleItem[] | null | undefined,
  timezone: string,
  atMs: number
): boolean | null {
  if (!schedule?.length) return null;
  const today = parkDayOf(atMs, timezone);
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
