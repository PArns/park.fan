import { useQuery } from '@tanstack/react-query';
import type { WeatherHourlyToday } from '@/lib/api/types';

interface UseWeatherHourlyParams {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timezone: string | undefined;
  /** Gate the fetch (e.g. only when a nowcast exists, so the day view is shown at all). */
  enabled?: boolean;
}

/**
 * Today's hour-by-hour forecast (temperature + precipitation) for a park
 * location, via the cached `/api/weather/hourly` Open-Meteo proxy.
 * The server response is cached 15 min, so polling faster is wasted work; the
 * 30-min refetch mainly rolls the chart over to the new day after midnight.
 */
export function useWeatherHourly({
  latitude,
  longitude,
  timezone,
  enabled = true,
}: UseWeatherHourlyParams) {
  const hasCoords = latitude != null && longitude != null && !!timezone;

  return useQuery<WeatherHourlyToday | null>({
    queryKey: ['weather-hourly', latitude, longitude, timezone],
    queryFn: async () => {
      const response = await fetch(
        `/api/weather/hourly?lat=${latitude}&lon=${longitude}&tz=${encodeURIComponent(timezone!)}`,
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
