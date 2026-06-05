import { cacheLife } from 'next/cache';
import { api, ApiError } from './client';
import type { ParkWithAttractions, AttractionResponse, PopularPark } from './types';

const PARK_MAX_AGE = 300; // 5 min — matches API Redis/Cloudflare cache

/**
 * Get parks by geographic path. Cached via Cache Components (`'use cache'`):
 * the static shell of the park page captures this snapshot; live wait times are
 * refreshed client-side by LiveParkData.
 *
 * Returns `null` for a non-existent park (API 404). The 404 MUST be caught inside this
 * `'use cache'` boundary: an error thrown across a `'use cache'` boundary bypasses the caller's
 * `try`/`catch` (and `catchNonFatal`) and surfaces as a 500 instead of letting the caller render
 * `notFound()` — so a missing park would 500 rather than 404. Other errors (maintenance/network)
 * still propagate.
 */
export async function getParkByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWithAttractions | null> {
  'use cache';
  cacheLife({ stale: PARK_MAX_AGE, revalidate: PARK_MAX_AGE, expire: PARK_MAX_AGE * 4 });
  try {
    return await api.get<ParkWithAttractions>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Get a specific attraction by geographic path with full data including history.
 * Cached via Cache Components; live wait times are refreshed client-side.
 *
 * Returns `null` on a 404 for the same reason as {@link getParkByGeoPath} (a throw across the
 * `'use cache'` boundary would 500 instead of letting the caller render `notFound()`).
 */
export async function getAttractionByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attractionSlug: string
): Promise<AttractionResponse | null> {
  'use cache';
  cacheLife({ stale: PARK_MAX_AGE, revalidate: PARK_MAX_AGE, expire: PARK_MAX_AGE * 4 });
  try {
    return await api.get<AttractionResponse>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
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
