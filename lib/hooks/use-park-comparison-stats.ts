import { useParkStatsQueries } from '@/lib/hooks/use-park-stats-queries';
import { deriveParkStatsFindings, type ParkStatsFindings } from '@/lib/parks/park-stats-derive';
import type { ParkHistoricalStats } from '@/lib/api/types';

export interface ComparisonPark {
  /** Blog slug, only used as a React key and for the queryKey. */
  slug: string;
  /** Display name — curated in the post, since the API name is the raw one ("WODAN - Timburcoaster"). */
  name: string;
  /** Frontend href for the park page. */
  href: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Renders bold. The post's own park. */
  highlight?: boolean;
}

/**
 * One park's row: who it is, plus what its aggregate says (`ParkStatsFindings`, the same
 * derivation the wait-time record page runs on the server).
 */
export interface ComparisonRow extends ComparisonPark, ParkStatsFindings {}

/**
 * A park comparison table's rows, from each park's `/stats` aggregate, which is small enough per
 * park to fetch client-side (see docs/architecture/api-budget.md). The fetching is
 * `useParkStatsQueries`, shared with the ride-wait tables so two tables on one page share a cache
 * entry.
 */
export function useParkComparisonStats(
  parks: readonly ComparisonPark[],
  /**
   * Server-fetched aggregate per park, aligned to `parks`. Present → the rows render their numbers
   * in the SSR / pre-settle pass instead of the per-cell skeletons, which is what puts this table
   * into the crawlable first HTML. The queries still run and replace it.
   */
  initialStats?: readonly (ParkHistoricalStats | null)[]
) {
  const { stats, isPending } = useParkStatsQueries(parks, 'default', initialStats);

  const rows: ComparisonRow[] = parks.map((p, i) => ({
    ...p,
    ...deriveParkStatsFindings(stats[i] ?? null),
  }));

  return { rows, isPending };
}
