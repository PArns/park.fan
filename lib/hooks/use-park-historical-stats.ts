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
 * Client-side fetch for a park's 2-year historical crowd/wait-time aggregate.
 *
 * Moved off the server render so the park page no longer needs a dynamic Suspense hole
 * (connection()) for stats — which forced the whole route into `no-store` and caused ISR
 * write churn. The data is large and slow to compute, so the `/api/parks/.../stats` route
 * serves it as a CDN-cached function response (s-maxage=3600); this hook just polls that.
 *
 * The query itself (key, fetch, cache windows) is `parkStatsQuery`, shared with the blog and
 * comparison tables so a default-depth table on a park page reuses this fetch.
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
  return useQuery(parkStatsQuery({ continent, country, city, parkSlug }, 'default', releasedLast));
}
