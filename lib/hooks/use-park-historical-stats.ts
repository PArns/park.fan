import { useQuery } from '@tanstack/react-query';
import type { ParkHistoricalStats } from '@/lib/api/types';

interface UseParkHistoricalStatsParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Client-side fetch for a park's 2-year historical crowd/wait-time aggregate.
 *
 * Moved off the server render so the park page no longer needs a dynamic Suspense hole
 * (connection()) for stats — which forced the whole route into `no-store` and caused ISR
 * write churn. The data is large and slow to compute, so the `/api/parks/.../stats` route
 * serves it as a CDN-cached function response (s-maxage=3600); this hook just polls that.
 *
 * - Browser-only (`enabled` gated on `window`): never runs during the static prerender,
 *   where reading the clock internally (React Query) is forbidden under Cache Components.
 * - 404 = "no displayable stats for this park" → treated as `null`, no retries.
 * - 1h staleTime mirrors the server cache window (data changes daily, not in real time).
 */
export function useParkHistoricalStats({
  continent,
  country,
  city,
  parkSlug,
}: UseParkHistoricalStatsParams) {
  return useQuery<ParkHistoricalStats | null>({
    queryKey: ['park-historical-stats', continent, country, city, parkSlug],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${continent}/${country}/${city}/${parkSlug}/stats`, {
        cache: 'no-store',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      return (await response.json()) as ParkHistoricalStats;
    },
    enabled: typeof window !== 'undefined',
    staleTime: 60 * 60_000,
    gcTime: 90 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
