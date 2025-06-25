import {
  StatisticsData,
  ContinentApiData,
  CountryApiData,
  ParkApiData,
  RideApiData,
  ContinentStats,
} from './api-types';
import { API_BASE_URL, API_HEADERS, API_REVALIDATE_CONFIG } from './config';
import { SearchParkResult, SearchRideResult } from './park-types';
import { toSlug } from './utils';

export async function fetchStatistics(): Promise<StatisticsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      headers: API_HEADERS,
      ...API_REVALIDATE_CONFIG,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
}

// Helper function to transform data for components
export function transformStatisticsData(data: StatisticsData) {
  const continentsForComponent: ContinentStats =
    data.parksByContinent?.reduce(
      (acc, continent) => {
        acc[continent.continent] = continent.totalParks;
        return acc;
      },
      {} as { [key: string]: number }
    ) || {};

  const countriesForComponent =
    data.parksByCountry?.map((country) => ({
      country: country.country,
      totalParks: country.totalParks,
      openParks: country.openParks,
      closedParks: country.closedParks,
      operatingPercentage: country.operatingPercentage,
      flag: getCountryFlag(country.country),
    })) || [];

  return {
    ...data,
    // Transform continents data for component
    continentsForComponent,

    // Transform countries data for component
    countriesForComponent,
  };
}

// Helper function to get country flags
export function getCountryFlag(country: string): string {
  const flagMap: { [key: string]: string } = {
    Germany: '🇩🇪',
    'United States': '🇺🇸',
    Japan: '🇯🇵',
    France: '🇫🇷',
    'United Kingdom': '🇬🇧',
    England: '🇬🇧',
    China: '🇨🇳',
    'Hong Kong': '🇭🇰',
    Spain: '🇪🇸',
    Italy: '🇮🇹',
    Netherlands: '🇳🇱',
    Belgium: '🇧🇪',
    Austria: '🇦🇹',
    Switzerland: '🇨🇭',
    Denmark: '🇩🇰',
    Sweden: '🇸🇪',
    Norway: '🇳🇴',
    Finland: '🇫🇮',
    Australia: '🇦🇺',
    Canada: '🇨🇦',
    Brazil: '🇧🇷',
    Mexico: '🇲🇽',
    'South Korea': '🇰🇷',
  };

  return flagMap[country] || '🏁';
}

// Helper function to get wait time badge variant based on wait time
export function getWaitTimeBadgeVariant(
  waitTime: number
): 'success' | 'warning' | 'error' | 'critical' | 'extreme' {
  if (waitTime <= 20) return 'success';
  if (waitTime <= 45) return 'warning';
  if (waitTime <= 90) return 'error';
  if (waitTime <= 120) return 'critical';
  return 'extreme';
}

/**
 * Get color class for wait time display
 */
export function getWaitTimeColor(waitTime: number): string {
  if (waitTime === 0) return 'text-muted-foreground';
  if (waitTime <= 15) return 'text-green-600';
  if (waitTime <= 30) return 'text-orange-500';
  if (waitTime <= 60) return 'text-red-600';
  if (waitTime <= 120) return 'text-red-700';
  return 'text-purple-600';
}

/**
 * Get ranking icon/emoji for position
 */
export function getRankIcon(index: number): string {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return '🏆';
  }
}

// New API functions for hierarchical pages
export async function fetchContinentDetails(continent: string): Promise<ContinentApiData> {
  try {
    const normalizedContinent = normalizePathSegment(continent);

    // Fetch all pages
    let allData: ContinentApiData['data'] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${API_BASE_URL}/parks/${normalizedContinent}?page=${page}&limit=100`,
        {
          headers: API_HEADERS,
          ...API_REVALIDATE_CONFIG,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      allData = [...allData, ...data.data];

      hasMore = data.pagination.hasNext;
      page++;
    }

    // Sort parks by name
    allData.sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: allData,
      pagination: {
        page: 1,
        limit: allData.length,
        totalCount: allData.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch continent details for ${continent}:`, error);
    throw error;
  }
}

export async function fetchCountryDetails(
  continent: string,
  country: string
): Promise<CountryApiData> {
  try {
    const normalizedContinent = normalizePathSegment(continent);
    const normalizedCountry = normalizePathSegment(country);

    // Fetch all pages
    let allData: CountryApiData['data'] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${API_BASE_URL}/parks/${normalizedContinent}/${normalizedCountry}?page=${page}&limit=100`,
        {
          headers: API_HEADERS,
          ...API_REVALIDATE_CONFIG,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      allData = [...allData, ...data.data];

      hasMore = data.pagination.hasNext;
      page++;
    }

    // Sort parks by name
    allData.sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: allData,
      pagination: {
        page: 1,
        limit: allData.length,
        totalCount: allData.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch country details for ${country}:`, error);
    throw error;
  }
}

