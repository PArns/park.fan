import { cacheLife } from 'next/cache';
import { api, ApiError } from './client';
import type { WeatherNowcast } from './types';

// Shell-seed TTL for the cached nowcast. The API itself sets Cache-Control: max-age=900 (15 min),
// but this cached copy only seeds the park-page static shell — `useWeatherNowcast` replaces it
// client-side on mount via the uncached `getParkWeatherNowcastFresh` poll. Pinning it at 900 made
// it the MIN cacheLife in the park shell, capping the whole park route's revalidate at 15 min and
// undercutting the 1h park TTL (see PARK_MAX_AGE). 1h here lets the park shell actually reach its
// intended floor; the live banner stays fresh via the client poll regardless.
const NOWCAST_SEED_TTL = 3600;

/**
 * Get short-term (next ~2h) weather nowcast for a park.
 * Returns null if nowcast is unavailable (404 — missing coordinates or upstream down).
 * Cached 1h (Cache Components) so the park-page static shell can bake in a seed; the live banner
 * is refreshed client-side (see getParkWeatherNowcastFresh / useWeatherNowcast).
 */
export async function getParkWeatherNowcast(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<WeatherNowcast | null> {
  'use cache';
  cacheLife({ stale: NOWCAST_SEED_TTL, revalidate: NOWCAST_SEED_TTL, expire: NOWCAST_SEED_TTL * 2 });
  try {
    return await api.get<WeatherNowcast>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/nowcast`
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Fresh (uncached) nowcast for the live client poll path (`/api/parks/.../weather/nowcast`).
 *
 * `getParkWeatherNowcast` above is intentionally cached so the static park page can bake
 * nowcast into its prerendered HTML. But layering caches on the *poll* path compounds
 * staleness (up to ~15 min on top of the upstream CDN), which freezes the "live" banner and
 * pushes `nextUpdateAt` into the past. This variant skips our caches and reflects the backend's
 * latest observation as closely as the upstream CDN (max-age 900) allows. The static page's
 * stale seed is replaced on mount by the client poll (see use-weather-nowcast).
 */
export async function getParkWeatherNowcastFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<WeatherNowcast | null> {
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
