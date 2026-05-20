import { cache } from 'react';
import { api } from './client';
import { withServerCache } from './server-cache';
import type { ParkWithAttractions, AttractionResponse } from './types';

const PARK_MAX_AGE = 300; // 5 min — matches API Redis/Cloudflare cache

/**
 * Get parks by geographic path.
 * In-process cache (max-age 300s, no SWR): serves cached data if fresh,
 * awaits a real fetch if stale. React.cache() deduplicates within one request.
 */
export const getParkByGeoPath = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string
  ): Promise<ParkWithAttractions> => {
    return withServerCache(
      `park:${continent}/${country}/${city}/${parkSlug}`,
      () =>
        api.get<ParkWithAttractions>(`/v1/parks/${continent}/${country}/${city}/${parkSlug}`, {
          cache: 'no-store',
        }),
      PARK_MAX_AGE
    );
  }
);

/**
 * Get a specific attraction by geographic path with full data including history.
 * In-process cache (max-age 300s, no SWR): serves cached data if fresh,
 * awaits a real fetch if stale. React.cache() deduplicates within one request.
 */
export const getAttractionByGeoPath = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string,
    attractionSlug: string
  ): Promise<AttractionResponse> => {
    return withServerCache(
      `attraction:${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
      () =>
        api.get<AttractionResponse>(
          `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
          { cache: 'no-store' }
        ),
      PARK_MAX_AGE
    );
  }
);
