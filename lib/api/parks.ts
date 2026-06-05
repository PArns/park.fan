import { cacheLife } from 'next/cache';
import { api } from './client';
import type { ParkWithAttractions, AttractionResponse, PopularPark } from './types';

const PARK_MAX_AGE = 300; // 5 min — matches API Redis/Cloudflare cache

/**
 * Get parks by geographic path. Cached via Cache Components (`'use cache'`):
 * the static shell of the park page captures this snapshot; live wait times are
 * refreshed client-side by LiveParkData.
 */
export async function getParkByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWithAttractions> {
  'use cache';
  cacheLife({ stale: PARK_MAX_AGE, revalidate: PARK_MAX_AGE, expire: PARK_MAX_AGE * 4 });
  return api.get<ParkWithAttractions>(`/v1/parks/${continent}/${country}/${city}/${parkSlug}`);
}

/**
 * Get a specific attraction by geographic path with full data including history.
 * Cached via Cache Components; live wait times are refreshed client-side.
 */
export async function getAttractionByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attractionSlug: string
): Promise<AttractionResponse> {
  'use cache';
  cacheLife({ stale: PARK_MAX_AGE, revalidate: PARK_MAX_AGE, expire: PARK_MAX_AGE * 4 });
  return api.get<AttractionResponse>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`
  );
}

/**
 * Get the most-requested parks, ranked by tracked request volume.
 * The popularity ranking drifts slowly, so a few minutes of staleness is fine.
 * @param limit clamped to 1–100 by the API (default 20)
 */
export async function getPopularParks(limit = 20): Promise<PopularPark[]> {
  'use cache';
  cacheLife({ stale: 300, revalidate: 300, expire: 1200 });
  return api.get<PopularPark[]>('/v1/parks/popular', { params: { limit } });
}
