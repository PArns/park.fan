'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { usePlacedOutOfSight, useScrollAnchoring } from '@/lib/hooks/use-placed-out-of-sight';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * „Near you" at the top of the park page, for a visitor standing in this park: the homepage's
 * compass with the park's headliners, then a glass panel with the rides whose queue is shorter now
 * than later and the nearest other rides. It reads the `/api/nearby` answer the header already
 * asks for, through `useInParkBlock`, so it adds no request of its own; the compass adds the
 * park's ride positions. Asking for location and the "location on" state belong to the title
 * card's `ParkLocationLine`; this renders nothing until `useInParkBlock` places the visitor in
 * this park, and keeps rendering through a failed request.
 *
 * Nothing here sits on the bare photo: the compass is its own panel and the lists are on the title
 * card's glass. No height is reserved, since a reservation would put empty space on every park
 * page for every reader at home. The compass's module is fetched only for a visitor in the park,
 * and the lists wait for it, so the block moves the page once and not twice. Where the browser has
 * scroll anchoring it absorbs the block above a reader who has scrolled; where it has none
 * (WebKit), the block waits as the homepage's compass does (docs/features/park-compass.md).
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

  const here = state.kind === 'inPark' ? state : null;
  const rides = here?.rides;
  const lists = useMemo(() => (rides ? splitInParkRides(rides) : null), [rides]);
  const wantsCompass = (lists?.headliners.length ?? 0) > 0;
  const [ParkCompass, setParkCompass] = useState<ParkCompassComponent | null>(null);
  const [compassFailed, setCompassFailed] = useState(false);
  const onCompassError = useCallback(() => setCompassFailed(true), []);
  useLoadParkCompass(
    wantsCompass && !ParkCompass && !compassFailed,
    setParkCompass,
    onCompassError
  );
  const withCompass = wantsCompass && ParkCompass !== null;

  const hasRides = lists !== null && (lists.headliners.length > 0 || lists.attractions.length > 0);
  const ready = hasRides && (!wantsCompass || ParkCompass !== null || compassFailed);
  const anchoring = useScrollAnchoring();
  const slotRef = useRef<HTMLDivElement>(null);
  const placed = usePlacedOutOfSight(slotRef, ready && !anchoring);

  return (
    <div ref={slotRef} data-in-park-slot="">
      {here && lists && ready && (anchoring || placed) && (
        <div className={cn('mb-6 space-y-4', className)} data-nosnippet data-in-park-block="inPark">
          {withCompass && ParkCompass && (
            // Keyed by park: a pin and a ride ahead belong to the park they were chosen in.
            <ParkCompass key={park.slug} data={here.nearby} userLocation={here.userLocation} />
          )}
          {/* For the outline only: on screen the two list labels in the panel say it. */}
          <h2 className="sr-only">{t('parkPage.heading')}</h2>
          {/* `empty:hidden`: `NextBestRides` renders nothing until its forecast is in, and a park
              whose rides are all headliners has no other list, so the panel can be empty. */}
          <GlassCard variant="tile" className="space-y-5 p-4 empty:hidden sm:p-6">
            <NextBestRides
              park={{ slug: park.slug, timezone: park.timezone }}
              rides={here.rides}
              showDistance={here.showDistances}
              headingAs="h3"
            />
            <InParkRideLists
              // The compass lists the headliners; when its module did not load they stay here.
              headliners={withCompass ? [] : lists.headliners}
              attractions={lists.attractions}
              showDistance={here.showDistances}
              headingAs="h3"
            />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
