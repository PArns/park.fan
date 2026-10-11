'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/components/common/glass-card';
import {
  useLoadParkCompass,
  type ParkCompassComponent,
} from '@/components/home/use-load-park-compass';
import { InParkRideLists, splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { NextBestRides } from '@/components/parks/next-best-rides';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useInParkBlock, useRideCoordinates } from '@/lib/hooks/use-in-park-block';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';
import type { NearbyAttractionsData } from '@/types/nearby';

/**
 * „Near you" at the top of the park page, for a visitor standing in this park: the homepage's
 * compass with the park's headliners, then a glass panel with the rides whose queue is shorter now
 * than later and the nearest other rides. It reads the same `/api/nearby` answer the header already
 * asks for (`useHomeNearbyParks`, deduped by React Query), so it adds no request of its own; the
 * compass adds the park's ride positions. Asking for location and the "location on" state belong
 * to the title card's `ParkLocationLine`; this renders nothing until `useInParkBlock` places the
 * visitor in this park.
 *
 * Nothing here sits on the bare photo: the compass is its own panel and the lists are on the title
 * card's glass. No height is reserved, since a reservation would put empty space on every park
 * page for every reader at home. The compass's module is fetched only for a visitor in the park,
 * and the lists wait for it, so the block moves the page once and not twice. A reader who has
 * scrolled past is not moved: unlike the homepage's compass slot, the browser's scroll anchoring
 * absorbs this block (docs/features/park-compass.md, „On the park page").
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

  const rides = state.kind === 'inPark' ? state.rides : null;
  const showDistance = state.kind === 'inPark' && state.showDistances;
  const lists = useMemo(() => (rides ? splitInParkRides(rides) : null), [rides]);
  // `useInParkBlock` only says „in this park" when this answer is about this park.
  const { data: nearby } = useHomeNearbyParks();
  const compassData =
    inPark && nearby?.type === 'in_park' ? (nearby.data as NearbyAttractionsData) : null;
  const withCompass = compassData !== null && (lists?.headliners.length ?? 0) > 0;
  const [ParkCompass, setParkCompass] = useState<ParkCompassComponent | null>(null);
  useLoadParkCompass(withCompass && !ParkCompass, setParkCompass);

  if (!rides || !lists || !nearby) return null;
  if (lists.headliners.length === 0 && lists.attractions.length === 0) return null;
  if (withCompass && !ParkCompass) return null;

  return (
    <section
      className={cn('mb-6 space-y-4', className)}
      aria-label={t('parkPage.heading')}
      data-nosnippet
      data-in-park-block={state.kind}
    >
      {ParkCompass && compassData && withCompass && (
        // Keyed by park: a pin and a ride ahead belong to the park they were chosen in.
        <ParkCompass key={park.slug} data={compassData} userLocation={nearby.userLocation} />
      )}
      {/* `empty:hidden`: `NextBestRides` renders nothing until its forecast is in, and a park
          whose rides are all headliners has no other list, so the panel can be empty. */}
      <GlassCard variant="tile" className="space-y-5 p-4 empty:hidden sm:p-6">
        <NextBestRides
          park={{ slug: park.slug, timezone: park.timezone }}
          rides={rides}
          showDistance={showDistance}
        />
        <InParkRideLists
          // The compass lists the headliners; without it they stay here.
          headliners={withCompass ? [] : lists.headliners}
          attractions={lists.attractions}
          showDistance={showDistance}
        />
      </GlassCard>
    </section>
  );
}
