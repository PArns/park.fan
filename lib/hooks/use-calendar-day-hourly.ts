import { useQuery } from '@tanstack/react-query';
import type { HourlyPrediction } from '@/lib/api/types';

/** What `/api/parks/<geo>/<park>/calendar/hourly?date=…` answers: the day it was asked for, and
 *  that day's curve. `hourly` is empty on every day the backend has no curve for. */
interface CalendarDayHourlyResponse {
  date: string;
  hourly: HourlyPrediction[];
}

interface UseCalendarDayHourlyParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** `YYYY-MM-DD` in the park's timezone — the day the detail dialog is showing. */
  date: string | null;
  /**
   * Whether this day can carry a curve at all — today or tomorrow in the PARK's timezone, which
   * is the only span the backend has one for. The caller works that out from the park-local date
   * rather than from `CalendarDay.isTomorrow`: that field is declared and never sent (see its
   * docstring), so a gate on it is false for ever.
   */
  enabled: boolean;
}

/**
 * How long a fetched hourly curve stays fresh in the browser: five minutes, the window the route
 * answers with, because the series is the remaining open hours and moves every hour. The backend
 * caches it until park-local midnight anyway; what keeps the chart honest is
 * `upcomingHourlyPredictions`, which drops the bars whose hour has ended.
 */
export const CALENDAR_HOURLY_STALE_TIME_MS = 5 * 60_000;

/**
 * The hour-by-hour crowd curve for one calendar day, fetched on demand rather than in the month
 * payload: the month is cached for a day, the curve only for the hour, so it travels on its own
 * request with its own window (see docs/architecture/api-budget.md). One day per request, so only
 * the day the reader opened is paid for.
 */
export function useCalendarDayHourly({
  continent,
  country,
  city,
  parkSlug,
  date,
  enabled,
}: UseCalendarDayHourlyParams) {
  return useQuery<HourlyPrediction[]>({
    queryKey: ['calendar-hourly', continent, country, city, parkSlug, date],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/calendar/hourly?date=${date}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch hourly forecast: ${response.statusText}`);
      }

      const data: CalendarDayHourlyResponse = await response.json();
      return data.hourly ?? [];
    },
    enabled: enabled && !!date,
    staleTime: CALENDAR_HOURLY_STALE_TIME_MS,
    gcTime: 2 * CALENDAR_HOURLY_STALE_TIME_MS,
    retry: 1,
  });
}
