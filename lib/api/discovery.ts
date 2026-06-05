import { cacheLife } from 'next/cache';
import { api } from './client';
import { CACHE_TTL } from './cache-config';
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
 * Get complete geographic structure. Cached (geo changes rarely); used for static generation.
 * `revalidate` keys a distinct cache lifetime (e.g. the sitemap asks for 24h).
 */
export async function getGeoStructure(revalidate: number = CACHE_TTL.geo): Promise<GeoStructure> {
  'use cache';
  cacheLife({ stale: revalidate, revalidate, expire: revalidate * 4 });
  return api.get<GeoStructure>('/v1/discovery/geo');
}

/**
 * Get all continents.
 */
export async function getContinents(): Promise<Continent[]> {
  'use cache';
  cacheLife({
    stale: CACHE_TTL.continents,
    revalidate: CACHE_TTL.continents,
    expire: CACHE_TTL.continents * 4,
  });
  return api.get<Continent[]>('/v1/discovery/continents');
}

/**
 * Get countries in a continent with hydrated park data and breadcrumbs.
 */
export async function getCountriesWithParks(
  continentSlug: string
): Promise<DiscoveryCountryResponse> {
  'use cache';
  cacheLife({
    stale: CACHE_TTL.continents,
    revalidate: CACHE_TTL.continents,
    expire: CACHE_TTL.continents * 4,
  });
  return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`);
}

/**
 * Get cities in a country with hydrated park data and breadcrumbs.
 */
export async function getCitiesWithParks(
  continentSlug: string,
  countrySlug: string
): Promise<DiscoveryCityResponse> {
  'use cache';
  cacheLife({
    stale: CACHE_TTL.continents,
    revalidate: CACHE_TTL.continents,
    expire: CACHE_TTL.continents * 4,
  });
  return api.get<DiscoveryCityResponse>(`/v1/discovery/continents/${continentSlug}/${countrySlug}`);
}

/**
 * Get all attractions for sitemap generation. Cached 24h. Returns flat array of { url, slug }.
 */
export async function getSitemapAttractions(): Promise<SitemapAttraction[]> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 * 2 });
  return api.get<SitemapAttraction[]>('/v1/sitemap/attractions');
}

/**
 * Find parks near a geographic location using coordinate-based proximity.
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
export async function getParksNearLocation(
  lat: number,
  lng: number,
  excludeParkId?: string,
  limit: number = 3,
  maxDistanceM: number = 300_000
): Promise<NearbyParkItem[]> {
  'use cache';
  cacheLife({ stale: 3600, revalidate: 3600, expire: 3600 * 4 });
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
    const response = await api.get<NearbyApiResponse>(endpoint);

    if (response.type !== 'nearby_parks' || !response.data.parks) {
      return [];
    }

    return response.data.parks
      .filter((p) => p.id !== excludeParkId)
      .filter((p) => p.distance <= maxDistanceM)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Get countries in a continent (basic structure only, without park details).
 * Use getCountriesWithParks when you need full park data per country.
 */
export async function getCountriesInContinent(continentSlug: string): Promise<Country[]> {
  'use cache';
  cacheLife({
    stale: CACHE_TTL.continents,
    revalidate: CACHE_TTL.continents,
    expire: CACHE_TTL.continents * 4,
  });
  const response = await api.get<{ data?: Country[]; countries?: Country[] }>(
    `/v1/discovery/continents/${continentSlug}`
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
export async function getCountrySummary(
  continentSlug: string,
  countrySlug: string
): Promise<CountrySummary> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 * 2 });
  return api.get<CountrySummary>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}/summary`
  );
}
