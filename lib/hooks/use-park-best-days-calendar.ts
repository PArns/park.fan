import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';

interface UseParkBestDaysCalendarParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /**
   * Off where there is no park to ask about yet — the trip planner mounts this
   * before a park is picked, and an empty slug would fetch
   * `/api/parks/////best-days`. Defaults to on, which is what every park-page
   * caller means.
   */
  enabled?: boolean;
}

/**
 * The query itself, without the gates. The trip assistant asks for several parks at once with
 * `useQueries` and has to hit the same cache entry the park page does, so the key and the
 * fetcher live here and nowhere else.
 */
export function parkBestDaysQueryOptions({
  continent,
  country,
  city,
  parkSlug,
}: Omit<UseParkBestDaysCalendarParams, 'enabled'>) {
  return {
    queryKey: ['park-best-days-calendar', continent, country, city, parkSlug] as const,
    queryFn: async (): Promise<BestDaysSnapshot> => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/best-days`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch best-days data: ${response.statusText}`);
      }

      return (await response.json()) as BestDaysSnapshot;
    },
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  };
}

/**
 * The precomputed best-days snapshot (today plus 90 days) behind the best-days widget, the crowd
 * FAQ entry and the header's forecast for today, from the CDN-cached `/api/parks/.../best-days`
 * route. Browser-only, and deferred through `useLoadLast` because best-travel-time data loads
 * last; see docs/rules/park-page-loading-priority.md.
 */
export function useParkBestDaysCalendar({
  continent,
  country,
  city,
  parkSlug,
  enabled = true,
}: UseParkBestDaysCalendarParams) {
  const releasedLast = useLoadLast();

  return useQuery<BestDaysSnapshot>({
    ...parkBestDaysQueryOptions({ continent, country, city, parkSlug }),
    // Browser-only, and held back by `releasedLast` until every other query on the page has
    // settled (loads-last rule).
    enabled: enabled && Boolean(parkSlug) && typeof window !== 'undefined' && releasedLast,
  });
}
