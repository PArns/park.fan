import 'server-only';

import { catchNonFatal, getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import { LIVE_TRIP_REGIONS } from './registry';
import { tripRegionLinks, type TripRegionLinks } from './trip-links';
import type {
  TripBestDays,
  TripCalendar,
  TripForecastAccuracy,
  TripRegion,
  TripTicketCatalog,
  TripWhen,
  TripSchoolBreaks,
} from './types';

/**
 * A region hub's server reads of the trip-region routes. SERVER ONLY: the keyed routes leave the
 * API only with the site's data key (docs/rules/a-forecast-leaves-only-with-a-key.md), and a
 * browser asks them through the relay instead (`tripRegionRelayUrl`, `lib/trip-regions/paths.ts`).
 *
 * Every read goes through Next's Data Cache with its region's tag (the ticket catalog with its
 * own), so the many URLs of a hub and its months cost one upstream call per window an hour, and
 * `revalidateTag` can drop one region's reads without touching another's.
 * A failed read throws; the page decides what an absent answer means.
 */

/** The Data Cache tag on every read of a region, for the API's revalidation webhook. */
export function tripRegionCacheTag(region: string): string {
  return `trip-region:${region}`;
}

/** The Data Cache tag of a region's ticket catalog, which the API revalidates after every edit. */
export function tripTicketsCacheTag(region: string): string {
  return `trip-tickets:${region}`;
}

/** The Data Cache tag of the list of regions (`GET /v1/trip-regions`). */
export const TRIP_REGIONS_CACHE_TAG = 'trip-regions';

/** The query of a keyed read: a window, region-local. */
export interface TripWindow {
  from?: string;
  to?: string;
}

async function readTripRegion<T>(
  region: string,
  path: string,
  revalidate: number,
  query: Record<string, string | undefined> = {},
  tags: string[] = [tripRegionCacheTag(region)]
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const url = `${getApiBaseUrl()}/v1/trip-regions/${encodeURIComponent(region)}${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    next: { revalidate, tags },
    headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
  });
  if (!response.ok) {
    throw new Error(
      `Trip region ${region}${path || '/'} ${response.status}: ${response.statusText}`
    );
  }
  return (await response.json()) as T;
}

/**
 * The ticket catalog as the admin keeps it (`/tickets`): open, five minutes at the edge, and
 * revalidated by tag on every edit. The region route's own `tickets` is the fallback while this
 * route is missing or failing.
 */
export function getTripRegionTickets(region: string): Promise<TripTicketCatalog> {
  return readTripRegion<TripTicketCatalog>(region, '/tickets', CACHE_TTL.tripTickets, {}, [
    tripTicketsCacheTag(region),
  ]);
}

/** The region: its parks, groups, hotel areas and travel legs. Open, curated in code. */
export function getTripRegion(region: string): Promise<TripRegion> {
  return readTripRegion<TripRegion>(region, '', CACHE_TTL.tripRegion);
}

/**
 * How long a page waits for the regions before it leaves its links into the planners out: each
 * read is a day in the Data Cache, so only a cold cache after a deploy takes longer.
 */
const TRIP_LINKS_TIMEOUT_MS = 1500;

/**
 * The live regions a page can link into, for the bands on park, calendar, city, country and post
 * pages and `/search`. A region whose read fails or takes longer than {@link TRIP_LINKS_TIMEOUT_MS}
 * is left out, so a slow API costs the page its band and nothing else.
 */
export async function getTripRegionLinks(): Promise<TripRegionLinks[]> {
  const regions = await Promise.all(
    LIVE_TRIP_REGIONS.map((config) =>
      withSeedTimeout(catchNonFatal(getTripRegion(config.slug)), TRIP_LINKS_TIMEOUT_MS)
    )
  );
  return regions.flatMap((region) => {
    const links = region ? tripRegionLinks(region) : null;
    return links ? [links] : [];
  });
}

/** One region of the API's list, as far as this site reads it. */
interface TripRegionListEntry {
  slug: string;
  parkCount?: number;
  maxTripDays?: number;
  parks?: unknown[];
}

/** What the navigation says of a region beside its name: from the API, each when it answers. */
export interface TripRegionNavFacts {
  /** How many parks the trip planner places. */
  parkCount?: number;
  /** The longest trip it plans, in days. */
  maxTripDays?: number;
}

/**
 * What the band says of each live region, by slug: the API's list of regions
 * (`GET /v1/trip-regions`), else for the park count each region route's park list, both a day in
 * the Data Cache. A fact neither answers in time is missing, and the band leaves it out or keeps
 * its own.
 */
export async function getTripRegionNavFacts(): Promise<Record<string, TripRegionNavFacts>> {
  // Both at once, so a cold cache waits one bound, not two; the region reads are the ones every
  // hub and band already keep a day.
  const [list, regions] = await Promise.all([
    withSeedTimeout(
      catchNonFatal(
        readTripRegionList().then((answer) =>
          Array.isArray(answer?.regions) ? answer.regions : null
        )
      ),
      TRIP_LINKS_TIMEOUT_MS
    ),
    Promise.all(
      LIVE_TRIP_REGIONS.map((config) =>
        withSeedTimeout(catchNonFatal(getTripRegion(config.slug)), TRIP_LINKS_TIMEOUT_MS)
      )
    ),
  ]);
  const facts: Record<string, TripRegionNavFacts> = {};
  for (const region of regions) if (region) facts[region.slug] = { parkCount: region.parks.length };
  for (const entry of list ?? []) {
    if (typeof entry.slug !== 'string') continue;
    const own = (facts[entry.slug] ??= {});
    const count = entry.parkCount ?? entry.parks?.length;
    if (typeof count === 'number') own.parkCount = count;
    if (typeof entry.maxTripDays === 'number' && entry.maxTripDays > 0) {
      own.maxTripDays = entry.maxTripDays;
    }
  }
  return facts;
}

/**
 * How long this process stops asking for the list after it failed. The Data Cache keeps only a
 * 200, and the layout asks on every page it renders, so an API without the route (or a failing
 * one) would otherwise cost every page render an upstream call.
 */
const LIST_RETRY_MS = 10 * 60 * 1000;
let listFailedAt = -Infinity;

async function readTripRegionList(): Promise<{ regions?: TripRegionListEntry[] }> {
  if (Date.now() - listFailedAt < LIST_RETRY_MS) throw new Error('Trip regions: failed recently');
  const response = await fetch(`${getApiBaseUrl()}/v1/trip-regions`, {
    next: { revalidate: CACHE_TTL.tripRegion, tags: [TRIP_REGIONS_CACHE_TAG] },
    headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
  }).catch((error: unknown) => {
    listFailedAt = Date.now();
    throw error;
  });
  if (!response.ok) {
    listFailedAt = Date.now();
    throw new Error(`Trip regions ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as { regions?: TripRegionListEntry[] };
}

/**
 * The best trip windows of a length in a range, planned for the headliner parks unless `parks`
 * says otherwise (`/when`). The API keeps an answer six hours by its query; the hub asks one per
 * range, so the Data Cache holds it the API's hour like the other keyed reads.
 */
export function getTripRegionWhen(
  region: string,
  query: TripWindow & { days?: number; limit?: number; gap?: number; parks?: string } = {}
): Promise<TripWhen> {
  const { days, limit, gap, ...rest } = query;
  return readTripRegion<TripWhen>(region, '/when', CACHE_TTL.tripRegionData, {
    ...rest,
    days: days === undefined ? undefined : String(days),
    limit: limit === undefined ? undefined : String(limit),
    gap: gap === undefined ? undefined : String(gap),
  });
}

/** Every park's days side by side, with the seasons that run on them; at most 92 days. */
export function getTripRegionCalendar(
  region: string,
  window: TripWindow = {}
): Promise<TripCalendar> {
  return readTripRegion<TripCalendar>(region, '/calendar', CACHE_TTL.tripRegionData, {
    ...window,
  });
}

/** Each park's quiet and busy days in a window, as sets, and each resort's best dates. */
export function getTripRegionBestDays(
  region: string,
  window: TripWindow & { limit?: number } = {}
): Promise<TripBestDays> {
  const { limit, ...range } = window;
  return readTripRegion<TripBestDays>(region, '/best-days', CACHE_TTL.tripRegionData, {
    ...range,
    limit: limit === undefined ? undefined : String(limit),
  });
}

/*
 * The open `/school-breaks` read, for the best-time pages. One block at the end, so the hub's
 * reads above merge without touching it.
 */

/** School calendars move once a year, and the API asks the edge for a day. */
const SCHOOL_BREAKS_REVALIDATE = 86400;

/**
 * The school-holiday regions the holiday data knows in `countries` (`DE,NL,GB`), each with its
 * breaks in the range and the day its data ends. Open: the data key stays home.
 */
export async function getTripRegionSchoolBreaks(
  region: string,
  query: { from: string; to: string; countries: readonly string[] }
): Promise<TripSchoolBreaks> {
  const params = new URLSearchParams({
    from: query.from,
    to: query.to,
    countries: query.countries.join(','),
  });
  const { 'X-API-Key': _dataKey, ...headers } = getServerApiHeaders();
  void _dataKey;
  const url = `${getApiBaseUrl()}/v1/trip-regions/${encodeURIComponent(region)}/school-breaks?${params}`;
  const response = await fetch(url, {
    next: { revalidate: SCHOOL_BREAKS_REVALIDATE, tags: [tripRegionCacheTag(region)] },
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!response.ok) {
    throw new Error(`Trip region /school-breaks ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as TripSchoolBreaks;
}

/**
 * How far the region's forecast was off lately (`/accuracy`), open like `/school-breaks`, an hour
 * in the Data Cache as the API asks the browser. `null` where the API has too few measured days to
 * say, or answers with a figure that is not one; a failed read throws like every read here.
 */
export async function getTripRegionAccuracy(region: string): Promise<TripForecastAccuracy | null> {
  const { 'X-API-Key': _dataKey, ...headers } = getServerApiHeaders();
  void _dataKey;
  const url = `${getApiBaseUrl()}/v1/trip-regions/${encodeURIComponent(region)}/accuracy`;
  const response = await fetch(url, {
    next: { revalidate: CACHE_TTL.tripRegionData, tags: [tripRegionCacheTag(region)] },
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!response.ok) {
    throw new Error(`Trip region /accuracy ${response.status}: ${response.statusText}`);
  }
  const answer = (await response.json()) as { forecastAccuracy?: TripForecastAccuracy | null };
  const figure = answer.forecastAccuracy;
  const counts = [figure?.days, figure?.leadDays, figure?.maeMinutes, figure?.parks];
  return figure && counts.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)
    ? figure
    : null;
}
