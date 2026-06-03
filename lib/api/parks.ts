import { cache } from 'react';
import { api } from './client';
import { withServerCache } from './server-cache';
import type { ParkWithAttractions, AttractionResponse, PopularPark } from './types';

const PARK_MAX_AGE = 300; // 5 min — matches API Redis/Cloudflare cache

/**
 * Get parks by geographic path.
 * In-process cache (max-age 300s) + Next data cache (revalidate 300s) so the park
 * page can be statically rendered (ISR). React.cache() deduplicates within one
 * request; live wait times are refreshed client-side by LiveParkData.
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
          next: { revalidate: PARK_MAX_AGE },
        }),
      PARK_MAX_AGE
    );
  }
);

/**
 * Get a specific attraction by geographic path with full data including history.
 * In-process cache (max-age 300s) + Next data cache (revalidate 300s) so the
 * attraction page can be statically rendered (ISR). React.cache() deduplicates
 * within one request; live wait times are refreshed client-side.
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
          { next: { revalidate: PARK_MAX_AGE } }
        ),
      PARK_MAX_AGE
    );
  }
);

/**
 * Get the most-requested parks, ranked by tracked request volume.
 * Mirrors the popularity signal that drives cache prewarming.
 *
 * Frontend data-cached for 5 min (revalidate 300): the popularity ranking is an
 * aggregate that drifts slowly, not live wait-time data, so a few minutes of staleness
 * is fine and this keeps repeated reads off the backend. React.cache() still dedupes
 * within a single request.
 * @param limit clamped to 1–100 by the API (default 20)
 */
export const getPopularParks = cache(async (limit = 20): Promise<PopularPark[]> => {
  return api.get<PopularPark[]>('/v1/parks/popular', {
    params: { limit },
    next: { revalidate: 300 },
  });
});
