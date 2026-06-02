import { parseISO, getISOWeek, getISOWeekYear } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarDay, CrowdLevel } from '@/lib/api/types';

const CROWD_SCORE: Record<string, number> = {
  very_low: 1,
  low: 2,
  moderate: 3,
  high: 4,
  very_high: 5,
  extreme: 6,
};

export interface DayOfWeekStat {
  dayIndex: number; // 0 = Sunday
  avgScore: number;
  sampleSize: number;
}

export interface BestDaysAnalysis {
  /** Best 3 days of week by avg crowd score (ascending) */
  bestDaysOfWeek: DayOfWeekStat[];
  /** Worst 2 days of week */
  worstDaysOfWeek: DayOfWeekStat[];
  /** All days with data, sorted ascending by avg score */
  allDaysOfWeek: DayOfWeekStat[];
  /** Quietest 1-2 days per week within the next 30 days (very_low/low), capped at 8 */
  upcomingQuietDays: CalendarDay[];
  /** Whether school holidays correlate with significantly higher crowds */
  schoolHolidaysAreBusy: boolean;
  /** Total operating days analyzed */
  totalDays: number;
}

export function analyzeBestDays(days: CalendarDay[], timezone?: string): BestDaysAnalysis {
  // "Today" must be in the park's timezone, not the server/UTC day — otherwise a
  // park east/west of UTC can drop the current day (or keep a past one) for a few
  // hours around midnight, e.g. listing a day in "upcoming quiet days" that has
  // already started locally. Fall back to UTC only when no timezone is provided.
  const today = timezone
    ? formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
    : new Date().toISOString().slice(0, 10);

  const futureDays = days.filter(
    (d) =>
      d.date >= today &&
      (d.status === 'OPERATING' || d.status === 'UNKNOWN') &&
      d.crowdLevel &&
      d.crowdLevel !== 'closed' &&
      CROWD_SCORE[d.crowdLevel] !== undefined
  );

  // --- Day-of-week stats ---
  const byDow: Record<number, number[]> = {};
  for (const day of futureDays) {
    // Parse YYYY-MM-DD without timezone shift
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

  // --- Upcoming quiet days (next 30 days) ---
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30Str = in30Days.toISOString().slice(0, 10);

  // Show the 1–2 quietest days per calendar week, not every quiet day: adjacent
  // quiet days in a stretch are redundant for trip planning, and a long flat list
  // is noise. Group the next-30-day quiet days by ISO week, keep the quietest
  // 1–2 each, then cap the overall list.
  const MAX_QUIET_PER_WEEK = 2;
  const MAX_QUIET_TOTAL = 8; // ~4-5 ISO weeks in 30d × up to 2/week, capped
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
  // Coverage-first so the list spans the whole 30-day window instead of
  // front-loading the first weeks: take the single quietest day of EVERY week
  // first, then fill a 2nd day per week up to the cap. Round-1 entries come first
  // in the array, so the cap can only ever trim 2nd-choice days.
  const upcomingQuietDays = [
    ...weeksSorted.map((week) => week[0]),
    ...(MAX_QUIET_PER_WEEK >= 2
      ? weeksSorted.map((week) => week[1]).filter((d): d is CalendarDay => !!d)
      : []),
  ]
    .slice(0, MAX_QUIET_TOTAL)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // --- School holiday impact ---
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
