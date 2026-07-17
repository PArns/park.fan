'use client';

import { ParkCard } from '@/components/parks/park-card';
import { useParkNeighbors } from '@/lib/hooks/use-park-neighbors';
import type { ParkStatus } from '@/lib/api/types';

/** Static (cacheable) nearby-park fields — name, link, distance, photo. No live status. */
export interface StaticNearbyPark {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  distance: number;
  /** API url (converted to a frontend href by ParkCard). */
  url: string;
  backgroundImage: string | null;
}

/**
 * Park-page "nearby parks" grid. The proximity list (names, links, distance, photo) is prerendered
 * and edge-cached; live open/closed status + crowd is layered on the client via
 * {@link useParkNeighbors}, so the park-page shell no longer bakes (potentially stale) neighbour
 * statuses into the cached output.
 */
export function LiveNearbyParks({
  parkId,
  lat,
  lng,
  parks,
}: {
  parkId: string;
  lat: number;
  lng: number;
  parks: StaticNearbyPark[];
}) {
  const { liveByParkId } = useParkNeighbors(lat, lng, parkId);

  return (
    <ul className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parks.map((park) => {
        const live = liveByParkId?.[park.id];
        return (
          <li key={park.id} className="row-span-3 grid [grid-template-rows:subgrid]">
            <ParkCard
              id={park.id}
              slug={park.slug}
              name={park.name}
              city={park.city}
              country={park.country}
              url={park.url}
              backgroundImage={park.backgroundImage}
              distance={park.distance}
              translateCountry
              variant="detailed"
              status={live?.status as ParkStatus | undefined}
              timezone={live?.timezone}
              totalAttractions={live?.totalAttractions}
              operatingAttractions={live?.operatingAttractions}
              analytics={live?.analytics}
              todaySchedule={live?.todaySchedule ?? undefined}
              nextSchedule={live?.nextSchedule ?? undefined}
              hasOperatingSchedule={live?.hasOperatingSchedule}
            />
          </li>
        );
      })}
    </ul>
  );
}
