import { useQueries } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
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

export interface ComparisonRow extends ComparisonPark {
  /** Sample-day-weighted median across all weekdays, the "park average" the posts quote. */
  parkP50: number | null;
  longestName: string | null;
  longestP50: number | null;
}

/**
 * The `/stats` payload for one park is ~3 KB, so seven of them cost ~21 KB — measured, and
 * the reason this widget exists client-side at all while an hourly-profile equivalent does not
 * (8 × 53 KB, of which 45 % is `schedule` nobody renders). See docs/architecture/api-budget.md.
 *
 * Deferred through `useLoadLast` like every other historical query: a blog post embedding this
 * must never race the park cards' live data.
 */
export function useParkComparisonStats(parks: readonly ComparisonPark[]) {
  const releasedLast = useLoadLast();

  const results = useQueries({
    queries: parks.map((p) => ({
      queryKey: ['park-historical-stats', p.continent, p.country, p.city, p.parkSlug],
      queryFn: async (): Promise<ParkHistoricalStats | null> => {
        const res = await fetch(
          `/api/parks/${p.continent}/${p.country}/${p.city}/${p.parkSlug}/stats`,
          { cache: 'no-store' }
        );
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`stats ${p.parkSlug}: ${res.statusText}`);
        return (await res.json()) as ParkHistoricalStats;
      },
      enabled: typeof window !== 'undefined' && releasedLast,
      // Same key and window as useParkHistoricalStats, so a post that also embeds a
      // `stats-widget` for one of these parks shares the cache entry instead of re-fetching it.
      staleTime: 60 * 60_000,
      gcTime: 90 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  const isPending = results.some((r) => r.isPending);

  const rows: ComparisonRow[] = parks.map((p, i) => {
    const stats = results[i]?.data ?? null;
    return { ...p, ...deriveRow(stats) };
  });

  return { rows, isPending };
}

/** Minimum measured days before an attraction may represent a whole park. */
const MIN_SAMPLE_DAYS = 100;

function deriveRow(stats: ParkHistoricalStats | null): {
  parkP50: number | null;
  longestName: string | null;
  longestP50: number | null;
} {
  if (!stats || !stats.meta.displayable) {
    return { parkP50: null, longestName: null, longestP50: null };
  }

  // Weight by sample days rather than averaging the seven weekday medians flat: a Sunday with
  // 23 measured days must not count the same as a Tuesday with 22 when the window is ragged.
  const dow = stats.byDayOfWeek ?? [];
  const days = dow.reduce((sum, d) => sum + d.sampleDays, 0);
  const parkP50 =
    days > 0
      ? Math.round(dow.reduce((sum, d) => sum + d.avgWaitP50 * d.sampleDays, 0) / days)
      : null;

  // The longest queue in the park, but only among rides we have actually watched for a while.
  // Toverland's Maximus' Blitz Bahn tops its list on 61 days — a children's coaster on a thin
  // basis is not a figure for a whole park.
  const solid = (stats.topAttractions ?? []).filter((a) => a.sampleDays >= MIN_SAMPLE_DAYS);
  const longest = solid.reduce<(typeof solid)[number] | null>(
    (best, a) => (best === null || a.avgWaitP50 > best.avgWaitP50 ? a : best),
    null
  );

  return {
    parkP50,
    longestName: longest?.attractionName ?? null,
    longestP50: longest?.avgWaitP50 ?? null,
  };
}
