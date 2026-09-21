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
 * One park's row: who it is, plus what its aggregate says.
 *
 * The findings half is `ParkStatsFindings` rather than a copy of its fields, because the
 * derivation moved to `lib/parks/park-stats-derive.ts` when the wait-time record page needed the
 * same three answers on the server. This table renders three of them; the rest cost nothing.
 */
export interface ComparisonRow extends ComparisonPark, ParkStatsFindings {}

/**
 * The `/stats` payload for one park is ~3 KB, so seven of them cost ~21 KB — measured, and
 * the reason this widget exists client-side at all while an hourly-profile equivalent does not
 * (8 × 53 KB, of which 45 % is `schedule` nobody renders). See docs/architecture/api-budget.md.
 *
 * The fetching itself lives in `useParkStatsQueries`, shared with the ride-wait tables: the query
 * key, the stale window and the loads-last gate had to agree in three files for two tables on one
 * page to share a cache entry rather than fetch the same park twice.
 */
export function useParkComparisonStats(
  parks: readonly ComparisonPark[],
  /**
   * Server-fetched aggregate per park, aligned to `parks`. Present → the rows render their numbers
   * in the SSR / pre-settle pass instead of the per-cell skeletons, which is what puts this table
   * into the crawlable first HTML. The queries still run and replace it exactly as before.
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
