import { useQuery } from '@tanstack/react-query';
import type { WeatherHourlyToday } from '@/lib/api/types';
import { parkDayOf } from '@/lib/utils/park-day';

interface UseWeatherHourlyParams {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timezone: string | undefined;
  /**
   * The park-local day, `YYYY-MM-DD`; omitted means today, computed at fetch time. A named day
   * goes into the query key, or two days of one park would share a cache entry.
   */
  date?: string;
  /** Gate the fetch (e.g. when static `hourly` data is supplied instead). */
  enabled?: boolean;
}

/**
 * A day's hour-by-hour forecast (temperature, precipitation) for a park location, through the
 * cached `/api/weather/hourly` proxy. The park-local date is always sent, so a
 * stale-while-revalidate serve cannot hand the chart yesterday's day; for today it is computed at
 * fetch time, not in the key, so the 30-minute refetch rolls over at midnight. The upstream
 * reaches about fourteen days and errors past that, so a caller gates on the horizon.
 */
export function useWeatherHourly({
  latitude,
  longitude,
  timezone,
  date,
  enabled = true,
}: UseWeatherHourlyParams) {
  const hasCoords = latitude != null && longitude != null && !!timezone;

  return useQuery<WeatherHourlyToday | null>({
    // `date` only when a caller named one: today must stay out of the key for the midnight
    // rollover.
    queryKey: date
      ? ['weather-hourly', latitude, longitude, timezone, date]
      : ['weather-hourly', latitude, longitude, timezone],
    queryFn: async () => {
      // Today in the park's zone, from the browser clock.
      const day = date ?? parkDayOf(Date.now(), timezone!);
      const response = await fetch(
        `/api/weather/hourly?lat=${latitude}&lon=${longitude}&tz=${encodeURIComponent(timezone!)}&date=${day}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch hourly weather: ${response.statusText}`);
      }

      return (await response.json()) as WeatherHourlyToday;
    },
    // Client-only: under Cache Components, running the query during the static
    // prerender would read Date.now() internally (React Query).
    enabled: enabled && hasCoords && typeof window !== 'undefined',
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}
