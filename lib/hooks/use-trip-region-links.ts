'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import type { TripRegionLinks } from '@/lib/trip-regions/trip-links';

/**
 * The trip regions' names and parks from `/api/nav/trip-regions`, once `enabled`, each with its
 * words in the reader's language: what the search palette matches a query against and the day
 * planner checks its parks against. One query key for both, asked once per tab and language; the
 * region changes when its curation does, so an hour is fresh. A failed read is not retried: the
 * row it would add is a way in, and nothing waits for it.
 */
export function useTripRegionLinks(enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: ['trip-region-links', locale],
    queryFn: async () => {
      const response = await fetch(`/api/nav/trip-regions?locale=${encodeURIComponent(locale)}`);
      if (!response.ok) throw new Error(`nav trip regions ${response.status}`);
      return ((await response.json()) as { regions: TripRegionLinks[] }).regions;
    },
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
