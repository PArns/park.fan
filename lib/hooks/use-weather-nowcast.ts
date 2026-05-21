import { useQuery } from '@tanstack/react-query';
import type { WeatherNowcast } from '@/lib/api/types';

interface UseWeatherNowcastParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  initialData?: WeatherNowcast | null;
  /** Disable polling entirely when the endpoint is known to be unavailable for this park. */
  enabled?: boolean;
}

/**
 * Live short-term weather nowcast for a park.
 * - Server response is cached 15 min (max-age=900). Polling more often is wasted work.
 * - We poll every 5 min to catch the next backend refresh quickly and refetch on focus.
 * - 404 is treated as a permanent "no nowcast for this park" (no retries, hook stays disabled).
 */
export function useWeatherNowcast({
  continent,
  country,
  city,
  parkSlug,
  initialData,
  enabled = true,
}: UseWeatherNowcastParams) {
  return useQuery<WeatherNowcast | null>({
    queryKey: ['weather-nowcast', continent, country, city, parkSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/weather/nowcast`,
        { cache: 'no-store' }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch nowcast: ${response.statusText}`);
      }

      return (await response.json()) as WeatherNowcast;
    },
    initialData,
    enabled: enabled && initialData !== null,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}
