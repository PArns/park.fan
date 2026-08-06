'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { stripNewPrefix } from '@/lib/utils';
import type { PopularPark, ParkStatus, CrowdLevel } from '@/lib/api/types';
import type {
  NearbyAttractionsData,
  NearbyParksData,
  AttractionWithDistance,
  ParkWithDistance,
} from '@/types/nearby';
import type { NearbySearchItem } from '@/lib/hooks/use-search-results';

export interface HeroBrowseEntry {
  id: string;
  name: string;
  /** API url — callers convert it with `convertApiUrlToFrontendUrl`. */
  url?: string;
  /** Park average wait, or a ride's own wait while in a park. Null when unknown/closed. */
  wait: number | null;
  open: boolean;
}

export interface HeroBrowseParks {
  /** True while the visitor is standing inside a park (entries are that park's rides). */
  inPark: boolean;
  /** Park (or ride) list for the hero bubbles. */
  entries: HeroBrowseEntry[];
  /** The same list shaped as search-result rows for the in-place search list. */
  items: NearbySearchItem[];
  /** True when the list is the popular-parks fallback rather than a real nearby result. */
  isFallback: boolean;
}

/** How many parks the hero shows before the visitor searches (bubbles wrap to two rows). */
const HERO_BROWSE_LIMIT = 5;

/**
 * What the hero shows before anything is typed: the visitor's nearby parks, or — when the
 * nearby lookup yields nothing (location denied AND the GeoIP fallback came up empty) — the
 * most popular parks, so the bubbles and the in-place search list are never blank.
 *
 * Both consumers (bubbles + inline search list) call this, and React Query dedupes them into
 * one nearby request and at most one popular-parks request.
 */
export function useHeroBrowseParks(): HeroBrowseParks {
  const afterLoad = useAfterLoad();
  const { data: nearbyData, isPending: nearbyPending } = useHomeNearbyParks();

  // Memoized so the `[]` fallback isn't a fresh array on every render (it feeds the useMemo below).
  const nearbyParks: ParkWithDistance[] = useMemo(
    () => (nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : []),
    [nearbyData]
  );
  const inParkData =
    nearbyData?.type === 'in_park' ? (nearbyData.data as NearbyAttractionsData) : null;
  const hasNearby = nearbyParks.length > 0 || inParkData != null;

  // Only ask for popular parks once the nearby lookup has actually come back empty — the
  // common case never fires this request at all.
  const { data: popular } = useQuery<PopularPark[]>({
    queryKey: ['popular-parks', HERO_BROWSE_LIMIT],
    queryFn: async () => {
      const res = await fetch(`/api/parks/popular?limit=${HERO_BROWSE_LIMIT}`);
      if (!res.ok) throw new Error(`Failed to fetch popular parks: ${res.statusText}`);
      return res.json();
    },
    enabled: afterLoad && !nearbyPending && !hasNearby,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });

  return useMemo((): HeroBrowseParks => {
    if (inParkData) {
      const rides: AttractionWithDistance[] = inParkData.rides.slice(0, HERO_BROWSE_LIMIT);
      return {
        inPark: true,
        isFallback: false,
        entries: rides.map((ride) => ({
          id: ride.id,
          name: stripNewPrefix(ride.name),
          url: ride.url,
          wait: ride.waitTime ?? null,
          open: ride.status === 'OPERATING',
        })),
        items: [
          {
            type: 'park',
            id: inParkData.park.id,
            name: inParkData.park.name,
            slug: inParkData.park.slug,
            url: inParkData.park.url,
            status: inParkData.park.status as ParkStatus,
            load: inParkData.park.analytics?.crowdLevel as CrowdLevel | undefined,
            distanceM: inParkData.park.distance,
            imageUrl: inParkData.park.backgroundImage ?? undefined,
            avgWaitTime: inParkData.park.analytics?.avgWaitTime,
          },
          ...rides.slice(0, 4).map((ride) => ({
            type: 'attraction' as const,
            id: ride.id,
            name: ride.name,
            slug: ride.slug,
            url: ride.url,
            status: ride.status,
            waitTime: ride.waitTime ?? undefined,
            parentPark: {
              id: inParkData.park.id,
              name: inParkData.park.name,
              slug: inParkData.park.slug,
              url: inParkData.park.url ?? '',
            },
            distanceM: ride.distance,
          })),
        ],
      };
    }

    if (nearbyParks.length > 0) {
      const parks = nearbyParks.slice(0, HERO_BROWSE_LIMIT);
      return {
        inPark: false,
        isFallback: false,
        entries: parks.map((park) => ({
          id: park.id,
          name: stripNewPrefix(park.name),
          url: park.url,
          wait: park.status === 'OPERATING' ? (park.analytics?.avgWaitTime ?? null) : null,
          open: park.status === 'OPERATING',
        })),
        items: parks.map((park) => ({
          type: 'park' as const,
          id: park.id,
          name: park.name,
          slug: park.slug,
          url: park.url,
          city: park.city,
          country: park.country,
          continent: park.continent,
          status: park.status as ParkStatus,
          load: park.analytics?.crowdLevel as CrowdLevel | undefined,
          distanceM: park.distance,
          imageUrl: park.backgroundImage ?? undefined,
          avgWaitTime: park.analytics?.avgWaitTime,
          attractionCounts:
            park.totalAttractions > 0
              ? { open: park.operatingAttractions, total: park.totalAttractions }
              : undefined,
        })),
      };
    }

    const fallback = popular ?? [];
    return {
      inPark: false,
      isFallback: fallback.length > 0,
      entries: fallback.map((park) => ({
        id: park.id,
        name: stripNewPrefix(park.name),
        url: park.url ?? undefined,
        // The popular ranking carries no live status — the row/bubble just omits the number.
        wait: null,
        open: true,
      })),
      items: fallback.map((park) => ({
        type: 'park' as const,
        id: park.id,
        name: park.name,
        slug: park.slug,
        url: park.url ?? undefined,
        city: park.city ?? undefined,
        country: park.country ?? undefined,
        continent: park.continent ?? undefined,
      })),
    };
  }, [inParkData, nearbyParks, popular]);
}
