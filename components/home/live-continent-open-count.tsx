'use client';

import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';
import { useMounted } from '@/lib/hooks/use-mounted';

interface LiveContinentOpenCountProps {
  continentSlug: string;
  /** SSR seed baked into the shell, shown until the shared geo-live batch call lands. */
  initialOpenCount: number;
  parkCount: number;
}

/**
 * Live open-park counter and progress bar for one continent card in the homepage "parks open now"
 * grid: the shell bakes a seed and the shared {@link useGeoLiveStats} batch call (one request for
 * all continents) overlays it after mount, without pinning the shell to a short ISR window.
 */
export function LiveContinentOpenCount({
  continentSlug,
  initialOpenCount,
  parkCount,
}: LiveContinentOpenCountProps) {
  /*
   * The seed counts in the first client render here too: the seed and the poll come from different
   * caches, and the hero's world panel may fire the same query first, so the client could render a
   * number the server HTML does not have. The live value lands one commit later.
   */
  const mounted = useMounted();
  const { data } = useGeoLiveStats();
  const liveOpenCount = mounted ? findOpenParkCount(data, continentSlug) : undefined;
  const openParkCount = liveOpenCount ?? initialOpenCount;

  return (
    <>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {openParkCount}
        </span>
        <span className="text-muted-foreground text-sm">/ {parkCount}</span>
      </div>
      <OpenStatusProgress openCount={openParkCount} totalCount={parkCount} showLabel={false} />
    </>
  );
}
