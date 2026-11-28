import { useQuery } from '@tanstack/react-query';
import type { WeatherHourlyToday } from '@/lib/api/types';
import { parkDayOf } from '@/lib/utils/park-day';
import { parkRelayUrl } from '@/lib/parks/paths';

interface UseWeatherHourlyParams {
  continent: string | undefined;
  country: string | undefined;
  city: string | undefined;
  parkSlug: string | undefined;
  /** The park's IANA zone, which says what today is when no `date` is named. */
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
 * A park-day's hour-by-hour forecast (temperature, precipitation) from the API's
 * `/weather/hourly`, through the cached `/api/parks/<geo>/<park>/weather/hourly` relay. The
 * park-local date is always sent, so a stale-while-revalidate serve cannot hand the chart
 * yesterday's day; for today it is computed at fetch time, not in the key, so the 30-minute refetch
 * rolls over at midnight. The API serves today and fourteen more days, so a caller gates on that
 * horizon. A 404 (no coordinates, the upstream down, a day outside the horizon) is `null`.
 */
export function useWeatherHourly({
  continent,
  country,
  city,
  parkSlug,
  timezone,
  date,
  enabled = true,
}: UseWeatherHourlyParams) {
  const hasPark = !!(continent && country && city && parkSlug && timezone);

  return useQuery<WeatherHourlyToday | null>({
    // `date` only when a caller named one: today must stay out of the key for the midnight
    // rollover.
    queryKey: date
      ? ['weather-hourly', continent, country, city, parkSlug, date]
      : ['weather-hourly', continent, country, city, parkSlug],
    queryFn: async () => {
      // Today in the park's zone, from the browser clock.
      const day = date ?? parkDayOf(Date.now(), timezone!);
      const response = await fetch(
        parkRelayUrl(
          { continent: continent!, country: country!, city: city!, parkSlug: parkSlug! },
          `/weather/hourly?date=${day}`
        ),
        { cache: 'no-store' }
      );

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to fetch hourly weather: ${response.statusText}`);
      }

      return (await response.json()) as WeatherHourlyToday;
    },
    // Client-only: under Cache Components, running the query during the static
    // prerender would read Date.now() internally (React Query).
    enabled: enabled && hasPark && typeof window !== 'undefined',
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}
