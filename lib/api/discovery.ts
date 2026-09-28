import { cache } from 'react';
import { api, apiFetch } from './client';
import { CACHE_TTL } from './cache-config';
import { stripUnreadableWaitStats } from '@/lib/utils/live-wait-times';
import type {
  GeoStructure,
  Continent,
  Country,
  DiscoveryCountryResponse,
  DiscoveryCityResponse,
  SitemapAttraction,
  CountrySummary,
  NearbyParkItem,
} from './types';

/**
 * Get complete geographic structure. Cached in the Vercel Data Cache (geo changes rarely);
 * used for static generation. `revalidate` keys the cache lifetime (e.g. the sitemap asks for 24h).
 *
 * Wrapped in React `cache()` for the same reason as {@link getContinents}: the Data Cache dedupes
 * the network but hands each call site its own `Response`, and the homepage alone has six (the
 * hero's world panel, the featured parks, the live-activity band and three story chapters), each
 * parsing the same 159 KB body. `revalidate` is part of the key, so a caller asking for the
 * sitemaps' one-day window gets its own entry. Callers must not mutate the result.
 */
export const getGeoStructure = cache((revalidate: number = CACHE_TTL.geo): Promise<GeoStructure> =>
  api.get<GeoStructure>('/v1/discovery/geo', { next: { revalidate, tags: ['geo'] } })
);

/**
 * Get all continents, with their countries, cities and parks.
 *
 * Wrapped in React `cache()` because the layout reads this on every page (`getGeoMenu()`) and the
 * park, ride, calendar and stats pages read it again for their breadcrumb (`cityHasOwnPage()`).
 * The Data Cache dedupes the network but hands each call site its own `Response`, so without this
 * the ~160 KB body would be parsed twice per render.
 *
 * Across requests, the parsed document is reused while the Data Cache answers with the same one —
 * see {@link readContinents}. So the result can be the same object for many requests at once, and
 * callers must not mutate it; none does.
 */
export const getContinents = cache((): Promise<Continent[]> =>
  apiFetch<Continent[]>(
    '/v1/discovery/continents',
    { method: 'GET', next: { revalidate: CACHE_TTL.continents, tags: ['geo'] } },
    readContinents
  )
);

/** The last continents document this process parsed, and the ETag it came with. */
let lastContinents: { etag: string | null; continents: Continent[] } | undefined;

/**
 * The continents body, parsed only when it is not the document parsed last time.
 *
 * The layout awaits this on every page, and every park, ride and calendar page is rendered per
 * request, so reading it was a per-request cost of the whole site: on a Data Cache hit Next hands
 * back a fresh `Response` over the cached bytes, and `.json()` on those 159 KB measured 1.5 ms,
 * for a header menu of 1.3 KB. The API sends a weak ETag computed from the body (Express's
 * `W/"<length>-<sha1>"`, checked against the body on 2026-09-28), and the Data Cache stores it
 * with the body, so an unchanged ETag is an unchanged document and its body is not read at all
 * (0.07 ms). Per request, menu plus the two lookups below, on a simulated hit: 2.0–2.3 ms of CPU
 * before, 0.19–0.29 ms after (three runs).
 *
 * Why the fetch still runs on every request instead of a memo in front of it: a fetch executed
 * during a prerender is what gives that page its `revalidate` and its `geo` tag
 * (`next/dist/server/lib/patch-fetch.js`), and on the blog and static pages this one is the only
 * fetch. Skipping it would take the window and the tag off every page rendered after the first
 * one in a process — which pages depends on render order — and `revalidateTag('geo')`, which the
 * backend sends on a park rename or merge, would stop reaching both those pages and this memo.
 * Keeping the fetch keeps both exactly as they were; only the parse is saved.
 *
 * Without an ETag it parses every time, which is what it did before.
 */
async function readContinents(response: Response): Promise<Continent[]> {
  const etag = response.headers.get('etag');
  if (etag && lastContinents?.etag === etag) {
    // Never read, so hand the stream back: on a Data Cache miss it is one branch of a tee.
    response.body?.cancel().catch(() => {});
    return lastContinents.continents;
  }
  const continents = (await response.json()) as Continent[];
  lastContinents = { etag, continents };
  return continents;
}

/**
 * {@link getContinents} for the header menu and the redirect and breadcrumb lookups: when the
 * fetch fails and this process has parsed the document before, that document instead of a throw.
 * Those callers used to fall back to an empty menu or an empty index, which is worse than a
 * week-old one. Pages that render the continents themselves keep the throw.
 */
export async function getContinentsOrLastGood(): Promise<Continent[]> {
  try {
    return await getContinents();
  } catch (error) {
    if (lastContinents) return lastContinents.continents;
    throw error;
  }
}

/**
 * Something derived from the continents document, computed once per document rather than once
 * per request. Keyed by the document object, which {@link readContinents} keeps the same while
 * the document is unchanged; a new document is simply a new key. The derived value is shared the
 * same way and must not be mutated.
 */
export function perContinentsDocument<T>(
  derive: (continents: Continent[]) => T
): (continents: Continent[]) => T {
  const derived = new WeakMap<Continent[], T>();
  return (continents) => {
    let value = derived.get(continents);
    if (value === undefined) {
      value = derive(continents);
      derived.set(continents, value);
    }
    return value;
  };
}

