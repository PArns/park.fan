'use client';

import { useEffect, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { resolveCompassDemo } from '@/lib/nearby-simulation';
import { PARK_COMPASS_ID, setCompassPresent } from '@/lib/home/compass-presence';
import type { NearbyAttractionsData, NearbyResponse } from '@/types/nearby';

const subscribeNever = () => () => {};
const readSim = () => new URLSearchParams(window.location.search).get('sim');

/**
 * The compass's own chunk, fetched only by a visitor this page has placed inside a park. Everybody
 * else — nearly every visitor to the homepage — never downloads it.
 */
const ParkCompass = dynamic(
  () => import('./park-compass').then((m) => ({ default: m.ParkCompass })),
  {
    ssr: false,
  }
);

/**
 * Directly under the homepage hero: the in-park compass, or nothing.
 *
 * It reads the same `/api/nearby` answer as the hero's welcome (`useHomeNearbyParks`, one request
 * between them), and like the welcome it waits for the mount — the hook can answer from a cached
 * position in the first client render, and the server wrote nothing here.
 *
 * Only for `in_park`. The 1 km fallback the hero also welcomes comes from `nearby_parks`, which
 * carries no rides, so there is nothing to point at.
 *
 * It does move the page when it appears, and that is accepted rather than reserved: a box held
 * open under the hero would be several hundred pixels of nothing for every visitor at home, and
 * the hero fills the first screen on a phone, so the reader at the top does not see it arrive.
 */
export function ParkCompassSlot() {
  const t = useTranslations('nearby.compass');
  const mounted = useMounted();
  const { data: nearby } = useHomeNearbyParks();

  // `?sim=compass[:preset]`: the park's own nearby answer, asked for at the preset's coordinates —
  // a request like any visitor's, which is why this works in production (`resolveCompassDemo`).
  const demo = resolveCompassDemo(useSyncExternalStore(subscribeNever, readSim, () => null));
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
  const shown = Boolean(
    inPark?.rides?.some((r) => r.isHeadliner && r.isCurrentlyInSeason !== false)
  );
  // The hero's pill to this section appears while it is here (`useCompassPresent`).
  useEffect(() => {
    setCompassPresent(shown);
    return () => setCompassPresent(false);
  }, [shown]);

  if (!inPark || !shown || !data) return null;

  return (
    // `scroll-mt-16`: the hero's pill scrolls here, and the sticky 48 px header would cover the
    // panel's top edge without it.
    <section
      id={PARK_COMPASS_ID}
      tabIndex={-1}
      aria-label={t('title')}
      className="scroll-mt-16 px-4 pt-2 pb-12 outline-none"
    >
      <div className="container mx-auto">
        <ParkCompass
          data={inPark}
          userLocation={data.userLocation}
          demo={
            demo
              ? {
                  parkName: inPark.park.name,
                  anchor: { lat: demo.anchor.latitude, lng: demo.anchor.longitude },
                }
              : undefined
          }
        />
      </div>
    </section>
  );
}
