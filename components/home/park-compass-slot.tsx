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
 * scrolled. Pushing a sliver out of view scores its own share of the screen, so a tenth scores
 * about 0.1 at most, against the 1.0 a reader scrolled past the slot got before.
 */
const VISIBLE_SLICE = 0.1;

/**
 * Whether the compass may go in now: at the top of the page always, anywhere else only while the
 * slot lies below the viewport, give or take VISIBLE_SLICE.
 *
 * The top of the page is the exception because waiting there can mean never. The slot's top at
 * y = 0 is wherever the hero ends, and the hero's height follows its welcome line: „Herzlich
 * willkommen im Disneyland Park" takes three lines on a 390 px phone, "Welcome to Disneyland
 * Park" two. Measured at Disneyland (Anaheim), the slot sat at 680 px on 390 × 844, 412 × 915 and
 * 430 × 932 in five of six locales, inside the viewport, and a reader who then scrolls only moves
 * it further up. On those phones the compass never appeared. What it moves at the top is the
 * sliver of the next chapter's heading below the hero, and that scores its share of the screen:
 * up to 0.30 on a 430 × 932 phone in English (docs/features/park-compass.md has the table).
 */
function mayPlace(slotTop: number): boolean {
  return window.scrollY < 1 || slotTop >= window.innerHeight * (1 - VISIBLE_SLICE);
}

/** The compass's own module, loaded by hand — see „where it appears" below. */
type ParkCompassComponent = typeof import('./park-compass').ParkCompass;

/**
 * Directly under the homepage hero: the in-park compass, or nothing.
 *
 * It reads the same `/api/nearby` answer as the hero's welcome (`useHomeNearbyParks`, one request
 * between them), and like the welcome it waits for the mount — the hook can answer from a cached
 * position in the first client render, and the server wrote nothing here.
 *
 * Only for `in_park` with a headliner in season — the same filter `ParkCompass` lists by
 * (`splitInParkRides`), so the two cannot disagree about whether there is anything to show. The
 * 1 km fallback the hero also welcomes comes from `nearby_parks`, which carries no rides.
 *
 * **Where it appears, and when.** The compass is some 1,300 px on a phone and lands a second or
 * more after load. No box is held open for it (a screen of nothing for every visitor at home),
 * so its arrival moves whatever is below it, and a reader who had already scrolled past this
 * point had the page shoved down under them: a layout shift of 1.0 at y = 1100, measured. The
 * browser's scroll anchoring did not absorb it, and a `scrollBy` to compensate kept the page
 * visually still but is scored all the same — the Layout Instability API counts a node that
 * moved in the document, whatever the scroll did.
 *
 * So it goes in once its module has loaded (the chunk is fetched as soon as we know the visitor is
 * in a park, and only then — everybody else never downloads it), and then only where it moves
 * nothing the reader is looking at (`mayPlace`): at the top of the page, or while this slot lies
 * below the viewport. A reader who has scrolled past gets it when they come back up. Inside,
 * `ParkCompass` keeps its height as its data arrives (see its status line), so nothing moves
 * after that either.
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
    const check = () => {
      if (mayPlace(el.getBoundingClientRect().top)) setPlaced(true);
    };
    const frame = requestAnimationFrame(check);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
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
