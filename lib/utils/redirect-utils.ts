/**
 * Redirect utilities for handling malformed URLs
 *
 * These utilities help redirect old/malformed URLs to their correct counterparts.
 * Common issues include:
 * - Missing city segment: /parks/continent/country/park-slug (should have city)
 * - Attraction in park position: /parks/continent/country/park-slug/attraction-slug
 *   where park-slug is actually in the city position
 * - Stale geo segments after an API re-slug (bruhl → bruehl, marne-la-vallee → paris)
 */

import { cache } from 'react';
import { getGeoStructure } from '@/lib/api/discovery';

/**
 * O(1) park-slug → geo-path index for redirect lookups. Memoized per request via React `cache()`;
 * the underlying `getGeoStructure(604800)` is itself cached cross-request in the Vercel Data Cache
 * (`fetch` `next: { revalidate }`), so rebuilding this small index per request is cheap and never
 * hits the backend. Used only for malformed-URL redirect detection, never to serve a valid park.
 *
 * Values are LISTS: park slugs are not globally unique (e.g. `disneyland-park` exists in both
 * Paris and Anaheim), so callers must disambiguate by continent/country before redirecting.
 */
const getParkSlugIndex = cache(async (): Promise<Record<string, ParkLookupResult[]>> => {
  const index: Record<string, ParkLookupResult[]> = {};
  try {
    const data = await getGeoStructure(604800);
    for (const continent of data.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            (index[park.slug] ??= []).push({
              continent: continent.slug,
              country: country.slug,
              city: city.slug,
              parkSlug: park.slug,
            });
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
 * Find all locations a park slug exists at — O(1) via index.
 * Usually one entry; duplicates happen (disneyland-park: Paris + Anaheim).
 */
export async function findParkLocationsBySlug(parkSlug: string): Promise<ParkLookupResult[]> {
  const index = await getParkSlugIndex();
  return index[parkSlug] ?? [];
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
    // Check if the "citySlug" is actually a park within this continent/country
    const park = (await findParkLocationsBySlug(citySlug)).find(
      (p) => p.continent === continent && p.country === country
    );

    if (park) {
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
    // Check if the "citySlug" is actually a park slug within this continent/country
    const park = (await findParkLocationsBySlug(citySlug)).find(
      (p) => p.continent === continent && p.country === country
    );

    if (park) {
      // The "city" is actually a park — redirect to the park page at least.
      // We can no longer check if parkSlug is an attraction (removed from discovery endpoint).
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }

    return null;
  }
);

/**
 * Try to find a redirect for a park URL whose geo segments went stale.
 *
 * The park slug is the stable key: when the API re-slugs a city (e.g. the
 * umlaut transliteration change `bruhl` → `bruehl`, `gunzburg` → `guenzburg`)
 * or moves a park to another city (`marne-la-vallee` → `paris`), URLs indexed
 * by Google keep the old segments and would 404. If the requested park slug
 * exists in the geo structure under a different continent/country/city, return
 * its canonical path so callers can issue a permanent redirect.
 *
 * Duplicate slugs (disneyland-park: Paris + Anaheim) are disambiguated by
 * preferring a location in the requested continent+country, then continent;
 * an ambiguous slug with no continent match yields no redirect rather than
 * risking a cross-continent bounce.
 *
 * IMPORTANT: only call this AFTER the API lookup for the requested path has
 * failed. The geo-structure snapshot is cached for days — if it lagged behind
 * a re-slug, calling this on the happy path could bounce a working new URL
 * back to a stale one. After a confirmed miss it can only improve on a 404.
 *
 * @returns The canonical park URL or null if the slug is unknown, ambiguous or
 *          already at the requested path
 */
export const findRelocatedParkRedirect = cache(
  async (
    continent: string,
    country: string,
    citySlug: string,
    parkSlug: string
  ): Promise<string | null> => {
    const locations = await findParkLocationsBySlug(parkSlug);
    if (locations.length === 0) return null;

    const park =
      locations.find((l) => l.continent === continent && l.country === country) ??
      locations.find((l) => l.continent === continent) ??
      (locations.length === 1 ? locations[0] : null);

    if (
      park &&
      (park.continent !== continent || park.country !== country || park.city !== citySlug)
    ) {
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
// Attraction URLs under a relocated park are healed via findRelocatedParkRedirect
// (the attraction page re-appends its own slug to the corrected park path).
