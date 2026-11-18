import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import {
  nextPerformance,
  performanceTimesShown,
  type PerformanceGate,
} from '@/lib/utils/performance-schedule';
import type { ParkWallClock } from '@/lib/utils/park-day';

/** True when a park/attraction status string means "not currently operating". */
export function isNotOperating(status: string | undefined): boolean {
  return !!status && status !== 'OPERATING' && status !== 'UNKNOWN';
}

/**
 * Severity-coloured badge class for a wait time in minutes, on the same `waitTimeCrowdTier`
 * thresholds and palette as `WaitTimeValue` and CrowdLevelBadge.
 */
export function waitTimeBadgeClass(minutes: number): string {
  return CROWD_BADGE_CLASS[waitTimeCrowdTier(minutes)];
}

/**
 * What a blog ride reference shows for a ride that starts at set times: the next start (`HH:MM`),
 * `pending` while the park's clock is not read yet, or null when it shows its status or wait as
 * usual. Null without a programme today, in a closed park, during an outage or works, and once the
 * day's last performance has begun. The same gate as the ride's card (`performanceTimesShown`), so
 * a CLOSED between two performances never reads as a closure in a post either.
 *
 * @param clock The park's wall clock (`parkWallClock`), null before the first client tick. Until
 *   then a ride with any programme in an open park is `pending`, so the chip keeps its place.
 */
export function inlinePerformanceSlot(
  gate: Omit<PerformanceGate, 'day'>,
  clock: Pick<ParkWallClock, 'date' | 'time'> | null
): string | 'pending' | null {
  if (!clock) {
    const anyProgramme = !!gate.schedules?.some((s) => s.times.length > 0);
    const shownStatus =
      gate.status === 'OPERATING' || gate.status === 'CLOSED' || gate.status === 'UNKNOWN';
    return anyProgramme && shownStatus && gate.parkStatus === 'OPERATING' ? 'pending' : null;
  }
  const times = performanceTimesShown({ ...gate, day: clock.date });
  return times ? (nextPerformance(times, clock.time)?.time ?? null) : null;
}
