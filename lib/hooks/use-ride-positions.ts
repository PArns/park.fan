'use client';

import { useQuery } from '@tanstack/react-query';
import type { PlannerGeo } from '@/lib/planner/types';

export interface RidePosition {
  slug: string;
  latitude: number;
  longitude: number;
}

/**
 * Every ride's coordinates in one park, keyed by slug — for pointing at rides, which the nearby
 * answer cannot do: it sends each ride's distance and wait, and no coordinates.
 *
 * `/api/parks/<geo>/<park>/positions` is ~0.7 KB brotli against the park's ~88 KB, and it is
 * day-stable on both ends (the proxy reads the day-cached park, the CDN holds the answer a day), so
 * the query is fetched once and never refetched while the tab lives.
 */
export function useRidePositions(geo: PlannerGeo | null, parkSlug: string | null) {
  return useQuery({
    queryKey: ['ride-positions', geo?.continent, geo?.country, geo?.city, parkSlug],
    queryFn: async (): Promise<Map<string, RidePosition>> => {
      const response = await fetch(
        `/api/parks/${geo!.continent}/${geo!.country}/${geo!.city}/${parkSlug}/positions`
      );
      if (!response.ok) throw new Error(`positions ${response.status}`);
      const { positions } = (await response.json()) as { positions: RidePosition[] };
      return new Map(positions.map((p) => [p.slug, p]));
    },
    enabled: geo !== null && parkSlug !== null,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
