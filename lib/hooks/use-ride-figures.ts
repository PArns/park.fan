'use client';

import { useQuery } from '@tanstack/react-query';
import type { RideFigures } from '@/lib/api/ride-figures';

interface UseRideFiguresParams {
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
}

/**
 * Top speed, height and duration for every ride in a park, keyed by attraction id.
 *
 * The park page's server render carries no `rideProfile` (`leanParkForParkShell`), and the map
 * is a tab most visitors never open, so its popups ask for the figures when the map mounts
 * instead of every page paying for them. The answer is day-stable on both ends (the proxy reads
 * the day-cached park, the CDN holds it a day), so it is fetched once per tab and never
 * refetched. Until it lands, or when it fails, the popup simply has no figure rows.
 */
export function useRideFigures({ continent, country, city, parkSlug }: UseRideFiguresParams) {
  return useQuery({
    queryKey: ['ride-figures', continent, country, city, parkSlug],
    queryFn: async (): Promise<Record<string, RideFigures>> => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/ride-stats`
      );
      if (!response.ok) throw new Error(`ride-stats ${response.status}`);
      const { stats } = (await response.json()) as { stats: Record<string, RideFigures> };
      return stats;
    },
    enabled: Boolean(continent && country && city && parkSlug),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
