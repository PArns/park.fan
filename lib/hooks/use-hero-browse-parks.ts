'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { HOME_NEARBY_LIMIT, useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { stripNewPrefix } from '@/lib/utils';
import { HERO_REST_ROWS_DESKTOP, HERO_REST_ROWS_PHONE } from '@/lib/home/hero-search';
import type { SearchBrowseItem } from '@/lib/analytics/site-analytics';
import type {
  PopularPark,
  ParkStatus,
  CrowdLevel,
  ScheduleSummary,
  SearchResultItem,
} from '@/lib/api/types';
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
  /**
   * A shut park's schedule entries, today's and the next operating day's, which its pill reads the
   * next opening from (`nextParkOpening`).
   */
  schedules?: { today?: ScheduleSummary; next?: ScheduleSummary };
  /** The park's IANA zone, which the next opening's day and time are read in. */
  timezone?: string;
  /** The status pill's text where it is not the status's word (`useHeroStatusLabels`). */
  statusLabel?: string;
}

/** A row of the pre-query list: a search result with its live extras and what kind of row it is. */
export type NearbySearchItem = SearchResultItem &
  NearbySearchExtras & {
    /** What `search_browse_clicked` reports when the row is opened. */
    browseItem: SearchBrowseItem;
  };

/** The pre-query list, as {@link useHeroBrowseParks} returns it. */
export interface HeroBrowseParks {
  /** True while the visitor is standing inside a park: the park, then its rides. */
  inPark: boolean;
  /** The list as search-result rows. */
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

/** How many rows the list holds at most: what the nearby request returns. */
const BROWSE_LIMIT = HOME_NEARBY_LIMIT;

/**
 * Nearby parks the hero's resting lists need before popular parks fill them up: their rows have a
 * reserved height, and the nearby answer can come back shorter than that.
 */
const BROWSE_MIN_PARKS = Math.max(HERO_REST_ROWS_DESKTOP, HERO_REST_ROWS_PHONE);

/**
 * The park's own API URL out of one of its rides' (`…/parks/<continent>/<country>/<city>/<park>/…`):
 * the in-park answer sends none for the park, and a row without one leads nowhere.
 */
const parkUrlOfRide = (url: string | undefined): string | undefined =>
  url?.match(/^.*?\/parks(?:\/[^/]+){4}/)?.[0];

/** A shut park's schedule entries and its zone, for the status pill; nothing for an open park. */
const shutParkSchedules = (park: {
  status: string;
  timezone: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}): Pick<NearbySearchExtras, 'schedules' | 'timezone'> =>
  park.status === 'CLOSED'
    ? {
        schedules: { today: park.todaySchedule, next: park.nextSchedule },
        timezone: park.timezone,
      }
    : {};

const popularRow = (park: PopularPark): NearbySearchItem => ({
  type: 'park',
  id: park.id,
  name: park.name,
  slug: park.slug,
  url: park.url ?? undefined,
  city: park.city ?? undefined,
  country: park.country ?? undefined,
  continent: park.continent ?? undefined,
  browseItem: 'popular_park',
});

/**
 * What the search shows before anything is typed: the visitor's nearby parks, or — when the
 * nearby lookup yields nothing (location denied AND the GeoIP fallback came up empty) — the
 * most popular parks, so the list is never blank. A nearby answer shorter than
 * {@link BROWSE_MIN_PARKS} is filled up with popular parks it does not already list.
 *
 * The hero's list on both viewports and the palette call this, and React Query dedupes them into
 * one nearby request and at most one popular-parks request.
 */
export function useHeroBrowseParks(): HeroBrowseParks {
  const locale = useLocale();
  const afterLoad = useAfterLoad();
  const { data: nearbyData, isPending: nearbyPending } = useHomeNearbyParks();

  // Open parks first, then by distance — the same order the nearby card's list uses. The API
  // returns pure distance order, which buries an open park behind three shut ones at three in
  // the afternoon; the pre-query list is about where you could go NOW.
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

  // Only ask for popular parks once the nearby lookup has come back empty or short — the
  // common case never fires this request at all.
  // The reader's language's most viewed parks first (`getMostViewedParks`).
  const { data: popular, isPending: popularPending } = useQuery<PopularPark[]>({
    queryKey: ['popular-parks', BROWSE_LIMIT, locale],
    queryFn: async () => {
      const res = await fetch(`/api/parks/popular?limit=${BROWSE_LIMIT}&locale=${locale}`);
      if (!res.ok) throw new Error(`Failed to fetch popular parks: ${res.statusText}`);
      return res.json();
    },
    enabled: afterLoad && !nearbyPending && !inParkData && nearbyParks.length < BROWSE_MIN_PARKS,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });

  // Pending until something is on screen: the nearby lookup itself (which does not even start
  // until after load), and then the popular-parks fallback when nearby came back empty.
  const isPending = !hasNearby && (!afterLoad || nearbyPending || popularPending);

  return useMemo((): HeroBrowseParks => {
    if (inParkData) {
      const rides: AttractionWithDistance[] = inParkData.rides.slice(0, BROWSE_LIMIT - 1);
      const parkUrl =
        inParkData.park.url ??
        inParkData.rides.map((ride) => parkUrlOfRide(ride.url)).find((url) => url);
      return {
        inPark: true,
        isFallback: false,
        isPending: false,
        items: [
          {
            type: 'park',
            id: inParkData.park.id,
            name: inParkData.park.name,
            slug: inParkData.park.slug,
            url: parkUrl,
            status: inParkData.park.status as ParkStatus,
            load: inParkData.park.analytics?.crowdLevel as CrowdLevel | undefined,
            distanceM: inParkData.park.distance,
            imageUrl: inParkData.park.backgroundImage ?? undefined,
            avgWaitTime: inParkData.park.analytics?.avgWaitTime,
            ...shutParkSchedules(inParkData.park),
            browseItem: 'nearby_park' as const,
          },
          ...rides.map((ride) => ({
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
              url: parkUrl ?? '',
            },
            distanceM: ride.distance,
            browseItem: 'in_park_ride' as const,
          })),
        ],
      };
    }

    // Entries without a URL are dropped: the popular ranking's `url` is nullable, and a row
    // that resolves to no route is a click that does nothing.
    const fallback = (popular ?? []).filter((park) => park.url);

    if (nearbyParks.length > 0) {
      const parks = nearbyParks.slice(0, BROWSE_LIMIT);
      const listed = new Set(parks.map((park) => park.id));
      const fill =
        parks.length < BROWSE_MIN_PARKS
          ? fallback
              .filter((park) => !listed.has(park.id))
              .slice(0, BROWSE_MIN_PARKS - parks.length)
          : [];
      return {
        inPark: false,
        isFallback: false,
        isPending: false,
        items: [
          ...parks.map((park) => ({
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
            ...shutParkSchedules(park),
            browseItem: 'nearby_park' as const,
          })),
          // The popular ranking carries no live data, so these rows show no status rather than
          // a guessed one.
          ...fill.map(popularRow),
        ],
      };
    }

    return {
      inPark: false,
      isFallback: fallback.length > 0,
      isPending,
      items: fallback.map(popularRow),
    };
  }, [inParkData, nearbyParks, popular, isPending]);
}

/**
 * The rows the hero lists: in a park only its rides, since the hero's park actions above already
 * lead to the park itself. The palette lists the park too.
 */
export function heroBrowseRows(browse: HeroBrowseParks): NearbySearchItem[] {
  return browse.inPark ? browse.items.filter((item) => item.type !== 'park') : browse.items;
}
