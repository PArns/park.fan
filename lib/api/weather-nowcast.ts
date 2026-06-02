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

/**
 * Fresh (uncached) nowcast for the live client poll path (`/api/parks/.../weather/nowcast`).
 *
 * `getParkWeatherNowcast` above is intentionally cached (in-process + Next data cache) so the
 * statically rendered park page can bake nowcast into its ISR HTML. But layering those caches
 * on the *poll* path compounds staleness (up to ~15 min on top of the upstream CDN), which
 * freezes the "live" banner and pushes `nextUpdateAt` into the past (hiding the countdown).
 * This variant skips our caches and reflects the backend's latest observation as closely as
 * the upstream CDN (max-age 900) allows. The static page's stale seed is replaced on mount by
 * the client poll (see use-weather-nowcast), so freshness here is what the user actually sees.
 */
export const getParkWeatherNowcastFresh = cache(
  async (
    continent: string,
    country: string,
    city: string,
    parkSlug: string
  ): Promise<WeatherNowcast | null> => {
    try {
      return await api.get<WeatherNowcast>(
        `/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/nowcast`,
        { cache: 'no-store' }
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }
);
