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
// Both shells revalidate every 7 DAYS. The shell carries only day-stable, SEO-relevant structure
// (name, attraction list + links, FAQ, JSON-LD, summary stats); every "today/now" value and all
// live data (status, wait times, weather, history, forecast) is CLIENT-derived (useBrowserNow /
// React Query no-store polls via getParkByGeoPathFresh), so a 7-day-old shell never shows stale
// live data to a JS visitor — it only seeds first paint, no-JS visitors and crawlers, which change
// at most when a ride is added/removed. 7 days cuts the time-based per-park/per-attraction ×
// per-locale ISR-write FREQUENCY ~7× vs 1 day; on-demand revalidation (a backend webhook →
// revalidateTag) can later push it toward ∞. Cold renders are avoided by prebuilding all parks
// (generateStaticParams) + the prewarm cron, so the long TTL has no first-paint downside.
const PARK_MAX_AGE = 604800; // 7d park shell TTL — live data is client-side
const ATTRACTION_MAX_AGE = 604800; // 7d attraction shell TTL — live data is client-side

/**
 * Trim for the LIVE (no-store) client poll: drop only attraction-detail-only fields the park/
 * attraction cards never use — the raw `url` (the card's `getHref` falls back to `${parkPath}/${slug}`,
 * the identical frontend URL) and the detail-only `history`/`hourlyForecast`/`predictionAccuracy`.
 * KEEPS `statistics` (incl. the card sparkline `history`), `bestVisitTimes` and `queues` — the cards
 * render those live. This response is served `no-store` (see the /api/parks proxy), so its size
 * carries NO ISR-write cost.
 */
function leanParkForLive(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: park.attractions.map((a) => {
      const lean = { ...a };
      delete lean.url; // href falls back to `${parkPath}/${slug}` — identical frontend URL
      delete lean.history; // attraction-detail-only if ever present
      delete lean.hourlyForecast; // detail-only
      delete lean.predictionAccuracy; // detail-only
      return lean;
    }),
  };
}

/**
 * Trim for the ISR SHELL — the `'use cache'` snapshot baked into every per-park/per-attraction ×
 * per-locale write AND serialized into the page as the `initialData`/`initialPark` prop. On top of
 * the live trim it drops the heavy per-attraction `statistics.history` sparkline time-series — the
 * single biggest size chunk and the main size-weighted ISR-write driver. Nothing in the SHELL needs
 * it: the FAQ uses only summary statistics, and the card sparkline is `history ?? []` filled by the
 * live poll (which keeps the full `statistics`). Everything SEO-relevant stays — name, slug/link,
 * land, summary stats, and `queues` (the attraction FAQ's queue-type answers).
 */
function leanParkForShell(park: ParkWithAttractions): ParkWithAttractions {
  const live = leanParkForLive(park);
  return {
    ...live,
    attractions: live.attractions.map((a) => {
      if (!a.statistics) return a;
      const statsLean = { ...a.statistics };
      delete statsLean.history; // sparkline series — re-supplied by the live poll, not needed in HTML
      return { ...a, statistics: statsLean };
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
  return fetchParkByGeoPath(continent, country, city, parkSlug, false);
}

/**
 * Live (no-store) variant of {@link getParkByGeoPath} for the client poll path.
 *
 * The `/api/parks/...` proxy (polled by LiveParkData / LiveAttractionData every 5 min) used to call
 * the cached `getParkByGeoPath`, so the "live" wait times were actually up to PARK_MAX_AGE stale.
 * This variant skips our cache so the poll reflects the backend's latest snapshot (the upstream
 * Redis/Cloudflare 5-min cache still collapses concurrent calls). Decoupling the poll from the shell
 * cache is what lets the shell TTL go to 6h without freezing the live data.
 */
export async function getParkByGeoPathFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWithAttractions | null> {
  return fetchParkByGeoPath(continent, country, city, parkSlug, true);
}

async function fetchParkByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  fresh: boolean
): Promise<ParkWithAttractions | null> {
  try {
    const park = await api.get<ParkWithAttractions>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}`,
      fresh ? { cache: 'no-store' } : undefined
    );
    // The ISR shell gets the aggressive trim (drops statistics.history — the biggest size-weighted
    // ISR-write chunk); the live no-store poll keeps the full per-attraction data for the cards.
    return fresh ? leanParkForLive(park) : leanParkForShell(park);
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
 * Live (no-store) variant of {@link getAttractionByGeoPath} for the client detail fetch.
 *
 * The attraction page's static shell used to BLOCK on the cached `getAttractionByGeoPath`, baking
 * the heavy `history` + `hourlyForecast` time-series into every per-attraction × per-locale ISR
 * shell — by far the dominant ISR-write source. The daily chart, history grid and prediction-
 * accuracy card now fetch this client-side via the CDN-cached `/api/parks/.../attractions/<slug>`
 * route, so the shell carries only the lean park-embedded attraction (name / statistics /
 * bestVisitTimes) + JSON-LD. This fresh variant skips our own cache so that route reflects the
 * backend's latest snapshot (the upstream Redis/CDN still collapses concurrent calls), and — most
 * importantly — keeps the slow detail fetch off the shell prerender entirely (no ISR write for it).
 */
export async function getAttractionByGeoPathFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attractionSlug: string
): Promise<AttractionResponse | null> {
  try {
    return await api.get<AttractionResponse>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
      { cache: 'no-store' }
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
