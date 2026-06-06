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
    // Pass `undefined` (not the `null` prop) as initialData. The park page no longer provides an SSR
    // nowcast seed (the slow fetch timed out the static prerender), so initialData arrives as `null`
    // — and React Query treats a `null` initialData as an already-resolved value, skipping the mount
    // fetch for the whole staleTime. That left the nowcast + warning banner blank for ~5 min. With
    // `undefined`, there is no initial value, so the query fetches on mount.
    initialData: initialData ?? undefined,
    // When a seed IS present, anchor freshness to its real observation time (not mount time) so a
    // stale cached page refetches immediately instead of trusting initialData for the full staleTime.
    initialDataUpdatedAt: initialData?.observedAt ? Date.parse(initialData.observedAt) : undefined,
    // Client-only: under Cache Components, running the query during the static prerender would read
    // Date.now() internally (React Query). `typeof window` keeps it off the server; the SSR shell
    // renders from the (now empty) initialData and the client fetches the nowcast on mount.
    enabled: enabled && typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Dynamically schedule the next refetch: fire as soon as nextUpdateAt is
    // reached so the countdown and the actual fetch stay in sync. Fall back to
    // a 5-min poll when the field is absent or already in the past.
    refetchInterval: (query) => {
      // Never read the clock during the static prerender (Cache Components forbids it); polling
      // only matters on the client anyway.
      if (typeof window === 'undefined') return false;
      const data = query.state.data as WeatherNowcast | null | undefined;
      if (data?.nextUpdateAt) {
        const ms = Date.parse(data.nextUpdateAt) - Date.now();
        if (ms > 0) return ms; // schedule the refetch exactly when the backend says it updates
        return 60_000; // update is overdue (backend lagging) → re-poll every 60s until it's fresh
      }
      return 5 * 60_000;
    },
    retry: 1,
  });
}
