'use client';

import { useQuery } from '@tanstack/react-query';
import type { PlannerGeo } from '@/lib/planner/types';

export interface RidePosition {
  slug: string;
  latitude: number;
  longitude: number;
}

/** A park's ride coordinates, and how far its magnetic north lies east of true north. */
export interface RidePositions {
  bySlug: Map<string, RidePosition>;
  /** Degrees, east positive: add it to a magnetic compass heading to get a true one. */
  declination: number;
}

/**
 * Every ride's coordinates in one park, keyed by slug — for pointing at rides, which the nearby
 * answer cannot do: it sends each ride's distance and wait, and no coordinates.
 *
 * `/api/parks/<geo>/<park>/positions` is a small slice of the park and day-stable on both ends, so
 * it is fetched once and never refetched while the tab lives.
 */
export function useRidePositions(geo: PlannerGeo | null, parkSlug: string | null) {
  return useQuery({
    queryKey: ['ride-positions', geo?.continent, geo?.country, geo?.city, parkSlug],
    queryFn: async (): Promise<RidePositions> => {
      const response = await fetch(
        `/api/parks/${geo!.continent}/${geo!.country}/${geo!.city}/${parkSlug}/positions`
      );
      if (!response.ok) throw new Error(`positions ${response.status}`);
      const { positions, declination } = (await response.json()) as {
        positions: RidePosition[];
        declination?: number;
      };
      return {
        bySlug: new Map(positions.map((p) => [p.slug, p])),
        declination: typeof declination === 'number' ? declination : 0,
      };
    },
    enabled: geo !== null && parkSlug !== null,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
