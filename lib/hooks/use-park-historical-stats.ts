import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import { parkStatsQuery } from '@/lib/hooks/use-park-stats-queries';

interface UseParkHistoricalStatsParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Client-side fetch for a park's two-year historical crowd and wait-time aggregate, from the
 * CDN-cached `/api/parks/.../stats` route, so the park page render needs no dynamic hole for it.
 * The query is `parkStatsQuery`, shared with the blog and comparison tables. Deferred through
 * `useLoadLast`, because it feeds sections that load last; see
 * docs/rules/park-page-loading-priority.md.
 */
export function useParkHistoricalStats({
  continent,
  country,
  city,
  parkSlug,
}: UseParkHistoricalStatsParams) {
  const releasedLast = useLoadLast();
  return useQuery(parkStatsQuery({ continent, country, city, parkSlug }, 'default', releasedLast));
}
