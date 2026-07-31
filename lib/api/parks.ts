import { api, ApiError } from './client';
import type {
  ParkWithAttractions,
  ParkAttraction,
  AttractionResponse,
  ParkWaitTimesResponse,
  PopularPark,
} from './types';

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
 * Trim for the ATTRACTION page's `initialPark` prop — the React Query seed for
 * `useLiveAttractionData`, serialized into the HTML of every attraction page.
 *
 * The page already narrows `attractions` to the one ride being shown, but it still spread the
 * whole park around it. Measured on `/de/…/phantasialand/taron`, that prop was 36.3 KB, of which
 * the page reads 1.9 KB:
 *
 *     schedule [17]     18.43 KB      attractions [1]    1.91 KB  ← the only part anything reads
 *     restaurants [46]   9.54 KB      shows [4]          1.21 KB
 *     weather            3.78 KB      analytics          0.55 KB
 *
 * Its only consumer, `LiveAttractionData`, reads exactly `park.status`, `park.timezone` and
 * `park.attractions`; nothing else on the page subscribes to that query (`ParkTimeInfo`, which
 * does read `schedule`/`nextSchedule`, is not mounted here). So the park-level blocks below are
 * dropped — 46 restaurants and 17 opening days have no business in the HTML of a single ride.
 *
 * They are NOT lost: the 5-minute live poll (`getParkByGeoPathFresh` via the /api/parks proxy)
 * returns the full park and fills the shared query cache, exactly as it already does for the
 * sibling attractions this prop has always omitted.
 */
/**
 * Trim for the PARK page's serialized park snapshot.
 *
 * Two per-attraction fields exist only for the ride page and are dead weight when multiplied by
 * a park's whole attraction list. Measured on Phantasialand (40 attractions, 33.1 KB):
 *
 *     typicalWaits  7.73 KB — the park page never renders it. `AttractionTypicalWaits` is mounted
 *                             by the ride page (from `attraction.typicalWaits`) and by
 *                             `attraction-history-sections` (from the client-fetched `detail`).
 *     rideProfile   3.61 KB — the ride ↔ glossary link. Rendered only by `RideProfileTeaser` /
 *                             `RideProfileSection` on the ride page; `attraction-card.tsx` has
 *                             no reference to it at all.
 *
 * The ride page keeps both: it narrows the list to its one attraction first
 * ({@link leanParkForAttractionShell}), where the pair costs ~1 KB rather than ~11 KB.
 */
export function leanParkForParkShell(park: ParkWithAttractions): ParkWithAttractions {
  return {
    ...park,
    attractions: park.attractions.map((a) => {
      const lean = { ...a };
      delete lean.typicalWaits;
      delete lean.rideProfile;
      return lean;
    }),
  };
}

export function leanParkForAttractionShell(
  park: ParkWithAttractions,
  attraction: ParkAttraction
): ParkWithAttractions {
  const lean: ParkWithAttractions = { ...park, attractions: [attraction] };
  delete lean.schedule;
  delete lean.restaurants;
  delete lean.weather;
  delete lean.shows;
  delete lean.analytics;
  delete lean.ropeDropHeadliners;
  return lean;
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
 * Live (no-store) lean wait-times snapshot for a whole park — park status + every attraction's
 * queues, ~9 KB where the full park payload is ~95 KB.
 *
 * Exists for surfaces that reference a handful of rides but must NOT pull a park-page-sized
 * payload per park to keep them live — today the blog's inline ride references, which are
 * baked into a statically generated post and would otherwise show the build-time snapshot
 * forever (every ride reading "closed" long after the park reopened).
 */
export async function getParkWaitTimesFresh(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWaitTimesResponse | null> {
  try {
    return await api.get<ParkWaitTimesResponse>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/wait-times`,
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
