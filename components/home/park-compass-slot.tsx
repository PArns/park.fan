'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { splitInParkRides } from '@/components/parks/nearby-in-park-view';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { resolveCompassDemo } from '@/lib/nearby-simulation';
import { PARK_COMPASS_ID, setCompassPresent } from '@/lib/home/compass-presence';
import type { NearbyAttractionsData, NearbyResponse } from '@/types/nearby';

const subscribeNever = () => () => {};
const readSim = () => new URLSearchParams(window.location.search).get('sim');

/**
 * How much of the viewport may lie below the slot when the compass goes in for a reader who has
 * scrolled: pushing a sliver out of view scores its share of the screen, so a tenth scores about
 * 0.1 at most.
 */
const VISIBLE_SLICE = 0.1;

/**
 * Whether the compass may go in now: at the top of the page always, anywhere else only while the
 * slot lies below the viewport, give or take VISIBLE_SLICE. The top is the exception because
 * waiting there can mean never: the hero's height follows its welcome line, and on common phones
 * the slot sits inside the viewport at y = 0 (docs/features/park-compass.md has the table).
 */
function mayPlace(slotTop: number): boolean {
  return window.scrollY < 1 || slotTop >= window.innerHeight * (1 - VISIBLE_SLICE);
}

/** The compass's own module, loaded by hand — see „where it appears" below. */
type ParkCompassComponent = typeof import('./park-compass').ParkCompass;

/**
 * Directly under the homepage hero: the in-park compass, or nothing. It reads the same
 * `/api/nearby` answer as the hero's welcome and, like it, waits for the mount. Only for `in_park`
 * with a headliner in season, the filter `ParkCompass` lists by (`splitInParkRides`).
 *
 * Where it appears, and when: no box is held open for it (a screen of nothing for everyone at
 * home), so its arrival would shove down a reader who has scrolled past, and a compensating
 * `scrollBy` is still scored as a shift. So the module is fetched only for a visitor in a park,
 * and the compass goes in only where it moves nothing the reader is looking at (`mayPlace`).
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
      const url = new URL('/api/nearby', window.location.origin);
      url.searchParams.set('lat', String(demo!.anchor.latitude));
      url.searchParams.set('lng', String(demo!.anchor.longitude));
      url.searchParams.set('radius', '1000');
      url.searchParams.set('limit', '6');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`nearby ${response.status}`);
      return response.json();
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
  useEffect(() => {
    if (!shown || ParkCompass) return;
    let live = true;
    import('./park-compass').then((m) => {
      if (live) setParkCompass(() => m.ParkCompass);
    });
    return () => {
      live = false;
    };
  }, [shown, ParkCompass]);

  // Put in only while the slot is below the viewport — see „where it appears" above. Once in, it
  // stays.
  const slotRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (!shown || !ParkCompass || placed) return;
    const el = slotRef.current;
    if (!el) return;
    // At most one layout read per frame. A listener rather than an IntersectionObserver, because
    // `mayPlace` also asks whether the page is back at its top.
    let frame = 0;
    const check = () => {
      frame = 0;
      if (mayPlace(el.getBoundingClientRect().top)) setPlaced(true);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [shown, ParkCompass, placed]);
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
