import type {
  AttractionStatus,
  ParkStatus,
  PerformanceSchedule,
  WorksPeriod,
} from '@/lib/api/types';
import { formatClockTime } from '@/lib/utils/intl-format';
import { worksPeriodOn } from '@/lib/utils/works-period';

/**
 * The start times on a park-local day, or null when no schedule covers it. The twin of the API's
 * `performanceTimesOn()`: schedules never share a day, both bounds are inclusive and either may be
 * open. Compared as `YYYY-MM-DD` strings, so no offset enters a question about the park's calendar.
 *
 * @param day The PARK-local day. Undefined answers null, so a listing that does not know the
 *   park's day shows the ride as its live status says.
 */
export function performanceTimesOn(
  schedules: readonly PerformanceSchedule[] | null | undefined,
  day: string | undefined
): readonly string[] | null {
  if (!schedules || !day) return null;
  const schedule = schedules.find((s) => (!s.from || day >= s.from) && (!s.to || day <= s.to));
  return schedule && schedule.times.length > 0 ? schedule.times : null;
}

/** What decides whether a ride shows its performances today; see {@link performanceTimesShown}. */
export interface PerformanceGate {
  schedules: readonly PerformanceSchedule[] | null | undefined;
  /** The ride's curated works windows (`worksPeriodsOf`). */
  worksPeriods: readonly WorksPeriod[];
  status: AttractionStatus | 'RETIRED';
  parkStatus: ParkStatus | undefined;
  /** The PARK-local day, from the server render. */
  day: string | undefined;
}

/**
 * Today's start times when a ride shows them in place of its wait, else null. The ride's card and
 * its page ask this one question, so the two cannot disagree.
 *
 * Only in an open park, and only while the feed reads OPERATING, CLOSED or UNKNOWN: a feed that
 * does not know the programme reads CLOSED between two performances, which is no closure. DOWN keeps
 * its outage line, REFURBISHMENT and a running works window their works badge.
 */
export function performanceTimesShown({
  schedules,
  worksPeriods,
  status,
  parkStatus,
  day,
}: PerformanceGate): readonly string[] | null {
  if (parkStatus !== 'OPERATING') return null;
  if (status !== 'OPERATING' && status !== 'CLOSED' && status !== 'UNKNOWN') return null;
  if (worksPeriodOn(worksPeriods, day)) return null;
  return performanceTimesOn(schedules, day);
}

/** Where the park's wall clock stands against a day's start times. */
export type NextPerformance = {
  /** The next start, `HH:MM`. */
  time: string;
  /** Whole minutes until it, 0 in the minute it starts. */
  minutesUntil: number;
} | null;

/** `HH:MM` as minutes after midnight. */
function minuteOfDay(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/**
 * The first start at or after the park's current minute, or null when the day's last one has
 * begun. A performance that started a minute ago is gone: the doors close as it begins.
 *
 * @param now The park's wall-clock time, `HH:MM` (`parkWallClock(...).time`).
 */
export function nextPerformance(times: readonly string[], now: string): NextPerformance {
  const nowMinute = minuteOfDay(now);
  for (const time of times) {
    const minutesUntil = minuteOfDay(time) - nowMinute;
    if (minutesUntil >= 0) return { time, minutesUntil };
  }
  return null;
}

/**
 * A start time as the locale writes a clock time: „13:00" in German, „1 PM" in English. The time is
 * already the park's, so it is formatted as a UTC instant in UTC and no zone can move it.
 */
export function formatPerformanceTime(time: string, locale: string): string {
  return formatClockTime(`2000-01-01T${time}:00Z`, locale, 'UTC');
}
