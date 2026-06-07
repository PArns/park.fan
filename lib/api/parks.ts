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
// Both shells now revalidate every 1 DAY. The only thing that previously pinned them below this was
// a server-time read in their static render — getServerToday('hours') in DailyWaitTimeChartServer
// (the #1 ISR-write driver) and getServerNowMs in the park page/FAQ/history grid. All of that
// "today/now"-dependent content (the daily chart's "today" marker, today's opening-hours, the
// crowd FAQ, the history grid's "today") is now CLIENT-derived (useBrowserNow/useMounted) or made
// time-INDEPENDENT, so the shells carry only day-stable structure. Live wait times/status come from
// the client poll via getParkByGeoPathFresh (no-store), so a stale shell never shows stale live
// data. A 1-day TTL collapses the per-park/per-attraction × per-locale ISR-write volume ~4× vs 6h
// (and ~24× vs the original hourly park floor).
const PARK_MAX_AGE = 86400; // 1d park shell TTL — all "today/now" content is client-derived
const ATTRACTION_MAX_AGE = 86400; // 1d attraction shell TTL — dominant route, "today" client-derived

/**
 * Drop per-attraction fields the PARK page never renders before the snapshot is cached.
 *
 * Measured against the live europa-park response (96 attractions, ~134 KB): the body is dominated
 * by `statistics` (incl. the card sparkline `history`), `bestVisitTimes` and `queues` — all of which
 * the park cards DO render, so they stay. The clearly removable field is `url` (~7 KB / ~5 %): it is
 * the raw `/v1/parks/.../attractions/<slug>` API path, and the card's `getHref` only uses it as a
 * preference — it falls back to `${parkPath}/${slug}` (parkPath is always supplied on the park page),
 * which resolves to the identical frontend URL. The `history`/`hourlyForecast`/`predictionAccuracy`
 * deletes are defensive: the park endpoint does not currently send them per attraction, but if it
 * ever does they are attraction-detail-only (sourced from getAttractionByGeoPath) and must not bloat
 * the park snapshot. Because the snapshot is persisted via `'use cache'` AND baked into every
 * per-locale ISR route segment via `initialData={park}`, trimming here shrinks the size-weighted ISR
 * write units (and the live /api/parks proxy response) on every park, across all 6 locales.
 */
function leanParkForShell(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: park.attractions.map((a) => {
      const lean = { ...a };
      delete lean.url; // href falls back to `${parkPath}/${slug}` — identical frontend URL
      delete lean.history; // defensive: attraction-detail-only if ever present
      delete lean.hourlyForecast; // defensive: detail-only
      delete lean.predictionAccuracy; // defensive: detail-only
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
