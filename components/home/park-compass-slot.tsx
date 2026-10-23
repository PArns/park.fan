'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { usePlacedOutOfSight } from '@/lib/hooks/use-placed-out-of-sight';
import { fetchNearby } from '@/lib/nearby/fetch-nearby';
import { resolveCompassDemo } from '@/lib/nearby-simulation';
import { PARK_COMPASS_ID, setCompassPresent } from '@/lib/home/compass-presence';
import type { NearbyAttractionsData, NearbyResponse } from '@/types/nearby';
import { useLoadParkCompass, type ParkCompassComponent } from './use-load-park-compass';

const subscribeNever = () => () => {};
const readSim = () => new URLSearchParams(window.location.search).get('sim');

/**
 * Directly under the homepage hero: the in-park compass, or nothing. It reads the same
 * `/api/nearby` answer as the hero's welcome and, like it, waits for the mount. Only for `in_park`
 * with a headliner in season, the filter `ParkCompass` lists by (`splitInParkRides`).
 *
 * Where it appears, and when: no box is held open for it (a screen of nothing for everyone at
 * home), so the module is fetched only for a visitor in a park, and the compass goes in only where
 * it moves nothing the reader is looking at (`usePlacedOutOfSight`). Here even Chromium's scroll
 * anchoring did not absorb it, so the rule holds in every browser.
 */
export function ParkCompassSlot() {
  const mounted = useMounted();
  const { data: nearby } = useHomeNearbyParks();

  // `?sim=compass[:preset]`: the park's own nearby answer, asked for at the preset's coordinates —
  // a request like any visitor's, which is why this works in production (`resolveCompassDemo`).
  const sim = useSyncExternalStore(subscribeNever, readSim, () => null);
  const demo = useMemo(() => resolveCompassDemo(sim), [sim]);
  const { data: demoAnswer } = useQuery({
    queryKey: ['compass-demo', demo?.preset],
    queryFn: async (): Promise<NearbyResponse> => {
      const result = await fetchNearby({
        lat: demo!.anchor.latitude,
        lng: demo!.anchor.longitude,
        radius: 1000,
        limit: 6,
      });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: demo !== null,
    // The same cadence as the real one: waits move every few minutes.
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const data = demo ? demoAnswer : nearby;
  const inPark = mounted && data?.type === 'in_park' ? (data.data as NearbyAttractionsData) : null;
  const shown = inPark !== null && splitInParkRides(inPark.rides ?? []).headliners.length > 0;
  const parkName = inPark?.park.name;
  // One object for as long as the demo and the park stay the same: `ParkCompass` keys its
  // placement of the park on it.
  const demoProp = useMemo(
    () =>
      demo && parkName
        ? {
            parkName,
            anchor: { lat: demo.anchor.latitude, lng: demo.anchor.longitude },
          }
        : undefined,
    [demo, parkName]
  );

  // The module, fetched the moment there is a park to show and not before.
  const [ParkCompass, setParkCompass] = useState<ParkCompassComponent | null>(null);
  useLoadParkCompass(shown && !ParkCompass, setParkCompass);

  const slotRef = useRef<HTMLDivElement>(null);
  const placed = usePlacedOutOfSight(slotRef, shown && ParkCompass !== null);
  const visible = shown && placed && ParkCompass !== null;

  // The hero's pill to this section appears while it is here (`useCompassPresent`).
  useEffect(() => {
    setCompassPresent(visible);
    return () => setCompassPresent(false);
  }, [visible]);

  return (
    <div ref={slotRef} data-compass-slot="">
      {visible && inPark && data && ParkCompass && (
        // `scroll-mt-16`: the hero's pill scrolls here, and the sticky 48 px header would cover
        // the panel's top edge without it. The heading inside names the section.
        <section
          id={PARK_COMPASS_ID}
          tabIndex={-1}
          className="scroll-mt-16 px-4 pt-2 pb-12 outline-none"
        >
          <div className="container mx-auto">
            {/* Keyed by park: a pin and a ride ahead belong to the park they were chosen in. */}
            <ParkCompass
              key={inPark.park.slug}
              data={inPark}
              userLocation={data.userLocation}
              demo={demoProp}
            />
          </div>
        </section>
      )}
    </div>
  );
}
