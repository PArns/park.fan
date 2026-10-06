import { parseISO, getISOWeek, getISOWeekYear } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

const CROWD_SCORE: Record<string, number> = {
  very_low: 1,
  low: 2,
  moderate: 3,
  high: 4,
  very_high: 5,
  extreme: 6,
};

/** Inverse of `CROWD_SCORE`: bucket an average crowd score back into a level. */
export function scoreToCrowdLevel(score: number): ColoredCrowdLevel {
  if (score <= 1.5) return 'very_low';
  if (score <= 2.5) return 'low';
  if (score <= 3.5) return 'moderate';
  if (score <= 4.5) return 'high';
  if (score <= 5.5) return 'very_high';
  return 'extreme';
}

/** Average crowd score for one weekday over the analysed days. */
export interface DayOfWeekStat {
  dayIndex: number; // 0 = Sunday
  avgScore: number;
  sampleSize: number;
}

/** What the best-days section says about a park's upcoming calendar. */
export interface BestDaysAnalysis {
  /** Best 3 weekdays by average crowd score, ascending. */
  bestDaysOfWeek: DayOfWeekStat[];
  /** Worst 2 weekdays. */
  worstDaysOfWeek: DayOfWeekStat[];
  /** All days with data, sorted ascending by avg score */
  allDaysOfWeek: DayOfWeekStat[];
  /** The quietest one or two days per week in the next 30 days (very_low/low), at most 8. */
  upcomingQuietDays: CalendarDay[];
  /** Whether school holidays correlate with significantly higher crowds */
  schoolHolidaysAreBusy: boolean;
  /** Total operating days analyzed */
  totalDays: number;
}

/** Weekday stats, upcoming quiet days and the school-holiday effect from a park's calendar days. */
export function analyzeBestDays(
  days: CalendarDay[],
  /** Epoch ms for „now"; pass a cached value (`getServerNowMs`) for cacheComponents safety. */
  nowMs: number,
  timezone?: string
): BestDaysAnalysis {
  const now = new Date(nowMs);
  // „Today" in the park's zone, not the server's, or a park far from UTC drops today (or keeps a
  // past day) around midnight. UTC only when no zone is given.
  const today = timezone
    ? formatInTimeZone(now, timezone, 'yyyy-MM-dd')
    : now.toISOString().slice(0, 10);

  const futureDays = days.filter(
    (d) =>
      d.date >= today &&
      (d.status === 'OPERATING' || d.status === 'UNKNOWN') &&
      d.crowdLevel &&
      d.crowdLevel !== 'closed' &&
      CROWD_SCORE[d.crowdLevel] !== undefined
  );

  const byDow: Record<number, number[]> = {};
  for (const day of futureDays) {
    // Parse YYYY-MM-DD without a timezone shift.
    const [y, m, d] = day.date.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    const score = CROWD_SCORE[day.crowdLevel as CrowdLevel];
    if (score !== undefined) {
      (byDow[dow] ??= []).push(score);
    }
  }

  const dowStats: DayOfWeekStat[] = Object.entries(byDow)
    .filter(([, scores]) => scores.length >= 2)
    .map(([dow, scores]) => ({
      dayIndex: Number(dow),
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      sampleSize: scores.length,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);

  const in30Days = new Date(nowMs);
  in30Days.setDate(in30Days.getDate() + 30);
  const in30Str = in30Days.toISOString().slice(0, 10);

  // The one or two quietest days per ISO week, not every quiet day: a run of adjacent quiet days
  // is redundant for planning.
  const MAX_QUIET_PER_WEEK = 2;
  const MAX_QUIET_TOTAL = 8;
  const quietByWeek = new Map<string, CalendarDay[]>();
  for (const d of futureDays) {
    if (d.date > in30Str) continue;
    if (!['very_low', 'low'].includes(d.crowdLevel as string)) continue;
    const wd = parseISO(d.date);
    const weekKey = `${getISOWeekYear(wd)}-${getISOWeek(wd)}`;
    const bucket = quietByWeek.get(weekKey);
    if (bucket) bucket.push(d);
    else quietByWeek.set(weekKey, [d]);
  }
  // Quietest-first within each week, weeks in chronological order.
  const weeksSorted = [...quietByWeek.values()]
    .map((week) =>
      [...week].sort(
        (a, b) =>
          (CROWD_SCORE[a.crowdLevel as string] ?? 3) - (CROWD_SCORE[b.crowdLevel as string] ?? 3)
      )
    )
    .sort((a, b) => (a[0].date < b[0].date ? -1 : 1));
  // Coverage first: every week's quietest day, then a second per week up to the cap, so the list
  // spans the whole window and the cap only ever trims second choices.
  const upcomingQuietDays = [
    ...weeksSorted.map((week) => week[0]),
    ...(MAX_QUIET_PER_WEEK >= 2
      ? weeksSorted.map((week) => week[1]).filter((d): d is CalendarDay => !!d)
      : []),
  ]
    .slice(0, MAX_QUIET_TOTAL)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const schoolDays = futureDays.filter((d) => d.isSchoolHoliday || d.isSchoolVacation);
  const normalDays = futureDays.filter(
    (d) => !d.isSchoolHoliday && !d.isSchoolVacation && !d.isHoliday && !d.isPublicHoliday
  );

  const avg = (arr: CalendarDay[]) =>
    arr.length === 0
      ? 3
      : arr.reduce((sum, d) => sum + (CROWD_SCORE[d.crowdLevel as string] ?? 3), 0) / arr.length;

  const schoolHolidaysAreBusy = schoolDays.length >= 3 && avg(schoolDays) > avg(normalDays) + 0.5;

  return {
    allDaysOfWeek: dowStats,
    bestDaysOfWeek: dowStats.slice(0, 3),
    worstDaysOfWeek: [...dowStats].reverse().slice(0, 2),
    upcomingQuietDays,
    schoolHolidaysAreBusy,
    totalDays: futureDays.length,
  };
}
