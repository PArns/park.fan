import { CROWD_BADGE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import {
  nextPerformance,
  performanceTimesShown,
  type PerformanceGate,
} from '@/lib/utils/performance-schedule';
import type { ParkWallClock } from '@/lib/utils/park-day';
import { OFFSEASON_MIN_DAYS, nextParkOpening, operatingHours } from '@/lib/utils/schedule-utils';
import type { ScheduleSummary } from '@/lib/api/types';

/** True when a park/attraction status string means "not currently operating". */
export function isNotOperating(status: string | undefined): boolean {
  return !!status && status !== 'OPERATING' && status !== 'UNKNOWN';
}

/**
 * Whether a CLOSED park is only shut until its next opening day: that opening is ahead of `nowMs`
 * and nearer than {@link OFFSEASON_MIN_DAYS}, the line the park card draws between a few days off
 * and the off season. A park closed during its own hours (weather, an incident), off season or
 * without a known opening stays a closure.
 *
 * @param nowMs The client clock, null before it is read: then a park with opening hours today
 *   counts, so the first paint already matches the common case of a park shut overnight.
 */
export function isClosedForNow(
  park: {
    status?: string;
    timezone?: string;
    todaySchedule?: ScheduleSummary | null;
    nextSchedule?: ScheduleSummary | null;
  },
  nowMs: number | null
): boolean {
  if (park.status !== 'CLOSED') return false;
  if (nowMs === null) return operatingHours(park.todaySchedule) !== null;
  const opening = nextParkOpening(
    park.todaySchedule,
    park.nextSchedule,
    park.timezone ?? 'UTC',
    nowMs
  );
  return opening !== null && Date.parse(opening.at) - nowMs < OFFSEASON_MIN_DAYS * 86_400_000;
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
