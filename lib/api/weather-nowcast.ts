import { api, ApiError } from './client';
import type { WeatherNowcast } from './types';

// Data-cache window for the cached nowcast seed. The live banner is refreshed client-side via the
// uncached `getParkWeatherNowcastFresh` poll, so this only seeds first paint / no-JS / crawlers.
const NOWCAST_SEED_TTL = 3600;

/**
 * How long a nowcast seed may be cached inside a PRERENDERED page.
 *
 * A caller on a static route buys its window with ISR writes, because Next takes the shortest
 * revalidate of any fetch in a route: an hour here means that page rebuilds 24 times a day. That
 * is worth paying where the value is read (the homepage's heat warnings compare the reading
 * against a threshold, and a stale one is wrong rather than merely old) and not worth paying
 * where it is decoration — a blog post's weather card is refreshed client-side by
 * `useWeatherNowcast` before anyone reads it, and no crawler has ever cared what the rain did in
 * an article about wait times.
 */
export const NOWCAST_SEED_TTL_DECORATIVE = 604800; // 7d — client refreshes it; nobody reads the seed

/**
 * Get short-term (next ~2h) weather nowcast for a park.
 * Returns null if nowcast is unavailable (404 — missing coordinates or upstream down).
 * Cached in the Vercel Data Cache (`fetch` `next: { revalidate }`); the live banner is refreshed
 * client-side (see getParkWeatherNowcastFresh / useWeatherNowcast).
 *
 * `revalidate` is a parameter because the window is a property of the CALLER, not of the data —
 * see {@link NOWCAST_SEED_TTL_DECORATIVE}. The default keeps every existing caller exactly as it
 * was.
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
