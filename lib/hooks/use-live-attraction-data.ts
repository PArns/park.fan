import { useLiveParkData } from './use-live-park-data';
import type { ParkWithAttractions } from '@/lib/api/types';

interface UseLiveAttractionDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  initialPark: ParkWithAttractions;
}

/**
 * Fetches live park data and extracts the specific attraction from it.
 * Reuses the same React Query cache key as useLiveParkData so park and
 * attraction pages share one request when both are mounted.
 */
export function useLiveAttractionData({
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  initialPark,
}: UseLiveAttractionDataParams) {
  const {
    data: park,
    isFetching,
    isError,
    error,
  } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    initialData: initialPark,
  });

  const currentPark = park ?? initialPark;
  const attraction =
    currentPark.attractions?.find((a) => a.slug === attractionSlug) ??
    initialPark.attractions?.find((a) => a.slug === attractionSlug) ??
    null;

  return { park: currentPark, attraction, isFetching, isError, error };
}
