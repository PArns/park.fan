import { useQuery } from '@tanstack/react-query';
import type { WeatherHourlyToday } from '@/lib/api/types';

interface UseWeatherHourlyParams {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timezone: string | undefined;
  /**
   * The park-local day to fetch, `YYYY-MM-DD`. Omitted means today, computed at
   * FETCH time — see the note on the rollover below, which is why the default
   * is not simply "today" filled in here.
   *
   * A caller that names a day gets it in the query key as well, or two days of
   * one park would share a cache entry and the second would read the first.
   */
  date?: string;
  /** Gate the fetch (e.g. when static `hourly` data is supplied instead). */
  enabled?: boolean;
}

/** Today's date (YYYY-MM-DD) in the park timezone, from the browser clock. */
function parkLocalDate(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(Date.now());
}

/**
 * Today's hour-by-hour forecast (temperature + precipitation) for a park
 * location, via the cached `/api/weather/hourly` Open-Meteo proxy.
 *
 * The explicit `date` param pins every cache layer (CDN + Next data cache) to
 * the park-local day the CHART will check against ("is this today?"). Without
 * it, a stale-while-revalidate serve could hand the first visitor of the day
 * yesterday's response — whose date no longer matches "today", so the day view
 * silently disappeared on some pages. The date is computed at FETCH time (not
 * in the query key), so the 30-min refetch rolls the chart over to the new day
 * after midnight, same as before.
 *
 * The server response is cached 15 min, so polling faster is wasted work.
 *
 * The upstream reaches about **fourteen days**, not one — the route has taken an
 * explicit `date` since it was written and pins `start_date`/`end_date` to it.
 * The planner's weather rail asks for a day the visitor is planning, which may
 * be any of those; past the horizon Open-Meteo answers an error and this throws,
 * so a caller must gate on the horizon rather than rely on an empty result.
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
    // `date` only when a caller named one. Left out otherwise so the existing
    // consumers keep the key they have — and with it the midnight rollover,
    // which works precisely BECAUSE today is not in the key.
    queryKey: date
      ? ['weather-hourly', latitude, longitude, timezone, date]
      : ['weather-hourly', latitude, longitude, timezone],
    queryFn: async () => {
      const day = date ?? parkLocalDate(timezone!);
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
