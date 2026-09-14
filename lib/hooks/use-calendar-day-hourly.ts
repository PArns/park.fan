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
 * How long a fetched hourly curve stays fresh in the browser.
 *
 * Five minutes, matching the window `…/calendar/hourly` answers with, because both bound the same
 * staleness: the series is the remaining open hours and moves at the top of every one. Not the
 * month's hour ({@link import('./use-calendar-data').CALENDAR_STALE_TIME_MS}) — a reader who leaves
 * a tab open would otherwise keep a curve whose first bars are long over.
 *
 * Neither window is what actually decides how fresh a curve is: the backend caches this response
 * until park-local midnight and Cloudflare serves it from there (measured 2026-09-14, PAR-217), so
 * a re-fetch after five minutes usually returns the same bytes. What keeps the chart honest in the
 * meantime is `upcomingHourlyPredictions`, which drops the bars whose hour has ended.
 */
export const CALENDAR_HOURLY_STALE_TIME_MS = 5 * 60_000;

/**
 * The hour-by-hour crowd curve for ONE calendar day, fetched on demand.
 *
 * It does not ride along in the month payload, and the reason is the month's cache rather than its
 * size. Measured on 2026-09-14, `includeHourly=all` over a four-day range costs 609 bytes against
 * `none` (4958 vs 4349) because only today and tomorrow ever carry a curve at all — so the payload
 * argument is small. The window is not: that response is shared-cached for a day and held in the
 * browser for an hour, while the curve is scoped to the hour it was fetched in. A day-stable entry
 * carrying an hour-scoped field is the case `docs/architecture/api-budget.md` describes for shows
 * and restaurants, and it ends the same way — the field travels on its own request, with a window
 * of its own.
 *
 * One day per request, so the day the reader opened is the only one paid for, and a park has at
 * most two such URLs in a cache at any time.
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
