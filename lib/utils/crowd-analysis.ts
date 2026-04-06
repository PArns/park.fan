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
  /** Next quiet days (crowd very_low or low) within 30 days, max 5 */
  upcomingQuietDays: CalendarDay[];
  /** Whether school holidays correlate with significantly higher crowds */
  schoolHolidaysAreBusy: boolean;
  /** Total operating days analyzed */
  totalDays: number;
}

export function analyzeBestDays(days: CalendarDay[]): BestDaysAnalysis {
  const today = new Date().toISOString().slice(0, 10);

  const futureDays = days.filter(
    (d) =>
      d.date >= today &&
      d.status === 'OPERATING' &&
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

  const upcomingQuietDays = futureDays
    .filter((d) => d.date <= in30Str && ['very_low', 'low'].includes(d.crowdLevel as string))
    .slice(0, 5);

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
