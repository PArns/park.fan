'use client';

import { StatsCard } from '@/components/common/stats-card';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import type { GlobalStats } from '@/lib/api/types';

/** Labels pre-translated by the server parent — keeps next-intl out of this client chunk. */
export interface GlobalStatsCountLabels {
  openParks: string;
  of: string;
  total: string;
  totalAttractions: string;
  operating: string;
}

interface GlobalStatsLiveCountsProps {
  /** SSR seed baked into the hourly shell — shown until the live fetch lands. */
  initialCounts: GlobalStats['counts'];
  labels: GlobalStatsCountLabels;
  /** App locale for deterministic number formatting (same output on server + client). */
  locale: string;
}

/**
 * The two headline count cards ("open parks", "attractions operating") of the global-stats
 * section, overlaid with live values client-side. The surrounding section is server-rendered
 * into the hourly homepage shell; only these counts read as "right now", so only they poll —
 * and they must stay consistent with the live per-continent counts in LiveActivityGrid below
 * (both refresh every 5 min from the same analytics source).
 */
export function GlobalStatsLiveCounts({
  initialCounts,
  labels,
  locale,
}: GlobalStatsLiveCountsProps) {
  const { data } = useGlobalStats();
  const counts = data?.counts ?? initialCounts;

  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2">
      <StatsCard
        title={labels.openParks}
        value={counts.openParks}
        description={
          <>
            {labels.of} {counts.parks} {labels.total}
          </>
        }
      />
      <StatsCard
        title={labels.totalAttractions}
        value={counts.attractions.toLocaleString(locale)}
        description={
          <>
            {counts.openAttractions.toLocaleString(locale)} {labels.operating}
          </>
        }
      />
    </div>
  );
}
