/**
 * Redirect utilities for handling malformed URLs
 *
 * These utilities help redirect old/malformed URLs to their correct counterparts.
 * Common issues include:
 * - Missing city segment: /parks/continent/country/park-slug (should have city)
 * - Attraction in park position: /parks/continent/country/park-slug/attraction-slug
 *   where park-slug is actually in the city position
 */

import { cache } from 'react';
import { getGeoStructure } from '@/lib/api/discovery';

/**
 * O(1) park-slug → geo-path index for redirect lookups. Memoized per request via React `cache()`;
 * the underlying `getGeoStructure(604800)` is itself cached cross-request in the Vercel Data Cache
 * (`fetch` `next: { revalidate }`), so rebuilding this small index per request is cheap and never
 * hits the backend. Used only for malformed-URL redirect detection, never to serve a valid park.
 */
const getParkSlugIndex = cache(async (): Promise<Record<string, ParkLookupResult>> => {
  const index: Record<string, ParkLookupResult> = {};
  try {
    const data = await getGeoStructure(604800);
    for (const continent of data.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            index[park.slug] = {
              continent: continent.slug,
              country: country.slug,
              city: city.slug,
              parkSlug: park.slug,
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('[RedirectUtils] Failed to fetch geo structure:', error);
  }
  return index;
});

export interface ParkLookupResult {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Find park by slug across all geo data — O(1) via index.
 * Returns the full geographic path if found.
 */
export async function findParkBySlug(parkSlug: string): Promise<ParkLookupResult | null> {
  const index = await getParkSlugIndex();
  return index[parkSlug] ?? null;
}

/**
 * Try to find a redirect for a malformed city page URL
 *
 * Pattern: /parks/{continent}/{country}/{maybePark}
 * If {maybePark} is actually a park slug, we need to find the city
 *
 * @returns The correct URL or null if no redirect found
 */
export const findCityPageRedirect = cache(
  async (continent: string, country: string, citySlug: string): Promise<string | null> => {
    // Check if the "citySlug" is actually a park
    const park = await findParkBySlug(citySlug);

    if (park && park.continent === continent && park.country === country) {
      // Found! The "city" segment is actually a park slug
      // Return the correct URL with the real city
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }

    return null;
  }
);

/**
 * Try to find a redirect for a malformed park page URL
 *
 * Pattern: /parks/{continent}/{country}/{maybeParkAsCity}/{maybeAttractionAsPark}
 * If {maybeParkAsCity} is actually a park and {maybeAttractionAsPark} is an attraction
 *
 * @returns The correct URL or null if no redirect found
 */
export const findParkPageRedirect = cache(
  async (
    continent: string,
    country: string,
    citySlug: string,
    _parkSlug: string
  ): Promise<string | null> => {
    // Check if the "citySlug" is actually a park slug
    const park = await findParkBySlug(citySlug);

    if (park && park.continent === continent && park.country === country) {
      // The "city" is actually a park — redirect to the park page at least.
      // We can no longer check if parkSlug is an attraction (removed from discovery endpoint).
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }

    return null;
  }
);

/**
 * Try to find a redirect for a malformed attraction page URL
 *
 * Pattern: /parks/{continent}/{country}/{city}/{park}/{attraction}
 * Various malformed patterns possible
 *
 * @returns The correct URL or null if no redirect found
 */
// findAttractionPageRedirect removed: attraction data is no longer available
// from discovery endpoints. Attraction redirect lookups are no longer supported.
