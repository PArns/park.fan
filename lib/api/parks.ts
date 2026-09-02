import { cache } from 'react';

import { api, ApiError } from './client';
import { parkCacheTag } from './park-live-projection';
import { withAttractionCoordinates, withParkCoordinates } from './coordinates';
import type {
  ParkSeason,
  ParkWithAttractions,
  ParkAttraction,
  AttractionResponse,
  ParkWaitTimesResponse,
  PopularPark,
  ScheduleItem,
  InfluencingHoliday,
} from './types';

/**
 * The live poll's projection and its merge live in their own module — they are pure functions over
 * the park shape, and this one reaches the network. Re-exported here because every call site knows
 * them as `@/lib/api/parks`, and because `parkCacheTag` is used by the fetch below.
 */
export {
  parkCacheTag,
  leanParkForLivePoll,
  mergeLiveParkSnapshot,
  leanParkForCalendarShell,
} from './park-live-projection';
export type {
  LiveAttractionSnapshot,
  LiveRestaurantSnapshot,
  LiveParkSnapshot,
} from './park-live-projection';

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
      // `comparison` and `baseline` ride in on every attraction and nothing in this app has ever
      // rendered them — `ComparisonBadge` exists but is wired to nothing outside `/ui`, where it
      // is fed string literals. {@link leanParkForLivePoll} already leaves them out of the poll,
      // and that rule was written down without ever being applied to the half that reaches a
      // reader: the SERVER render, which is the copy that lands in the HTML of every park page.
      // 1.0 KB per park page, on the route with the second-highest origin-miss count in the app.
      const lean = { ...a } as ParkAttraction & { comparison?: unknown; baseline?: unknown };
      delete lean.comparison;
      delete lean.baseline;
      if (!lean.statistics) return lean;
      const statsLean = { ...lean.statistics };
      delete statsLean.history; // sparkline series — re-supplied by the live poll, not needed in HTML
      return { ...lean, statistics: statsLean };
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
 * A park's named seasons and events, for the public page.
 *
 * Its own request rather than a field on the park, and the backend says why:
 * the park payload is re-polled every five minutes for as long as a tab is
 * open, while a season changes a handful of times a year. Day-stable, so it
 * gets the same one-day cache window the park shell has and is never part of
 * the live poll's budget.
 *
 * Returns an empty list for a park with none on file, which today is most of
 * them — the caller renders nothing rather than an empty heading.
 */
export async function getParkSeasons(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkSeason[]> {
  try {
    const result = await api.get<{ seasons: ParkSeason[] }>(
      `/v1/parks/${continent}/${country}/${city}/${parkSlug}/seasons`,
      { next: { revalidate: PARK_REVALIDATE, tags: ['parks'] } }
    );
    return result.seasons ?? [];
  } catch {
    // A park page must not fail over a section that most parks do not have.
    return [];
  }
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
 *
 * Wrapped in React `cache()` because the Data Cache only dedupes the NETWORK. Every one of the
 * three hot routes calls this twice per request — once in `generateMetadata` for a `<title>`, once
 * in the page body — and Next's fetch dedupe hands each call site its own `Response` clone. So
 * `response.json()`, `withParkCoordinates()` and `leanParkForShell()`'s three full passes over
 * `attractions`/`shows`/`restaurants` all ran a second time to produce a string. Measured against
 * the live API: 62 kB of JSON and 40 attractions for Phantasialand, 113 kB and 96 for Europa-Park,
 * parsed and mapped twice on the two routes that are 74 % of production traffic. `cache()` is
 * per-request, so it changes nothing about how long a park stays cached across requests — that is
 * still PARK_REVALIDATE.
 */
export const getParkByGeoPath = cache(
  (
    continent: string,
    country: string,
    city: string,
    parkSlug: string
  ): Promise<ParkWithAttractions | null> =>
    fetchParkByGeoPath(continent, country, city, parkSlug, false)
);

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
        fresh
          ? { cache: 'no-store' }
          : {
              next: {
                revalidate: PARK_REVALIDATE,
                tags: ['parks', parkCacheTag(continent, country, city, parkSlug)],
              },
            }
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
