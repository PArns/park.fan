import { cache } from 'react';
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
 * Get complete geographic structure
 * Cached for 24 hours - used for static generation
 */
export async function getGeoStructure(revalidate: number = CACHE_TTL.geo): Promise<GeoStructure> {
  return api.get<GeoStructure>('/v1/discovery/geo', {
    next: { revalidate },
  });
}

/**
 * Get all continents
 */
export async function getContinents(): Promise<Continent[]> {
  return api.get<Continent[]>('/v1/discovery/continents', {
    next: { revalidate: CACHE_TTL.continents },
  });
}

/**
 * Get countries in a continent with hydrated park data and breadcrumbs
 * This replaces the old getCountriesInContinent for pages that need park details.
 * Wrapped with React.cache() so generateMetadata + page share one result per request.
 */
export const getCountriesWithParks = cache(
  async (continentSlug: string): Promise<DiscoveryCountryResponse> => {
    return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`, {
      next: { revalidate: CACHE_TTL.continents },
    });
  }
);

/**
 * Get cities in a country with hydrated park data and breadcrumbs
 * This replaces the old getCitiesInCountry for pages that need park details.
 * Wrapped with React.cache() so generateMetadata + page share one result per request.
 */
export const getCitiesWithParks = cache(
  async (continentSlug: string, countrySlug: string): Promise<DiscoveryCityResponse> => {
    return api.get<DiscoveryCityResponse>(
      `/v1/discovery/continents/${continentSlug}/${countrySlug}`,
      {
        next: { revalidate: CACHE_TTL.continents },
      }
    );
  }
);

/**
 * Get all attractions for sitemap generation.
 * Cached for 24 hours. Returns flat array of { url, slug }.
 */
export async function getSitemapAttractions(): Promise<SitemapAttraction[]> {
  return api.get<SitemapAttraction[]>('/v1/sitemap/attractions', {
    next: { revalidate: 86400 },
  });
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
    const response = await api.get<NearbyApiResponse>(endpoint, { next: { revalidate: 3600 } });

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
  const response = await api.get<{ data?: Country[]; countries?: Country[] }>(
    `/v1/discovery/continents/${continentSlug}`,
    { next: { revalidate: CACHE_TTL.continents } }
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
export const getCountrySummary = cache(
  async (continentSlug: string, countrySlug: string): Promise<CountrySummary> => {
    return api.get<CountrySummary>(
      `/v1/discovery/continents/${continentSlug}/${countrySlug}/summary`,
      { next: { revalidate: 86400 } }
    );
  }
);