export async function fetchParkDetails(
  continent: string,
  country: string,
  park: string
): Promise<ParkApiData> {
  try {
    const normalizedContinent = normalizePathSegment(continent);
    const normalizedCountry = normalizePathSegment(country);
    const normalizedPark = normalizePathSegment(park);

    const response = await fetch(
      `${API_BASE_URL}/parks/${normalizedContinent}/${normalizedCountry}/${normalizedPark}`,
      {
        headers: API_HEADERS,
        ...API_REVALIDATE_CONFIG,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch park details for ${park}:`, error);
    throw error;
  }
}

export async function fetchRideDetails(
  continent: string,
  country: string,
  park: string,
  ride: string
): Promise<RideApiData> {
  try {
    const normalizedContinent = normalizePathSegment(continent);
    const normalizedCountry = normalizePathSegment(country);
    const normalizedPark = normalizePathSegment(park);
    const normalizedRide = normalizePathSegment(ride);

    const response = await fetch(
      `${API_BASE_URL}/parks/${normalizedContinent}/${normalizedCountry}/${normalizedPark}/${normalizedRide}`,
      {
        headers: API_HEADERS,
        ...API_REVALIDATE_CONFIG,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ride details for ${ride}:`, error);
    throw error;
  }
}

interface SearchParksApiResponse {
  data: Array<{
    id: number;
    name: string;
    country: string;
    hierarchicalUrl: string;
  }>;
}

export async function searchParks(query: string, limit = 5): Promise<SearchParkResult[]> {
  try {
    const fields = 'id,name,country,hierarchicalUrl';
    const url =
      typeof window === 'undefined'
        ? `${API_BASE_URL}/parks?search=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`
        : `/api/search/parks?search=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;

    const response = await fetch(url, {
      headers: API_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SearchParksApiResponse;
    return (data.data || []).map((park) => ({
      id: park.id,
      name: park.name,
      country: park.country,
      hierarchicalUrl: park.hierarchicalUrl,
    }));
  } catch (error) {
    console.error('Failed to search parks:', error);
    return [];
  }
}

interface SearchRidesApiResponse {
  data: Array<{
    id: number;
    name: string;
    park: { name: string; country: string } | null;
    hierarchicalUrl: string;
  }>;
}

export async function searchRides(query: string, limit = 5): Promise<SearchRideResult[]> {
  try {
    const fields = 'id,name,hierarchicalUrl,park.name,park.country';
    const url =
      typeof window === 'undefined'
        ? `${API_BASE_URL}/rides?search=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`
        : `/api/search/rides?search=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;

    const response = await fetch(url, {
      headers: API_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as SearchRidesApiResponse;
    return (data.data || []).map((ride) => ({
      id: ride.id,
      name: ride.name,
      parkName: ride.park?.name ?? '',
      country: ride.park?.country ?? '',
      hierarchicalUrl: ride.hierarchicalUrl,
    }));
  } catch (error) {
    console.error('Failed to search rides:', error);
    return [];
  }
}

// Helper function to generate URL slug according to API rules
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/\./g, '') // Remove dots entirely
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
}

// Helper function to normalize path segments according to API rules
// Based on https://github.com/PArns/api.park.fan documentation:
// - Spaces replaced with hyphens (-)
// - Dots (.) removed entirely
// - All lowercase
// - Special characters removed
// - Diacritical marks (accents) removed
export function normalizePathSegment(segment: string): string {
  // Remove common file extensions that might get into the URL
  segment = segment.replace(
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|txt|woff|woff2|ttf|eot)$/i,
    ''
  );

  // Handle common continent and country name variations
  const mappings: Record<string, string> = {
    // Continents
    'north america': 'north-america',
    'north-america': 'north-america',
    'south america': 'south-america',
    'south-america': 'south-america',
    // Countries
    england: 'england',
    'united-kingdom': 'england',
    uk: 'england',
    'united-states': 'united-states',
    usa: 'united-states',
    us: 'united-states',
  };

  // First check if we have a direct mapping for the original segment
  const lowerSegment = segment.toLowerCase();
  if (mappings[lowerSegment]) {
    return mappings[lowerSegment];
  }

  // Apply improved slug transformation:
  const normalized = toSlug(segment);

  return mappings[normalized] || normalized;
}

// Helper function to check if a path segment is likely a static file request
export function isStaticFileRequest(segment: string): boolean {
  const staticExtensions =
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|txt|woff|woff2|ttf|eot|map|webp|avif)$/i;
  const staticFiles = ['favicon.ico', 'robots.txt', 'manifest.json', 'sitemap.xml'];

  return staticExtensions.test(segment) || staticFiles.includes(segment.toLowerCase());
}

/**
 * Get continent for a country name (fallback mapping)
 */
export function getCountryContinent(countryName: string): string {
  const continentMap: { [key: string]: string } = {
    'United States': 'north-america',
    Canada: 'north-america',
    Mexico: 'north-america',
    'United Kingdom': 'europe',
    France: 'europe',
    Germany: 'europe',
    Spain: 'europe',
    Italy: 'europe',
    Netherlands: 'europe',
    Belgium: 'europe',
    Denmark: 'europe',
    Sweden: 'europe',
    Norway: 'europe',
    Finland: 'europe',
    Japan: 'asia',
    China: 'asia',
    'South Korea': 'asia',
    'Hong Kong': 'asia',
    Singapore: 'asia',
    Australia: 'oceania',
    'New Zealand': 'oceania',
    Brazil: 'south-america',
    Argentina: 'south-america',
    Chile: 'south-america',
    'South Africa': 'africa',
    Egypt: 'africa',
  };
  return continentMap[countryName] || 'europe'; // Default to europe if not found
}
