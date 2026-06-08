import { api, ApiError } from './client';
import type { ParkWithAttractions, AttractionResponse, PopularPark } from './types';

// Data-cache (`fetch` `next: { revalidate }`) windows for the park/attraction structure fetch.
// The park & attraction PAGES are `force-dynamic` (rendered per request → no per-URL ISR shell
// writes — see their page.tsx). These cached fetches only shield the backend: the structure
// (name, attraction list, FAQ, summary stats) is shared across all 6 locales of a park and revalidated
// once per window via stale-while-revalidate. Every live value (status, wait times, weather, history,
// forecast) is CLIENT-derived (React Query no-store polls via getParkByGeoPathFresh), so a day-old
// structure snapshot never shows stale live data to a JS visitor. 1 day keeps new rides appearing in
// the SSR/SEO HTML within ~24h while keeping data-cache writes negligible (shared per park).
const PARK_REVALIDATE = 86400; // 1d — structure snapshot; live data is client-side
const ATTRACTION_REVALIDATE = 86400; // 1d

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
 * Get parks by geographic path. Cached in the Vercel Data Cache via `fetch` `next: { revalidate }`
 * (stale-while-revalidate, 1-day window): the per-request `force-dynamic` park/attraction render
 * reads this shared snapshot (keyed by the backend URL — NOT the locale, so all 6 locales of a park
 * share one entry) so the backend isn't hit on every render; live wait times are refreshed
 * client-side by LiveParkData.
 *
 * Returns `null` for a non-existent park (API 404). The 404 is caught inside `fetchParkByGeoPath`
 * (returns `null`) so the caller can render `notFound()`; other errors (maintenance/network) propagate.
 */
export function getParkByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWithAttractions | null> {
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
      fresh ? { cache: 'no-store' } : { next: { revalidate: PARK_REVALIDATE, tags: ['parks'] } }
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
 * Cached in the Vercel Data Cache via `fetch` `next: { revalidate }`; live wait times are refreshed
 * client-side.
 *
 * Returns `null` on a 404 so the caller can render `notFound()`.
 */
export async function getAttractionByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attractionSlug: string
): Promise<AttractionResponse | null> {
  try {
    return await api.get<AttractionResponse>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
      { next: { revalidate: ATTRACTION_REVALIDATE, tags: ['attractions'] } }
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
export function getPopularParks(limit = 20): Promise<PopularPark[]> {
  return api.get<PopularPark[]>('/v1/parks/popular', {
    params: { limit },
    next: { revalidate: 1800, tags: ['popular-parks'] },
  });
}
