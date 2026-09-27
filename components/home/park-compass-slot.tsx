'use client';

import dynamic from 'next/dynamic';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import type { NearbyAttractionsData } from '@/types/nearby';

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
  const mounted = useMounted();
  const { data } = useHomeNearbyParks();
  if (!mounted || data?.type !== 'in_park') return null;
  const inPark = data.data as NearbyAttractionsData;
  if (!inPark.rides?.some((r) => r.isHeadliner && r.isCurrentlyInSeason !== false)) return null;

  return (
    <section className="px-4 pt-2 pb-12">
      <div className="container mx-auto">
        <ParkCompass data={inPark} userLocation={data.userLocation} />
      </div>
    </section>
  );
}
