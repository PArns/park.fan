import { api, ApiError } from './client';
import { withAttractionCoordinates, withParkCoordinates } from './coordinates';
import type {
  ParkWithAttractions,
  ParkAttraction,
  AttractionResponse,
  ParkWaitTimesResponse,
  PopularPark,
  ScheduleItem,
  InfluencingHoliday,
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
 * Number of leading schedule days that keep their `influencingHolidays`.
 *
 * Only ONE day's neighbouring-region list is ever rendered — `useTodaySchedule` picks today's
 * entry (browser clock, park timezone) and `HeaderHolidayPanel` / `ParkTimeInfo` read it from
 * there. The API sends the list for all 17 days, which on a summer weekend is 8.4 KB of the
 * park payload's 13.5 KB schedule, repeated in every 5-minute poll.
 *
 * Three, not one: `useTodaySchedule` seeds with `schedule[0]` before mount (no clock yet), and a
 * park east of the fetch's date line is already on tomorrow's entry. Three leading days cover the
 * seed, today and tomorrow whatever the timezone, and still drop ~80% of the block.
 *
 * Counted by index rather than by date on purpose — deriving "today" here would read the server
 * clock in the shell path, which this page deliberately never does (the whole schedule is handed
 * to the client and "today" is picked from the browser clock in the park's timezone). That makes
 * this depend on the API's contract that the window STARTS at today; verified across parks in
 * Europe, North America and Asia. If that ever changes, the visible effect is the header's
 * neighbouring-holidays panel going blank — not a wrong date on screen.
 */
const SCHEDULE_HOLIDAY_CONTEXT_DAYS = 3;

function leanScheduleHolidayContext(park: ParkWithAttractions): ParkWithAttractions {
  if (!Array.isArray(park.schedule)) return park;
  return {
    ...park,
    schedule: park.schedule.map((day, i) => {
      if (i < SCHEDULE_HOLIDAY_CONTEXT_DAYS || !day.influencingHolidays) return day;
      const lean = { ...day };
      delete lean.influencingHolidays;
      return lean;
    }),
  };
}

/**
 * Trim for the LIVE (no-store) client poll: drop only attraction-detail-only fields the park/
 * attraction cards never use — the raw `url` (the card's `getHref` falls back to `${parkPath}/${slug}`,
 * the identical frontend URL) and the detail-only `history`/`hourlyForecast`/`predictionAccuracy`.
 * KEEPS `statistics` (incl. the card sparkline `history`), `bestVisitTimes` and `queues` — the cards
 * render those live. This response is served `no-store` (see the /api/parks proxy), so its size
 * carries NO ISR-write cost.
 *
 * Also drops the far-future days' `influencingHolidays` — see {@link SCHEDULE_HOLIDAY_CONTEXT_DAYS}.
 */
function leanParkForLive(park: ParkWithAttractions): ParkWithAttractions {
  const trimmed = leanScheduleHolidayContext(park);
  return {
    ...trimmed,
    attractions: trimmed.attractions.map((a) => {
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
 * The park poll's response: only what can change between two polls.
 *
 * `useLiveParkData` re-downloads the park every 5 minutes for as long as a tab is open, and it
 * used to fetch the whole thing — 90 KB on Phantasialand, of which ~50 KB cannot move within five
 * minutes and is already sitting in the page the visitor is looking at:
 *
 *     attractions[] static  27.6 KB   restaurants[46]   9.7 KB
 *     schedule[17]           5.6 KB   shows[4]          1.3 KB
 *
 * So the poll answers with this projection instead and `mergeLiveParkSnapshot` lays it back over
 * the server-rendered park, which gives every consumer the same complete `ParkWithAttractions`
 * they had before. Identity fields (id/name/slug/land) ride along deliberately: they cost 4 KB and
 * they are what lets the poll still surface a ride that opened since the page was rendered,
 * instead of the merge silently dropping it.
 *
 * A field belongs here only if a five-minute-old value would be WRONG on screen. Ride photos are
 * the odd one out — `backgroundImage`/`backgroundPosition` are attached by the /api/parks proxy
 * (the media catalog can't cross into a Client Component), and the park page's cards genuinely
 * have no photo until this response lands.
 */
export interface LiveAttractionSnapshot {
  id: string;
  name: string;
  slug: string;
  land: string | null;
  status?: ParkAttraction['status'];
  /** Not on `ParkAttraction`; `attraction-card` reads it via an `in` check. */
  effectiveStatus?: ParkAttraction['status'];
  crowdLevel?: ParkAttraction['crowdLevel'];
  trend?: ParkAttraction['trend'];
  queues?: ParkAttraction['queues'];
  statistics?: ParkAttraction['statistics'];
  bestVisitTimes?: ParkAttraction['bestVisitTimes'];
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

export interface LiveParkSnapshot {
  status?: ParkWithAttractions['status'];
  timezone?: string;
  hasOperatingSchedule?: boolean;
  currentLoad?: ParkWithAttractions['currentLoad'];
  analytics?: ParkWithAttractions['analytics'];
  weather?: ParkWithAttractions['weather'];
  nextSchedule?: ParkWithAttractions['nextSchedule'];
  attractions: LiveAttractionSnapshot[];
}

/**
 * Project a park down to {@link LiveParkSnapshot}.
 *
 * Note what is NOT here. `schedule` looks live but every consumer already receives it as a prop
 * from the (per-request, force-dynamic) server render and falls back to that prop — the poll
 * copy was never the one on screen. `ropeDrop`/`typicalWaits`/`rideProfile` are derived from
 * months of history and move once a day at most. `comparison` and `baseline` come down from the
 * API on every attraction and nothing in the app has ever rendered them.
 */
export function leanParkForLivePoll(park: ParkWithAttractions): LiveParkSnapshot {
  return {
    status: park.status,
    timezone: park.timezone,
    hasOperatingSchedule: park.hasOperatingSchedule,
    currentLoad: park.currentLoad,
    analytics: park.analytics,
    weather: park.weather,
    nextSchedule: park.nextSchedule,
    attractions: (park.attractions ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      land: a.land,
      status: a.status,
      effectiveStatus: (a as { effectiveStatus?: ParkAttraction['status'] }).effectiveStatus,
      crowdLevel: a.crowdLevel,
      trend: a.trend,
      queues: a.queues,
      statistics: a.statistics,
      bestVisitTimes: a.bestVisitTimes,
    })),
  };
}

/**
 * Lay a {@link LiveParkSnapshot} back over the server-rendered park.
 *
 * Attraction order and membership come from the SNAPSHOT (so a ride that opened, closed or was
 * renamed upstream still appears/disappears within one poll, exactly as when the poll returned
 * the whole park); the static fields for each one come from `base`. A ride the snapshot has and
 * `base` doesn't renders from the snapshot alone — it has name, slug, land and a photo, which is
 * everything the card needs.
 *
 * Tolerant on purpose: with no `base` it returns the snapshot as-is (consumers that subscribe
 * without an `initialData` seed read only park-level live fields and carry their own props for
 * the rest), and passing a full park as the snapshot is a no-op, which is what makes it safe to
 * run over React Query's `initialData` before the first poll lands.
 */
export function mergeLiveParkSnapshot(
  base: ParkWithAttractions | undefined,
  live: LiveParkSnapshot
): ParkWithAttractions {
  if (!base) return live as unknown as ParkWithAttractions;
  // React Query seeds the cache with the full park, so the first `select` runs base over itself.
  // Returning it untouched keeps the attraction array's identity, which is what `LiveParkData`
  // compares to decide whether to re-group the grid by land.
  if ((live as unknown) === base) return base;
  if (!Array.isArray(live.attractions)) return { ...base, ...live, attractions: base.attractions };

  const staticById = new Map(base.attractions.map((a) => [a.id, a]));
  return {
    ...base,
    ...live,
    attractions: live.attractions.map(
      (a) => ({ ...staticById.get(a.id), ...a }) as unknown as ParkAttraction
    ),
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
    // This endpoint sends its coordinates as decimal STRINGS while the type says
    // `number | null`; `withParkCoordinates` is where that stops (see ./coordinates).
    const park = withParkCoordinates(
      await api.get<ParkWithAttractions>(
        `/v1/parks/${continent}/${country}/${city}/${parkSlug}`,
        fresh ? { cache: 'no-store' } : { next: { revalidate: PARK_REVALIDATE, tags: ['parks'] } }
      )
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
 * Trim for the ATTRACTION DETAIL response — the payload the ride page fetches client-side.
 *
 * Everything this touches is the park's 31-day schedule, which rides on the response so the chart
 * can find today's opening hours. `AttractionHistoryGrid` draws the rest of it: each day's border
 * and corner icons come from the holiday flags, `scheduleType` tells "ride was closed" apart from
 * "park was closed", and the amber marker from `influencingHolidays` — the neighbouring regions on
 * school break that day, the same signal the park calendar carries.
 *
 * That region list is the reason this projection exists. Raw it is 25.6 KB of a 57.3 KB response,
 * which reads like the one block worth cutting. It is not: the entries repeat heavily (267 across
 * the window, only 147 distinct), so gzip takes the whole thing to 0.4 KB. Judge this block on the
 * compressed number or the trim optimizes something the visitor never pays for.
 *
 * What is worth removing is the repetition itself, because `JSON.parse` runs on the main thread
 * and pays the RAW size. So each day's list is deduplicated by country+region and stripped to the
 * `source` pair the labels are derived from — `name` and `holidayType` are never rendered here,
 * the grid resolves its own localized names through `getRegionLabel`. 25.6 KB becomes 14.6 KB raw
 * and 0.2 KB gzip over dropping it outright.
 *
 * Listing the kept fields rather than deleting the unwanted ones is deliberate: a new per-day
 * array on the API cannot silently land in this payload. Everything else in the response —
 * history, hourlyForecast, typicalWaits, rideProfile, predictionAccuracy — is untouched.
 */
function leanAttractionForDetail(attraction: AttractionResponse): AttractionResponse {
  if (!Array.isArray(attraction.schedule)) return attraction;
  return {
    ...attraction,
    schedule: attraction.schedule.map((day) => {
      // The API sends one entry per holiday per region, so a region whose break spans several
      // named holidays arrives two or three times over. The grid renders each region once.
      const seen = new Set<string>();
      const influencing: InfluencingHoliday[] = [];
      for (const h of day.influencingHolidays ?? []) {
        const key = `${h.source.countryCode}-${h.source.regionCode ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        influencing.push({
          source: { countryCode: h.source.countryCode, regionCode: h.source.regionCode },
        } as InfluencingHoliday);
      }
      return {
        date: day.date,
        scheduleType: day.scheduleType,
        openingTime: day.openingTime,
        closingTime: day.closingTime,
        // Marker flags for the history grid's day borders/icons. `isSchoolHoliday` and
        // `isSchoolVacation` are the same marker under two names — the API has sent either
        // depending on the park, and the grid checks both.
        isPublicHoliday: day.isPublicHoliday,
        isSchoolHoliday: day.isSchoolHoliday,
        isSchoolVacation: day.isSchoolVacation,
        isBridgeDay: day.isBridgeDay,
        holidayName: day.holidayName,
        ...(influencing.length > 0 && { influencingHolidays: influencing }),
      } as ScheduleItem;
    }),
  };
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
    const attraction = withAttractionCoordinates(
      await api.get<AttractionResponse>(
        `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
        { next: { revalidate: ATTRACTION_REVALIDATE, tags: ['attractions'] } }
      )
    );
    return leanAttractionForDetail(attraction);
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
    const attraction = withAttractionCoordinates(
      await api.get<AttractionResponse>(
        `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
        { cache: 'no-store' }
      )
    );
    return leanAttractionForDetail(attraction);
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
