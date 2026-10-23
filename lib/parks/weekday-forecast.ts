import type { CalendarDay } from '@/lib/api/types';
import { isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import type { OutlookDay, OutlookHoliday } from '@/lib/utils/yearly-outlook';

/** One coming date of a weekday, as the park header's weekday panel lists it. */
export interface WeekdayForecastDate {
  /** Park-local `YYYY-MM-DD`. */
  date: string;
  day: OutlookDay;
  holiday: OutlookHoliday | null;
}

/** How many of a weekday's coming dates the panel lists: six weeks, the span most trips are planned in. */
export const WEEKDAY_FORECAST_DATES = 6;

/**
 * A `/best-days` day in the outlook's shape, so both panels draw a day the same way. The snapshot
 * carries neither a wait nor a recommendation, and no holiday names.
 */
function forecastDay(day: CalendarDay): { day: OutlookDay; holiday: OutlookHoliday | null } {
  const level = day.predictedCrowdLevel ?? day.crowdLevel;
  const closed = day.status === 'CLOSED' || level === 'closed';

  const holiday: OutlookHoliday = {};
  if (day.isHoliday) holiday.isHoliday = true;
  if (day.isSchoolVacation || day.isSchoolHoliday) holiday.isSchoolVacation = true;
  if (day.isBridgeDay) holiday.isBridgeDay = true;

  return {
    day: { level: closed ? 'closed' : isColoredCrowdLevel(level) ? level : 'unknown' },
    holiday: Object.keys(holiday).length > 0 ? holiday : null,
  };
}

/**
 * The next `limit` dates of `weekday` (`0` = Sunday) from the park's today on, out of the
 * `/best-days` snapshot (today plus 90 days). A snapshot fetched yesterday still starts yesterday,
 * so `todayIso` is the cut, not the first entry.
 */
export function upcomingWeekdayForecast(
  days: CalendarDay[],
  weekday: number,
  todayIso: string,
  limit: number = WEEKDAY_FORECAST_DATES
): WeekdayForecastDate[] {
  return days
    .filter(
      (day) =>
        day.date >= todayIso && new Date(`${day.date}T12:00:00Z`).getUTCDay() === weekday
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((day) => ({ date: day.date, ...forecastDay(day) }));
}
