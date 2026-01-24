/**
 * Redirect utilities for handling malformed URLs
 *
 * These utilities help redirect old/malformed URLs to their correct counterparts.
 * Common issues include:
 * - Missing city segment: /parks/continent/country/park-slug (should have city)
 * - Attraction in park position: /parks/continent/country/park-slug/attraction-slug
 *   where park-slug is actually in the city position
 */

import { getGeoStructure } from '@/lib/api/discovery';

// Cache the geo structure for redirect lookups
let geoStructureCache: {
  data: Awaited<ReturnType<typeof getGeoStructure>> | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get cached geo structure for redirect lookups
 */
async function getCachedGeoStructure() {
  const now = Date.now();

  if (geoStructureCache.data && now - geoStructureCache.timestamp < CACHE_TTL) {
    return geoStructureCache.data;
  }

  try {
    const data = await getGeoStructure(86400); // 24h cache at API level
    geoStructureCache = { data, timestamp: now };
    return data;
  } catch (error) {
    console.error('[RedirectUtils] Failed to fetch geo structure:', error);
    return geoStructureCache.data; // Return stale data if available
  }
}

export interface ParkLookupResult {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractions: Array<{ slug: string }>;
}

/**
 * Find park by slug across all geo data
 * Returns the full geographic path if found
 */
export async function findParkBySlug(parkSlug: string): Promise<ParkLookupResult | null> {
  const geo = await getCachedGeoStructure();
  if (!geo) return null;

  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (park.slug === parkSlug) {
            return {
              continent: continent.slug,
              country: country.slug,
              city: city.slug,
              parkSlug: park.slug,
              attractions: park.attractions || [],
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Find attraction by slug across all parks
 * Returns the full geographic path if found
 */
export async function findAttractionBySlug(
  attractionSlug: string
): Promise<(ParkLookupResult & { attractionSlug: string }) | null> {
  const geo = await getCachedGeoStructure();
  if (!geo) return null;

  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (park.attractions) {
            const attraction = park.attractions.find((a) => a.slug === attractionSlug);
            if (attraction) {
              return {
                continent: continent.slug,
                country: country.slug,
                city: city.slug,
                parkSlug: park.slug,
                attractions: park.attractions,
                attractionSlug: attraction.slug,
              };
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Try to find a redirect for a malformed city page URL
 *
 * Pattern: /parks/{continent}/{country}/{maybePark}
 * If {maybePark} is actually a park slug, we need to find the city
 *
 * @returns The correct URL or null if no redirect found
 */
export async function findCityPageRedirect(
  continent: string,
  country: string,
  citySlug: string
): Promise<string | null> {
  // Check if the "citySlug" is actually a park
  const park = await findParkBySlug(citySlug);

  if (park && park.continent === continent && park.country === country) {
    // Found! The "city" segment is actually a park slug
    // Return the correct URL with the real city
    return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
  }

  return null;
}

/**
 * Try to find a redirect for a malformed park page URL
 *
 * Pattern: /parks/{continent}/{country}/{maybeParkAsCity}/{maybeAttractionAsPark}
 * If {maybeParkAsCity} is actually a park and {maybeAttractionAsPark} is an attraction
 *
 * @returns The correct URL or null if no redirect found
 */
export async function findParkPageRedirect(
  continent: string,
  country: string,
  citySlug: string,
  parkSlug: string
): Promise<string | null> {
  // Check if the "citySlug" is actually a park slug
  const park = await findParkBySlug(citySlug);

  if (park && park.continent === continent && park.country === country) {
    // The "city" is actually a park!
    // Check if the "park" is actually an attraction of this park
    const isAttraction = park.attractions.some((a) => a.slug === parkSlug);

    if (isAttraction) {
      // It's an attraction! Redirect to correct URL
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}/${parkSlug}`;
    } else {
      // Not an attraction, might just be a wrong URL entirely
      // Redirect to the park page at least
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }
  }

  return null;
}

/**
 * Try to find a redirect for a malformed attraction page URL
 *
 * Pattern: /parks/{continent}/{country}/{city}/{park}/{attraction}
 * Various malformed patterns possible
 *
 * @returns The correct URL or null if no redirect found
 */
export async function findAttractionPageRedirect(
  continent: string,
  country: string,
  citySlug: string,
  parkSlug: string,
  attractionSlug: string
): Promise<string | null> {
  // Most complex case: entire path might be shifted
  // For now just check if attraction exists anywhere
  const attraction = await findAttractionBySlug(attractionSlug);

  if (attraction && attraction.continent === continent && attraction.country === country) {
    return `/parks/${attraction.continent}/${attraction.country}/${attraction.city}/${attraction.parkSlug}/${attraction.attractionSlug}`;
  }

  return null;
}
