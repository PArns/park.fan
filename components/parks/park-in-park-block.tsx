'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { InParkRideLists, splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { NextBestRides } from '@/components/parks/next-best-rides';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useInParkBlock } from '@/lib/hooks/use-in-park-block';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * "Near you" at the top of the park page, for a visitor who is standing in this park.
 *
 * The homepage has had an in-park mode for a long time (`InParkView`); the park page, which is
 * where somebody in the park more often lands (favourites, search, a bookmark), had none. This
 * reads the same `/api/nearby` answer the header already asks for on every page
 * (`useHomeNearbyParks`, deduped by React Query), so it adds no request, and lists the same rows.
 *
 * Only the lists live here. Asking for location, the block and the "location on" state are the
 * title card's `ParkLocationLine`, which reads the same decision (`useInParkBlock`); this renders
 * nothing until that decision places the visitor in this park.
 *
 * Distances follow the visitor through the context's own refresh: 60 s while `isInPark` is set,
 * which this block sets for as long as it shows the lists, and the position keeps its identity
 * while the fix does not move. So the lists re-render at most once a minute while walking — no
 * second `watchPosition`, which would wake the device on every step (PAR-341).
 *
 * Layout: no reservation. The lists appear only in the park, and they do shift the page:
 * reserving them would put several hundred pixels of nothing on every park page for every reader
 * at home.
 */
export function ParkInParkBlock({
  park,
  className,
}: {
  park: ParkWithAttractions;
  className?: string;
}) {
  const t = useTranslations('nearby');
  const { setIsInPark } = useGeolocation();

  const rideCoordinates = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    for (const a of park.attractions ?? []) {
      if (a.latitude != null && a.longitude != null) {
        map.set(a.id, { lat: a.latitude, lng: a.longitude });
      }
    }
    return map;
  }, [park.attractions]);

  const state = useInParkBlock(park, rideCoordinates);

  const inPark = state.kind === 'inPark';
  useEffect(() => {
    if (!inPark) return;
    setIsInPark(true);
    return () => setIsInPark(false);
  }, [inPark, setIsInPark]);

  if (state.kind !== 'inPark') return null;
  const lists = splitInParkRides(state.rides);
  if (lists.headliners.length === 0 && lists.attractions.length === 0) return null;

  return (
    <section
      className={cn('mb-6', className)}
      aria-labelledby="park-near-you"
      data-nosnippet
      data-in-park-block={state.kind}
    >
      <h2 id="park-near-you" className="flex min-w-0 items-center gap-2 text-lg font-semibold">
        <MapPin className="text-park-primary size-5 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('parkPage.heading')}</span>
      </h2>
      <div className="mt-3 space-y-4">
        <NextBestRides
          park={{ slug: park.slug, timezone: park.timezone }}
          rides={state.rides}
          showDistance={state.showDistances}
        />
        <InParkRideLists
          headliners={lists.headliners}
          attractions={lists.attractions}
          showDistance={state.showDistances}
        />
      </div>
    </section>
  );
}
