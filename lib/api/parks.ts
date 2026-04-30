import { cache } from 'react';
import { api } from './client';
import type { ParkWithAttractions, AttractionResponse } from './types';

/**
 * Get parks by geographic path
 * Uses cache: 'no-store' to respect API cache headers (120s) for live wait times.
 * Wrapped with React.cache() for within-request deduplication only (not cross-request
 * caching) — so generateMetadata + page share one fetch result per SSR request.
 */
export const getParkByGeoPath = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string
  ): Promise<ParkWithAttractions> => {
    return api.get<ParkWithAttractions>(`/v1/parks/${continent}/${country}/${city}/${parkSlug}`, {
      next: { revalidate: 300 },
    });
  }
);

/**
 * Get a specific attraction by geographic path with full data including history
 * Uses cache: 'no-store' to respect API cache headers (120s) for live wait times.
 * Wrapped with React.cache() for within-request deduplication only (not cross-request
 * caching) — so generateMetadata + page share one fetch result per SSR request.
 */
export const getAttractionByGeoPath = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string,
    attractionSlug: string
  ): Promise<AttractionResponse> => {
    return api.get<AttractionResponse>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
      {
        next: { revalidate: 300 },
      }
    );
  }
);
