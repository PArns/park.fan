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
    next: { revalidate: CACHE_TTL.geo },
  });
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
