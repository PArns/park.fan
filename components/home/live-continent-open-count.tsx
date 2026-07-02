'use client';

import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';

interface LiveContinentOpenCountProps {
  continentSlug: string;
  /** SSR seed baked into the hourly shell — shown until the shared geo-live batch call lands. */
  initialOpenCount: number;
  parkCount: number;
}

/**
 * Live open-park counter + progress bar for one continent card in the homepage
 * "parks open now" grid. The prerendered shell bakes an hourly seed; the live count
 * overlays it after mount via the shared {@link useGeoLiveStats} batch call (one
 * request for all continents, 5-min poll) — so the "live" section is actually live
 * without pinning the homepage shell to a short ISR window.
 */
export function LiveContinentOpenCount({
  continentSlug,
  initialOpenCount,
  parkCount,
}: LiveContinentOpenCountProps) {
  const { data } = useGeoLiveStats();
  const openParkCount = findOpenParkCount(data, continentSlug) ?? initialOpenCount;

  return (
    <>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-3xl font-bold text-transparent">
          {openParkCount}
        </span>
        <span className="text-muted-foreground text-sm">/ {parkCount}</span>
      </div>
      <OpenStatusProgress openCount={openParkCount} totalCount={parkCount} showLabel={false} />
    </>
  );
}
