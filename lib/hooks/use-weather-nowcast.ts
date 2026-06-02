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
    // The park page is statically rendered (ISR), so this server `initialData` can already
    // be older than its staleTime by the time the cached HTML reaches the browser. Anchor
    // React Query's freshness to the nowcast's real observation time (not mount time) so a
    // stale cached page refetches immediately on mount. Without this, RQ trusts initialData
    // for the full staleTime → frozen banner with a past nextUpdateAt (update-countdown hidden).
    initialDataUpdatedAt: initialData?.observedAt ? Date.parse(initialData.observedAt) : undefined,
    enabled: enabled && initialData !== null,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Dynamically schedule the next refetch: fire as soon as nextUpdateAt is
    // reached so the countdown and the actual fetch stay in sync. Fall back to
    // a 5-min poll when the field is absent or already in the past.
    refetchInterval: (query) => {
      const data = query.state.data as WeatherNowcast | null | undefined;
      if (data?.nextUpdateAt) {
        const ms = Date.parse(data.nextUpdateAt) - Date.now();
        if (ms > 0) return ms;
      }
      return 5 * 60_000;
    },
    retry: 1,
  });
}
