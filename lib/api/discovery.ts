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
 * Get the complete geographic structure, Data-cached; `revalidate` is part of the key, so the
 * sitemaps' one-day window gets its own entry. Wrapped in React `cache()` because the Data Cache
 * hands each call site its own `Response` and the homepage has several readers parsing the same
 * large body. Callers must not mutate the result.
 */
export const getGeoStructure = cache((revalidate: number = CACHE_TTL.geo): Promise<GeoStructure> =>
  api.get<GeoStructure>('/v1/discovery/geo', { next: { revalidate, tags: ['geo'] } })
);

/**
 * Get all continents, with their countries, cities and parks. Wrapped in React `cache()` because
 * the layout and the breadcrumb lookups read it on the same render; across requests the parsed
 * document is reused while its ETag is unchanged (see {@link readContinents}), so callers must not
 * mutate it.
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
 * The continents body, parsed only when it is not the document parsed last time. The layout reads
 * it on every request, and the API's weak ETag is computed from the body and stored with it in the
 * Data Cache, so an unchanged ETag means the body need not be parsed again. Without an ETag it
 * parses every time.
 *
 * The fetch itself still runs on every request: a fetch during a prerender is what gives the page
 * its `revalidate` and `geo` tag, and skipping it would stop `revalidateTag('geo')` reaching both
 * those pages and this memo. Only the parse is saved.
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
 * {@link getContinents} for the header menu and the redirect and breadcrumb lookups: when the fetch
 * fails and this process parsed the document before, that document instead of a throw, since a
 * stale menu beats an empty one. Pages that render the continents themselves keep the throw.
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
 * Something derived from the continents document, computed once per document rather than per
 * request. Keyed by the document object, which {@link readContinents} keeps stable while the
 * document is unchanged. The derived value is shared and must not be mutated.
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

/** Get countries in a continent with hydrated park data and breadcrumbs. */
export function getCountriesWithParks(continentSlug: string): Promise<DiscoveryCountryResponse> {
  return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`, {
    next: { revalidate: CACHE_TTL.continents, tags: ['geo'] },
  });
}

/** Get cities in a country with hydrated park data and breadcrumbs. */
export function getCitiesWithParks(
  continentSlug: string,
  countrySlug: string
): Promise<DiscoveryCityResponse> {
  return api.get<DiscoveryCityResponse>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}`,
    { next: { revalidate: CACHE_TTL.continents, tags: ['geo'] } }
  );
}

/** Get every attraction URL and slug for sitemap generation. */
export function getSitemapAttractions(): Promise<SitemapAttraction[]> {
  return api.get<SitemapAttraction[]>('/v1/sitemap/attractions', {
    next: { revalidate: 86400, tags: ['geo'] },
  });
}

/**
 * Find parks near a point, cached; live status is overlaid client-side. The query point is shifted
 * 0.001° north so it never sits on a park's centre, where the API would answer `in_park` with rides
 * instead of `nearby_parks`. `maxDistanceM` defaults to 300 km.
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
 * Live (no-store) variant of {@link getParksNearLocation} for the client overlay that refreshes
 * the nearby cards' open/closed status through `/api/parks/near`.
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
  // The API sometimes sends coordinates as strings despite the type.
  const latNum = Number(lat);
  const lngNum = Number(lng);
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
    // The live variant backs `/api/parks/near`, which caches its answer: an empty list would be
    // stored as „no neighbours", so it throws and the route answers an uncached 502.
    if (fresh) throw error;
    return [];
  }
}

/**
 * Get countries in a continent (structure only, no park details); use
 * {@link getCountriesWithParks} for full park data.
 */
export async function getCountriesInContinent(continentSlug: string): Promise<Country[]> {
  const response = await api.get<{ data?: Country[]; countries?: Country[] }>(
    `/v1/discovery/continents/${continentSlug}`,
    { next: { revalidate: CACHE_TTL.continents, tags: ['geo'] } }
  );
  // The endpoint has answered both a bare array and `{ data }`.
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || response.countries || [];
}

/** Get a country summary (top parks, peak and quiet months) for SEO landing pages. */
export function getCountrySummary(
  continentSlug: string,
  countrySlug: string
): Promise<CountrySummary> {
  return api.get<CountrySummary>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}/summary`,
    { next: { revalidate: 86400, tags: ['geo'] } }
  );
}
