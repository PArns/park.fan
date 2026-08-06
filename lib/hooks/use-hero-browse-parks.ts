'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { stripNewPrefix } from '@/lib/utils';
import type { PopularPark, ParkStatus, CrowdLevel, SearchResultItem } from '@/lib/api/types';
import type {
  NearbyAttractionsData,
  NearbyParksData,
  AttractionWithDistance,
  ParkWithDistance,
} from '@/types/nearby';

/** Extra fields the nearby feed carries beyond a plain search result (distance, live counts). */
export interface NearbySearchExtras {
  distanceM?: number;
  /** Live park-wide average wait in minutes. */
  avgWaitTime?: number;
  /** Live "open of total" attraction counts. */
  attractionCounts?: { open: number; total: number };
}

export type NearbySearchItem = SearchResultItem & NearbySearchExtras;

export interface HeroBrowseEntry {
  id: string;
  name: string;
  /** API url — callers convert it with `convertApiUrlToFrontendUrl`. */
  url?: string;
  /** Park average wait, or a ride's own wait while in a park. Null when unknown/closed. */
  wait: number | null;
  /** `null` when the source carries no live status (the popular-parks fallback). */
  open: boolean | null;
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
  /** No list yet and one is still on its way — render a skeleton, not an empty box. */
  isPending: boolean;
}

/**
 * Heading above the pre-query list — "You're at X" / "Nearby parks" / "Popular parks".
 * Shared so the palette and the hero's in-place list label the same data the same way.
 */
export function useBrowseHeading(browse: HeroBrowseParks): string {
  const tSearch = useTranslations('search');
  if (browse.inPark) {
    return tSearch('headings.inPark', { park: stripNewPrefix(browse.items[0]?.name ?? '') });
  }
  return browse.isFallback ? tSearch('headings.popular') : tSearch('headings.nearby');
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

  // Open parks first, then by distance — the same order the nearby card's list uses. The API
  // returns pure distance order, which buries an open park behind three shut ones at three in
  // the afternoon; the pills and the pre-query list are both about where you could go NOW.
  // Memoized so the `[]` fallback isn't a fresh array on every render (it feeds the useMemo below).
  const nearbyParks: ParkWithDistance[] = useMemo(() => {
    if (nearbyData?.type !== 'nearby_parks') return [];
    return [...(nearbyData.data as NearbyParksData).parks].sort((a, b) => {
      const aOpen = a.status === 'OPERATING' ? 0 : 1;
      const bOpen = b.status === 'OPERATING' ? 0 : 1;
      return aOpen !== bOpen ? aOpen - bOpen : a.distance - b.distance;
    });
  }, [nearbyData]);
  const inParkData =
    nearbyData?.type === 'in_park' ? (nearbyData.data as NearbyAttractionsData) : null;
  const hasNearby = nearbyParks.length > 0 || inParkData != null;

  // Only ask for popular parks once the nearby lookup has actually come back empty — the
  // common case never fires this request at all.
  const { data: popular, isPending: popularPending } = useQuery<PopularPark[]>({
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

  // Pending until something is on screen: the nearby lookup itself (which does not even start
  // until after load), and then the popular-parks fallback when nearby came back empty.
  const isPending = !hasNearby && (!afterLoad || nearbyPending || popularPending);

  return useMemo((): HeroBrowseParks => {
    if (inParkData) {
      const rides: AttractionWithDistance[] = inParkData.rides.slice(0, HERO_BROWSE_LIMIT);
      return {
        inPark: true,
        isFallback: false,
        isPending: false,
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
        isPending: false,
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

    // Entries without a URL are dropped: the popular ranking's `url` is nullable, and a row
    // that resolves to no route is a click that does nothing.
    const fallback = (popular ?? []).filter((park) => park.url);
    return {
      inPark: false,
      isFallback: fallback.length > 0,
      isPending,
      entries: fallback.map((park) => ({
        id: park.id,
        name: stripNewPrefix(park.name),
        url: park.url ?? undefined,
        // The popular ranking carries no live data at all — neither a wait nor a status. `null`
        // is "unknown", NOT "open": claiming five green dots at three in the morning would be a
        // worse answer than admitting we don't know.
        wait: null,
        open: null,
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
  }, [inParkData, nearbyParks, popular, isPending]);
}
