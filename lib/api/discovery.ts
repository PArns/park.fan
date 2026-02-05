import { api } from './client';
import { CACHE_TTL } from './cache-config';
import type {
  GeoStructure,
  Continent,
  Country,
  City,
  DiscoveryCountryResponse,
  DiscoveryCityResponse,
} from './types';
import type { NearbyResponse } from '@/types/nearby';

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
 * This replaces the old getCountriesInContinent for pages that need park details
 */
export async function getCountriesWithParks(
  continentSlug: string
): Promise<DiscoveryCountryResponse> {
  return api.get<DiscoveryCountryResponse>(`/v1/discovery/continents/${continentSlug}`, {
    next: { revalidate: CACHE_TTL.continents },
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
      next: { revalidate: CACHE_TTL.continents },
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
    { next: { revalidate: CACHE_TTL.continents } }
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
    { next: { revalidate: CACHE_TTL.continents } }
  );
  // Handle both old array format and new {data} format
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || response.cities || [];
}

/**
 * Get nearby parks or attractions based on user coordinates.
 * Client-side only. Uses Next.js API route (no CORS).
 * For "no coords" (IP fallback), call /api/nearby without lat/lng or use useNearbyParks() which handles both.
 */
export async function getNearbyParks(
  latitude: number,
  longitude: number,
  radiusInMeters: number = 1000,
  limit: number = 6
): Promise<NearbyResponse> {
  const url = new URL('/api/nearby', window.location.origin);
  url.searchParams.set('lat', latitude.toString());
  url.searchParams.set('lng', longitude.toString());
  url.searchParams.set('radius', radiusInMeters.toString());
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), { cache: 'no-store' });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.error === 'string'
        ? body.error
        : `Failed to fetch nearby parks: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}