/**
 * Get countries in a continent with hydrated park data and breadcrumbs.
 */
export function getCountriesWithParks(continentSlug: string): Promise<DiscoveryCountryResponse> {
  return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`, {
    next: { revalidate: CACHE_TTL.continents, tags: ['geo'] },
  });
}

/**
 * Get cities in a country with hydrated park data and breadcrumbs.
 */
export function getCitiesWithParks(
  continentSlug: string,
  countrySlug: string
): Promise<DiscoveryCityResponse> {
  return api.get<DiscoveryCityResponse>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}`,
    { next: { revalidate: CACHE_TTL.continents, tags: ['geo'] } }
  );
}

/**
 * Get all attractions for sitemap generation. Cached 24h. Returns flat array of { url, slug }.
 */
export function getSitemapAttractions(): Promise<SitemapAttraction[]> {
  return api.get<SitemapAttraction[]>('/v1/sitemap/attractions', {
    next: { revalidate: 86400, tags: ['geo'] },
  });
}

/**
 * Find parks near a geographic location using coordinate-based proximity. Cached (proximity +
 * structure is week-stable; live status is overlaid client-side via LiveNearbyParks).
 *
 * Uses a tiny latitude offset (+0.001°, ~111m) so the query point sits just
 * outside any park's center, ensuring the API always returns a "nearby_parks"
 * response rather than an "in_park" rides response.
 *
 * @param lat - Latitude of the reference point (e.g. a park's center)
 * @param lng - Longitude of the reference point
 * @param excludeParkId - Park ID to exclude from results (the reference park itself)
 * @param limit - Number of parks to return (default 3)
 * @param maxDistanceM - Maximum distance in meters; parks beyond this are excluded (default 300km)
 */
export function getParksNearLocation(
  lat: number,
  lng: number,
  excludeParkId?: string,
  limit: number = 3,
  maxDistanceM: number = 300_000
): Promise<NearbyParkItem[]> {
  return fetchParksNearLocation(lat, lng, excludeParkId, limit, maxDistanceM, false);
}

/**
 * Live (no-store) variant of {@link getParksNearLocation} for the client overlay.
 *
 * The park page renders its "nearby parks" cards status-free (cacheable shell) and refreshes the
 * live open/closed status on the client via `useParkNeighbors` → `/api/parks/near`, which calls
 * this. Same proximity logic, just uncached so the overlay reflects the latest status.
 */
export async function getParksNearLocationFresh(
  lat: number,
  lng: number,
  excludeParkId?: string,
  limit: number = 3,
  maxDistanceM: number = 300_000
): Promise<NearbyParkItem[]> {
  return fetchParksNearLocation(lat, lng, excludeParkId, limit, maxDistanceM, true);
}

async function fetchParksNearLocation(
  lat: number,
  lng: number,
  excludeParkId: string | undefined,
  limit: number,
  maxDistanceM: number,
  fresh: boolean
): Promise<NearbyParkItem[]> {
  // The API sometimes returns coordinates as strings despite being typed as number — coerce defensively.
  const latNum = Number(lat);
  const lngNum = Number(lng);
  // Offset avoids haversine(identical, identical) = 0 which would trigger "in_park" even with radius=0
  const offsetLat = latNum + 0.001;
  const fetchLimit = limit + (excludeParkId ? 2 : 1); // buffer to cover filtered-out parks

  type NearbyApiResponse = {
    type: 'in_park' | 'nearby_parks';
    data: {
      parks?: NearbyParkItem[];
    };
  };

  const endpoint = `/v1/discovery/nearby?lat=${offsetLat}&lng=${lngNum}&limit=${fetchLimit}&radius=0`;

  try {
    const response = await api.get<NearbyApiResponse>(
      endpoint,
      fresh ? { cache: 'no-store' } : { next: { revalidate: 604800, tags: ['geo'] } }
    );

    if (response.type !== 'nearby_parks' || !response.data.parks) {
      return [];
    }

    return response.data.parks
      .filter((p) => p.id !== excludeParkId)
      .filter((p) => p.distance <= maxDistanceM)
      .slice(0, limit)
      .map(stripUnreadableWaitStats);
  } catch (error) {
    // The live variant backs `/api/parks/near`, which shares its answer for 60 s: an empty list
    // there would be cached as "no neighbours" and replace the cards' last good status. It throws,
    // and the route answers an uncached 502. The page's own proximity list keeps rendering nothing.
    if (fresh) throw error;
    return [];
  }
}

/**
 * Get countries in a continent (basic structure only, without park details).
 * Use getCountriesWithParks when you need full park data per country.
 */
export async function getCountriesInContinent(continentSlug: string): Promise<Country[]> {
  const response = await api.get<{ data?: Country[]; countries?: Country[] }>(
    `/v1/discovery/continents/${continentSlug}`,
    { next: { revalidate: CACHE_TTL.continents, tags: ['geo'] } }
  );
  // Handle both old array format and new {data} format
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || response.countries || [];
}

/**
 * Get country summary with top parks, peak/quiet months — for SEO landing pages.
 * Cached 24h — data is aggregated from ParkDailyStats, changes daily at most.
 */
export function getCountrySummary(
  continentSlug: string,
  countrySlug: string
): Promise<CountrySummary> {
  return api.get<CountrySummary>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}/summary`,
    { next: { revalidate: 86400, tags: ['geo'] } }
  );
}
