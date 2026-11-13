import 'server-only';

import { catchNonFatal, getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import { tripRegionLinks, type TripRegionLinks } from './trip-links';
import {
  ORLANDO_REGION,
  type TripBestDays,
  type TripCalendar,
  type TripRegion,
  type TripTicketCatalog,
  type TripWhen,
  type TripSchoolBreaks,
} from './types';

/**
 * The Orlando hub's server reads of the trip-region routes. SERVER ONLY: the keyed routes leave
 * the API only with the site's data key (docs/rules/a-forecast-leaves-only-with-a-key.md), and a
 * browser asks them through the relay instead (`orlandoRelayUrl`, `lib/orlando/paths.ts`).
 *
 * Every read goes through Next's Data Cache with the region's tag (the ticket catalog with its own),
 * so the many URLs of the hub and its months cost one upstream call per window an hour, and
 * `revalidateTag` can drop them all.
 * A failed read throws; the page decides what an absent answer means.
 */

/** The Data Cache tag on every trip-region read, for the API's revalidation webhook. */
export const TRIP_REGION_CACHE_TAG = `trip-region:${ORLANDO_REGION}`;

/** The query of a keyed read: a window, region-local. */
export interface TripWindow {
  from?: string;
  to?: string;
}

async function readTripRegion<T>(
  path: string,
  revalidate: number,
  query: Record<string, string | undefined> = {},
  tags: string[] = [TRIP_REGION_CACHE_TAG]
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const url = `${getApiBaseUrl()}/v1/trip-regions/${ORLANDO_REGION}${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    next: { revalidate, tags },
    headers: { 'Content-Type': 'application/json', ...getServerApiHeaders() },
  });
  if (!response.ok) {
    throw new Error(`Trip region ${path || '/'} ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** The Data Cache tag of the ticket catalog, which the API revalidates after every admin edit. */
export const TRIP_TICKETS_CACHE_TAG = `trip-tickets:${ORLANDO_REGION}`;

/**
 * The ticket catalog as the admin keeps it (`/tickets`): open, five minutes at the edge, and
 * revalidated by tag on every edit. The region route's own `tickets` is the fallback while this
 * route is missing or failing.
 */
export function getOrlandoTickets(): Promise<TripTicketCatalog> {
  return readTripRegion<TripTicketCatalog>('/tickets', CACHE_TTL.tripTickets, {}, [
    TRIP_TICKETS_CACHE_TAG,
  ]);
}

/** The region: its parks, groups, hotel areas and travel legs. Open, curated in code. */
export function getOrlandoRegion(): Promise<TripRegion> {
  return readTripRegion<TripRegion>('', CACHE_TTL.tripRegion);
}

/**
 * How long a page waits for the region before it leaves its links into the planner out: the read
 * is a day in the Data Cache, so only a cold cache after a deploy takes longer.
 */
const TRIP_LINKS_TIMEOUT_MS = 1500;

/**
 * The trip regions a page can link into, for the bands on park, calendar, city, country and post
 * pages and `/search`. Empty while the region read fails or takes longer than
 * {@link TRIP_LINKS_TIMEOUT_MS}, so a slow API costs the page its band and nothing else.
 */
export async function getTripRegionLinks(): Promise<TripRegionLinks[]> {
  const region = await withSeedTimeout(catchNonFatal(getOrlandoRegion()), TRIP_LINKS_TIMEOUT_MS);
  const links = region ? tripRegionLinks(region) : null;
  return links ? [links] : [];
}

/**
 * The best trip windows of a length in a range, planned for the headliner parks unless `parks`
 * says otherwise (`/when`). The API keeps an answer six hours by its query; the hub asks one per
 * range, so the Data Cache holds it the API's hour like the other keyed reads.
 */
export function getOrlandoWhen(
  query: TripWindow & { days?: number; limit?: number; gap?: number; parks?: string } = {}
): Promise<TripWhen> {
  const { days, limit, gap, ...rest } = query;
  return readTripRegion<TripWhen>('/when', CACHE_TTL.tripRegionData, {
    ...rest,
    days: days === undefined ? undefined : String(days),
    limit: limit === undefined ? undefined : String(limit),
    gap: gap === undefined ? undefined : String(gap),
  });
}

/** Every park's days side by side, with the seasons that run on them; at most 92 days. */
export function getOrlandoCalendar(window: TripWindow = {}): Promise<TripCalendar> {
  return readTripRegion<TripCalendar>('/calendar', CACHE_TTL.tripRegionData, { ...window });
}

/** Each park's quiet and busy days in a window, as sets, and each resort's best dates. */
export function getOrlandoBestDays(
  window: TripWindow & { limit?: number } = {}
): Promise<TripBestDays> {
  const { limit, ...range } = window;
  return readTripRegion<TripBestDays>('/best-days', CACHE_TTL.tripRegionData, {
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
export async function getOrlandoSchoolBreaks(query: {
  from: string;
  to: string;
  countries: readonly string[];
}): Promise<TripSchoolBreaks> {
  const params = new URLSearchParams({
    from: query.from,
    to: query.to,
    countries: query.countries.join(','),
  });
  const { 'X-API-Key': _dataKey, ...headers } = getServerApiHeaders();
  void _dataKey;
  const url = `${getApiBaseUrl()}/v1/trip-regions/${ORLANDO_REGION}/school-breaks?${params}`;
  const response = await fetch(url, {
    next: { revalidate: SCHOOL_BREAKS_REVALIDATE, tags: [TRIP_REGION_CACHE_TAG] },
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!response.ok) {
    throw new Error(`Trip region /school-breaks ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as TripSchoolBreaks;
}
