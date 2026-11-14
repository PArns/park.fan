import { tripRegionConfig } from './registry';

/**
 * What the trip-region relay (`app/api/trip-regions/[...path]/route.ts`) may ask the API for, kept
 * apart from the route so its rules can be tested without a server. The API answers an unknown
 * query parameter with a 400, so the relay forwards each route's own names and nothing else.
 */

/** The query names each relayed route takes, exactly as the API spells them. */
const RELAY_QUERY: Record<string, readonly string[]> = {
  '': [],
  calendar: ['from', 'to'],
  'best-days': ['from', 'to', 'limit'],
  plan: [
    'from',
    'to',
    'parks',
    'hotel',
    'area',
    'arrival',
    'departure',
    'blocks',
    'parties',
    'fireworks',
    'rest',
    'hop',
    'ticket',
    'hopper',
    'tickets',
    'evenings',
    'split',
    'lock',
  ],
  'school-breaks': ['from', 'to', 'countries'],
  when: [
    'from',
    'to',
    'days',
    'parks',
    'hotel',
    'area',
    'arrival',
    'departure',
    'blocks',
    'fireworks',
    'rest',
    'hop',
    'ticket',
    'hopper',
    'tickets',
    'evenings',
    'split',
    'within',
    'limit',
    'gap',
  ],
};

/**
 * A value the relay passes on: dates, slugs with `:n`, pins with `@`, `max:3`, tickets with `.4.h?`.
 * Anything else is a 400 here, before a percent-decoded character can reach the upstream URL. A
 * `within` code is a region code such as `DE-NW` or `NL-GR`, which the same characters cover.
 */
const RELAY_VALUE = /^[a-z0-9_:,@.?-]{1,1000}$/i;

/**
 * The region the open route is cached a day for, the API's own window, and an hour for the keyed
 * ones, which the API keeps an hour in Redis. Repeated in `next.config.ts`, where the two must
 * agree.
 */
export const TRIP_REGION_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';
/** The keyed routes' window at the edge and in the browser: the API's hour. */
export const TRIP_REGION_DATA_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

/** One request the relay will make upstream. */
export interface TripRegionRelayTarget {
  /** `''` for the region itself, else the keyed route. */
  route: '' | 'calendar' | 'best-days' | 'plan' | 'when' | 'school-breaks';
  /** The region's slug, which is also its Data Cache tag's. */
  region: string;
  /** The API path with its filtered query, `/v1/trip-regions/orlando/plan?from=…`. */
  apiPath: string;
  /** Whether the answer carries forecasts, so only this site's own pages may ask. */
  forecast: boolean;
  cacheControl: string;
}

/**
 * The upstream request for a relay path and query, or `null` when the relay answers 400: a region
 * the registry does not list, an unknown route, a parameter the route does not take or a value
 * that is not one. A region that is not live yet passes: the admin's ticket page reads its parks
 * before its pages exist, and the keyed routes answer this site's own pages alone anyway.
 */
export function tripRegionRelayTarget(
  path: readonly string[],
  search: URLSearchParams
): TripRegionRelayTarget | null {
  if (path.length < 1 || path.length > 2) return null;
  const region = tripRegionConfig(path[0])?.slug;
  if (!region) return null;
  const route = (path[1] ?? '') as TripRegionRelayTarget['route'];
  const allowed = RELAY_QUERY[route];
  if (!allowed) return null;

  const query = new URLSearchParams();
  for (const [key, value] of search) {
    if (!allowed.includes(key) || !RELAY_VALUE.test(value) || query.has(key)) return null;
    query.set(key, value);
  }
  const qs = query.toString();
  return {
    route,
    region,
    apiPath: `/v1/trip-regions/${region}${route ? `/${route}` : ''}${qs ? `?${qs}` : ''}`,
    // The region and the school breaks carry no forecast: open routes, cached a day like the API's.
    forecast: route !== '' && route !== 'school-breaks',
    cacheControl:
      route && route !== 'school-breaks'
        ? TRIP_REGION_DATA_CACHE_CONTROL
        : TRIP_REGION_CACHE_CONTROL,
  };
}
