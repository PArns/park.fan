'use client';

import { useQuery } from '@tanstack/react-query';

/** What the live poll leaves out about one ride, as `/ride-alternatives` answers it. */
export interface RideAlternativeMeta {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  types: string[];
  minimumHeight: number | null;
}

interface UseRideAlternativeMetaParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  enabled?: boolean;
}

/**
 * Position, ride type and minimum height of every ride in a park, keyed by slug: the part of
 * „a shorter queue nearby" that the lean live poll does not carry. The answer is day-stable on
 * both ends, so it is fetched once per tab.
 */
export function useRideAlternativeMeta({
  continent,
  country,
  city,
  parkSlug,
  enabled = true,
}: UseRideAlternativeMetaParams) {
  return useQuery({
    queryKey: ['ride-alternatives', continent, country, city, parkSlug],
    queryFn: async (): Promise<Map<string, RideAlternativeMeta>> => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/ride-alternatives`
      );
      if (!response.ok) throw new Error(`ride-alternatives ${response.status}`);
      const { rides } = (await response.json()) as { rides: RideAlternativeMeta[] };
      return new Map(rides.map((ride) => [ride.slug, ride]));
    },
    enabled,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
