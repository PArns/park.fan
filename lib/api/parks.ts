import { cacheLife } from 'next/cache';
import { api, ApiError } from './client';
import type { ParkWithAttractions, AttractionResponse, PopularPark } from './types';

// Shell-level TTL for the park/attraction static prerender. Deliberately DECOUPLED from the
// API's 5-min live cadence: the wait times + open/closed status baked into the shell are only an
// SSR seed that LiveParkData / LiveAttractionData replace client-side (React Query, no-store, 5-min
// poll + refetch on mount/focus — see use-live-park-data.ts). So for any visitor with JS the shell
// TTL is invisible; it only governs the first-paint seed, no-JS visitors and crawlers. Under Cache
// Components the effective revalidate of a route shell is the MIN cacheLife of the 'use cache' reads
// in its static portion, so these values are the floor that drives the dominant per-park /
// per-attraction × per-locale ISR-write volume.
//
// Context: park/attraction pages were dynamic (no ISR writes) until they were switched to static
// ISR with revalidate:300 — which is what turned ISR writes on across the whole catalog × 6 locales.
//
// Parks keep a 1h floor: their shell carries the operating schedule, status and structured data, so
// a tighter bound is worth the extra writes. Attractions get a longer 6h floor: their shell has no
// schedule/weather (only name/description/history-chart seed, daily-ish), they are by far the
// highest-cardinality route, and their live status/wait time is client-refreshed all the same.
const PARK_MAX_AGE = 3600; // 1h park shell TTL — live data is refreshed client-side, not via ISR
const ATTRACTION_MAX_AGE = 21600; // 6h attraction shell TTL — dominant route, no schedule in shell

/**
 * Drop per-attraction fields the PARK page never renders before the snapshot is cached.
 *
 * The park detail response embeds, per attraction, a `history` array (one entry per day, each with
 * a 24-point `hourlyP90` series), plus `hourlyForecast` and `predictionAccuracy`. None of these are
 * read on the park page — the attraction cards draw their sparkline from `statistics.history`, and
 * the full history/forecast belong to the attraction DETAIL page, which sources them from
 * `getAttractionByGeoPath` (it only falls back to the park copy if the detail endpoint is down).
 * These arrays dominate the response size, and because the snapshot is persisted via `'use cache'`
 * (the data-cache entry) AND baked into every per-locale ISR route segment via `initialData={park}`,
 * their bytes are paid for as size-weighted ISR **write units** on every revalidation. Stripping
 * them here keeps the park snapshot lean everywhere it is written, without dropping a single field
 * the park page (or its live React-Query refetch through the same function) actually shows.
 */
function leanParkForShell(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: park.attractions.map((a) => {
      const lean = { ...a };
      delete lean.history;
      delete lean.hourlyForecast;
      delete lean.predictionAccuracy;
      return lean;
    }),
  };
}

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
    const park = await api.get<ParkWithAttractions>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}`
    );
    // Trim detail-only per-attraction arrays before this snapshot is cached/serialized (see
    // leanParkForShell) — they are the bulk of the size-weighted ISR write units otherwise.
    return leanParkForShell(park);
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
  cacheLife({
    stale: ATTRACTION_MAX_AGE,
    revalidate: ATTRACTION_MAX_AGE,
    expire: ATTRACTION_MAX_AGE * 4,
  });
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
 * The popularity ranking drifts slowly, so 30 min of staleness is fine — and it feeds
 * generateStaticParams + the homepage/featured seed, so a tighter window was pure write churn.
 * @param limit clamped to 1–100 by the API (default 20)
 */
export async function getPopularParks(limit = 20): Promise<PopularPark[]> {
  'use cache';
  cacheLife({ stale: 1800, revalidate: 1800, expire: 7200 });
  return api.get<PopularPark[]>('/v1/parks/popular', { params: { limit } });
}
