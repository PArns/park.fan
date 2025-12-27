import { api } from './client';
import type {
  GeoStructure,
  Continent,
  Country,
  City,
  DiscoveryCountryResponse,
  DiscoveryCityResponse,
} from './types';

/**
 * Get complete geographic structure
 * Cached for 24 hours - used for static generation
 */
export async function getGeoStructure(): Promise<GeoStructure> {
  return api.get<GeoStructure>('/v1/discovery/geo', {
    next: { revalidate: 300 },
  });
}

/**
 * Get all continents
 */
export async function getContinents(): Promise<Continent[]> {
  return api.get<Continent[]>('/v1/discovery/continents', {
    next: { revalidate: 300 },
  });
}

/**
 * Get countries in a continent with hydrated park data and breadcrumbs
 * This replaces the old getCountriesInContinent for pages that need park details
 */
export async function getCountriesWithParks(
  continentSlug: string
): Promise<DiscoveryCountryResponse> {
  return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`, {
    next: { revalidate: 300 }, // 5 minutes for live data
  });
}

/**
 * Get cities in a country with hydrated park data and breadcrumbs
 * This replaces the old getCitiesInCountry for pages that need park details
 */
export async function getCitiesWithParks(
  continentSlug: string,
  countrySlug: string
): Promise<DiscoveryCityResponse> {
  return api.get<DiscoveryCityResponse>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}`,
    {
      next: { revalidate: 300 }, // 5 minutes for live data
    }
  );
}

/**
 * @deprecated Use getCountriesWithParks instead for pages displaying park data
 * Get countries in a continent (basic structure only)
 */
export async function getCountriesInContinent(continentSlug: string): Promise<Country[]> {
  const response = await api.get<{ data?: Country[]; countries?: Country[] }>(
    `/v1/discovery/continents/${continentSlug}`,
    { next: { revalidate: 300 } }
  );
  // Handle both old array format and new {data} format
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || response.countries || [];
}

/**
 * @deprecated Use getCitiesWithParks instead for pages displaying park data
 * Get cities in a country (basic structure only)
 */
export async function getCitiesInCountry(
  continentSlug: string,
  countrySlug: string
): Promise<City[]> {
  const response = await api.get<{ data?: City[]; cities?: City[] }>(
    `/v1/discovery/continents/${continentSlug}/${countrySlug}`,
    { next: { revalidate: 300 } }
  );
  // Handle both old array format and new {data} format
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || response.cities || [];
}
