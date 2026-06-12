import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
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
 * - Deferred via `useLoadLast`: feeds the best-travel-time + stats sections, which must
 *   ALWAYS load last on the park page — never competing with the live status/weather
 *   queries (see docs/architecture/system-overview.md → "Park page loading priority").
 */
export function useParkHistoricalStats({
  continent,
  country,
  city,
  parkSlug,
}: UseParkHistoricalStatsParams) {
  const releasedLast = useLoadLast();

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
    // `releasedLast` holds the fetch back until every other query on the page has settled
    // (loads-last rule).
    enabled: typeof window !== 'undefined' && releasedLast,
    staleTime: 60 * 60_000,
    gcTime: 90 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
