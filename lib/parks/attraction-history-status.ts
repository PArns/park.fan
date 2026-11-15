import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';

/** What one day of a ride's history calendar says about the ride. */
export type AttractionHistoryStatus =
  | 'OPEN'
  /** A free-flow ride ran that day without a wait to measure (PAR-1359). */
  | 'NO_WAIT'
  | 'CLOSED_RIDE'
  | 'NOT_YET_OPEN'
  | 'PARK_CLOSED'
  | 'UNKNOWN';

/**
 * A history day's status: a measured curve is a running day, a free-flow day without a wait is a
 * walk-on day, and a day without either reads from the park's schedule. A day of an open park with
 * no reading is the ride standing, today only once it has passed; a future day says nothing.
 */
export function attractionHistoryStatus(
  historyData: AttractionHistoryDay | undefined,
  scheduleData: ScheduleItem | undefined,
  when: 'past' | 'today' | 'future'
): AttractionHistoryStatus {
  if ((historyData?.hourlyP90?.length ?? 0) > 1) return 'OPEN';
  if (historyData?.withoutWait) return 'NO_WAIT';
  if (!scheduleData) return 'UNKNOWN';
  if (scheduleData.scheduleType !== 'OPERATING') return 'PARK_CLOSED';
  if (when === 'today') return 'NOT_YET_OPEN';
  return when === 'past' ? 'CLOSED_RIDE' : 'UNKNOWN';
}

/** Whether the ride ran on any day of the window, which decides between a grid and one line. */
export function historyHasARunningDay(
  statuses: readonly { attractionStatus: AttractionHistoryStatus }[]
): boolean {
  return statuses.some((d) => d.attractionStatus === 'OPEN' || d.attractionStatus === 'NO_WAIT');
}
