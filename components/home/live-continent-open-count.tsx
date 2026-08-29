'use client';

import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';
import { useMounted } from '@/lib/hooks/use-mounted';

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
  /*
   * Auch hier zählt im ersten Client-Render der Seed.
   *
   * Dieselbe Falle wie in GlobalStatsLiveCounts, nur mit der anderen geteilten Abfrage: Der Seed
   * kommt aus einem Fetch, der die volle Stunde des Shells gecached ist, der Poll aus dem
   * no-store-Proxy — ob beide dieselbe Zahl nennen, ist Zufall. Und nichts garantiert, dass diese
   * Karte die erste ist, die `useGeoLiveStats` liest: Sie sitzt in der letzten Suspense-Boundary
   * einer langen Seite, während das World-Panel im Hero nach `load` + idle mountet und dieselbe
   * Anfrage abschickt. Kommt deren Antwort vorher an, rendert der Client 14, wo im Server-HTML 17
   * steht, und React verwirft den Teilbaum. Der Live-Wert landet einen Commit später.
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
