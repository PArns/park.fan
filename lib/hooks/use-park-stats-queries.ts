import { useQueries } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { ParkHistoricalStats } from '@/lib/api/types';

/** The four path segments `/api/parks/.../stats` is addressed by. */
export interface ParkStatsTarget {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * How many ranked attractions a caller wants back.
 *
 * Deliberately a small closed set rather than a free number: `topN` reaches the CDN as a query
 * parameter, so every distinct value is another cached object per park. Two are enough — the
 * default the park page already warms, and a deeper one for tables that name specific rides
 * rather than taking the top of the list.
 */
export type StatsDepth = 'default' | 'deep';

/** The `topN` behind each depth. `default` is omitted from the URL so it shares the park page's
 *  cache entry byte for byte. */
const DEPTH_TOP_N: Record<StatsDepth, number | null> = {
  default: null,
  deep: 30,
};

function statsUrl(target: ParkStatsTarget, depth: StatsDepth): string {
  const base = `/api/parks/${target.continent}/${target.country}/${target.city}/${target.parkSlug}/stats`;
  const topN = DEPTH_TOP_N[depth];
  return topN == null ? base : `${base}?topN=${topN}`;
}

/**
 * One `/stats` fetch per park, shared by every table built on the historical aggregate.
 *
 * Extracted because three surfaces read the same payload — the park-comparison table, the
 * ride-wait tables in blog posts and the park page's own stats section — and they were drifting:
 * the query key, the stale window and the `useLoadLast` gate had to agree in three places for two
 * widgets on one page to share a cache entry instead of fetching twice.
 *
 * The `useLoadLast` gate is the park page's loading-priority rule: historical aggregates never
 * race the live status and weather queries. A blog post embedding one of these tables inherits
 * that for free.
 *
 * Keyed by park AND depth. A page holding both a `stats-widget` (default) and a deep ride table
 * for the same park does fetch twice — which is correct, they are different objects — but two
 * deep tables for the same park share one.
 */
export function useParkStatsQueries(
  targets: readonly ParkStatsTarget[],
  depth: StatsDepth = 'default',
  /**
   * Server-fetched aggregate per target, aligned to `targets`. Rendered until the query for that
   * park settles, which is what puts the numbers into the first HTML instead of a skeleton — a
   * blog post shipped its tables as `data-slot="skeleton"` placeholders without it. Only the
   * statically prerendered blog widgets pass one; the park page keeps its stats client-side.
   */
  initialStats?: readonly (ParkHistoricalStats | null)[]
) {
  const releasedLast = useLoadLast();

  const results = useQueries({
    queries: targets.map((target) => ({
      // 'park-historical-stats' + the four segments is exactly the key useParkHistoricalStats
      // uses, so a default-depth table on a park page reuses the section's own fetch. The depth
      // suffix only appears when it is not the default, keeping that key byte-identical.
      queryKey:
        depth === 'default'
          ? ([
              'park-historical-stats',
              target.continent,
              target.country,
              target.city,
              target.parkSlug,
            ] as const)
          : ([
              'park-historical-stats',
              target.continent,
              target.country,
              target.city,
              target.parkSlug,
              depth,
            ] as const),
      queryFn: async (): Promise<ParkHistoricalStats | null> => {
        const res = await fetch(statsUrl(target, depth), { cache: 'no-store' });
        // 404 is "this park has no displayable aggregate", a settled answer — not a failure to
        // retry. The caller renders an em dash for it.
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`stats ${target.parkSlug}: ${res.statusText}`);
        return (await res.json()) as ParkHistoricalStats;
      },
      enabled: typeof window !== 'undefined' && releasedLast,
      staleTime: 60 * 60_000,
      gcTime: 90 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  return {
    /**
     * Aligned with `targets` by index. `null` where the park has no displayable aggregate.
     *
     * `isSuccess`, not `data ?? seed`: a settled 404 is the answer "no displayable aggregate", and
     * falling back on a nullish check would quietly put the seed back on top of it. Without a seed
     * this reduces to the previous `r.data ?? null`.
     */
    stats: results.map((r, i) => (r.isSuccess ? r.data : (initialStats?.[i] ?? null))),
    /** True while ANY park is still outstanding — the tables render one skeleton, not seven. */
    isPending: results.some((r) => r.isPending),
  };
}
