import { api, ApiError } from './client';
import type { WeatherNowcast } from './types';

// Data-cache window for the nowcast seed. The banner refreshes client-side through the uncached
// poll, so this only serves first paint, no-JS visitors and crawlers.
const NOWCAST_SEED_TTL = 3600;

/**
 * Nowcast seed window for a PRERENDERED page where the seed is decoration. Next takes the shortest
 * `revalidate` in a route, so an hour would rebuild the page 24 times a day; a blog post's weather
 * card is refreshed client-side before anyone reads it.
 */
export const NOWCAST_SEED_TTL_DECORATIVE = 604800; // 7d

/**
 * Get the short-term (about two hours) weather nowcast for a park, data-cached; `null` on a 404
 * (no coordinates, or upstream down). `revalidate` is a parameter because the window belongs to
 * the caller, not the data (see {@link NOWCAST_SEED_TTL_DECORATIVE}).
 */
export async function getParkWeatherNowcast(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  revalidate: number = NOWCAST_SEED_TTL
): Promise<WeatherNowcast | null> {
  try {
    return await api.get<WeatherNowcast>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/nowcast`,
      { next: { revalidate, tags: ['weather'] } }
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Fresh (uncached) nowcast for the live client poll (`/api/parks/.../weather/nowcast`). Layering
 * our cache on the poll path would add to the upstream CDN's staleness, freeze the „live" banner
 * and push `nextUpdateAt` into the past.
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
