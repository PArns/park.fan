import { cache } from 'react';
import { api, ApiError } from './client';
import { withServerCache } from './server-cache';
import type { WeatherNowcast } from './types';

// API sets Cache-Control: max-age=900 (15 min). Match that here.
const NOWCAST_MAX_AGE = 900;

/**
 * Get short-term (next ~2h) weather nowcast for a park.
 * Returns null if nowcast is unavailable (404 — missing coordinates or upstream down).
 * In-process cache (max-age 900s, no SWR). React.cache() deduplicates within one request.
 */
export const getParkWeatherNowcast = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string
  ): Promise<WeatherNowcast | null> => {
    try {
      return await withServerCache(
        `nowcast:${continent}/${country}/${city}/${parkSlug}`,
        () =>
          api.get<WeatherNowcast>(
            `/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/nowcast`,
            { next: { revalidate: NOWCAST_MAX_AGE } }
          ),
        NOWCAST_MAX_AGE
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }
);
