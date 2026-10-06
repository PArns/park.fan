'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { InParkRideLists, splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { NextBestRides } from '@/components/parks/next-best-rides';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useInParkBlock, useRideCoordinates } from '@/lib/hooks/use-in-park-block';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * „Near you" at the top of the park page, for a visitor standing in this park. It reads the same
 * `/api/nearby` answer the header already asks for (`useHomeNearbyParks`, deduped by React Query),
 * so it adds no request. Asking for location and the "location on" state belong to the title card's
 * `ParkLocationLine`; this renders nothing until `useInParkBlock` places the visitor in this park.
 *
 * Distances follow the context's own 60 s refresh while `isInPark` is set, with no second
 * `watchPosition` waking the device on every step. No height is reserved: the lists show only in
 * the park, and a reservation would put empty space on every park page for every reader at home.
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

  const rideCoordinates = useRideCoordinates(park.attractions);

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
