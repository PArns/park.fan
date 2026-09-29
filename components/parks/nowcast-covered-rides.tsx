'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Umbrella } from 'lucide-react';
import { InParkAttractionRow } from '@/components/parks/nearby-in-park-view';
import { useInParkBlock } from '@/lib/hooks/use-in-park-block';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { rankCoveredRides, type CoveredCandidate } from '@/lib/utils/covered-rides';
import type { AttractionWithDistance } from '@/types/nearby';
import type { ParkAttraction, ParkWithAttractions } from '@/lib/api/types';

type CoveredRow = CoveredCandidate & AttractionWithDistance;

/**
 * The park's attractions as rows the covered-ride ranking reads and `InParkAttractionRow` draws.
 *
 * Status and wait are what the page shows elsewhere: the park's own status closes every ride
 * (`getAttractionDisplayStatus`), and a park whose waits we cannot read posts none
 * (`hasReadableWaitTimes`). `distanceById` holds the visitor's metres to each ride while they
 * stand in the park; without it every distance is null and the ranking falls back to the queue.
 */
export function coveredRowsOf(
  park: Pick<ParkWithAttractions, 'attractions' | 'status' | 'liveWaitTimes'>,
  distanceById?: ReadonlyMap<string, number>
): CoveredRow[] {
  const waitsReadable = hasReadableWaitTimes(park);
  return (park.attractions ?? []).map((a: ParkAttraction) => {
    const status = getAttractionDisplayStatus(a, park.status);
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      url: a.url ?? '',
      indoorOutdoor: a.indoorOutdoor,
      status,
      isCurrentlyInSeason: a.isCurrentlyInSeason,
      isHeadliner: a.isHeadliner,
      crowdLevel: a.crowdLevel,
      waitTime: waitsReadable && status === 'OPERATING' ? getStandbyWait(a) : null,
      distance: distanceById?.get(a.id) ?? null,
    } as CoveredRow;
  });
}

/**
 * „Überdacht in der Nähe": the covered rides the nowcast banner offers when rain or a
 * thunderstorm is due.
 *
 * The caller decides whether it renders — the warning must be rain or a thunderstorm within the
 * lead time, the park must pass `coveredOfferReady`, and at least one covered ride must be open
 * (`rankCoveredRides(coveredRowsOf(park))` is not empty). That membership does not depend on
 * where the visitor stands, only the order does, so this component never renders an empty list.
 *
 * The distances are the leaf's own subscription (`useInParkBlock`, the same `/api/nearby` cache
 * the title card's location line reads, so no request of its own), and the banner mounts only
 * on the visitor's press. A visitor who is not in the park gets the list ordered by queue alone
 * and without the "120 m away" line.
 */
export function NowcastCoveredRides({ park }: { park: ParkWithAttractions }) {
  const t = useTranslations('parks.weatherNowcast.covered');
  const tNearby = useTranslations('nearby');

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
  const showDistance = state.kind === 'inPark' && state.showDistances;

  const rides = useMemo(() => {
    const distanceById = showDistance
      ? new Map(state.rides.map((r) => [r.id, r.distance] as const))
      : undefined;
    return rankCoveredRides(coveredRowsOf(park, distanceById));
  }, [park, showDistance, state]);

  return (
    <div className="mt-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Umbrella className="h-4 w-4 shrink-0" aria-hidden="true" />
        {showDistance ? t('headingNearby') : t('heading')}
      </h4>
      <ul className="space-y-2">
        {rides.map((ride) => (
          <InParkAttractionRow
            key={ride.id}
            attraction={{ ...ride, distance: ride.distance ?? 0 }}
            awayLabel={tNearby('awayFrom')}
            headlinerLabel={tNearby('headlinerBadge')}
            showDistance={showDistance && ride.distance !== null}
          />
        ))}
      </ul>
    </div>
  );
}
