import { queryOptions, useQueries } from '@tanstack/react-query';
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
 * The `/stats` query for one park at one depth (key, fetch, cache windows), shared by
 * `useParkStatsQueries` and `useParkHistoricalStats`. At the default depth the key has no depth
 * suffix, so a default-depth table on a park page reuses the section's own fetch. `releasedLast`
 * is the caller's `useLoadLast()`.
 */
export function parkStatsQuery(target: ParkStatsTarget, depth: StatsDepth, releasedLast: boolean) {
  const parkKey = [
    'park-historical-stats',
    target.continent,
    target.country,
    target.city,
    target.parkSlug,
  ] as const;
  return queryOptions({
    queryKey: depth === 'default' ? parkKey : ([...parkKey, depth] as const),
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
  });
}

/**
 * One `/stats` fetch per park, shared by every table built on the historical aggregate (the
 * park-comparison table, the blog's ride-wait tables, the park page's stats section) and gated on
 * `useLoadLast`. Keyed by park and depth: a default and a deep table for one park are two fetches,
 * two deep tables are one.
 */
export function useParkStatsQueries(
  targets: readonly ParkStatsTarget[],
  depth: StatsDepth = 'default',
  /**
   * Server-fetched aggregate per target, aligned to `targets`, rendered until that park's query
   * settles so the numbers are in the first HTML. Only the prerendered blog widgets pass one.
   */
  initialStats?: readonly (ParkHistoricalStats | null)[]
) {
  const releasedLast = useLoadLast();

  const results = useQueries({
    queries: targets.map((target) => parkStatsQuery(target, depth, releasedLast)),
  });

  return {
    /**
     * Aligned with `targets` by index. `null` where the park has no displayable aggregate.
     *
     * `isSuccess`, not `data ?? seed`: a settled 404 is the answer "no displayable aggregate", and
     * a nullish fallback would put the seed back on top of it.
     */
    stats: results.map((r, i) => (r.isSuccess ? r.data : (initialStats?.[i] ?? null))),
    /** True while ANY park is still outstanding — the tables render one skeleton, not seven. */
    isPending: results.some((r) => r.isPending),
  };
}
