/**
 * URL conversion utilities
 * Converts backend API URLs to frontend routes
 *
 * IMPORTANT: Always use these utilities when working with URLs from the API.
 * Never manually construct URLs with string manipulation like `.replace('/v1/parks/', '/parks/')`.
 */

import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import type { SearchResultItem } from '@/lib/api/types';

/**
 * Convert backend API URL to frontend route
 *
 * This is the primary utility for converting API URLs to frontend routes.
 * Use this whenever you receive a URL from the API response.
 *
 * Examples:
 * - /v1/parks/europe/germany/bruehl/phantasialand → /parks/europe/germany/bruehl/phantasialand
 * - /v1/parks/europe/germany/bruehl/phantasialand/attractions/taron → /parks/europe/germany/bruehl/phantasialand/taron
 * - /v1/shows/... → /parks/...#shows
 * - /v1/restaurants/... → /parks/...#restaurants
 * - /v1/discovery/... → /parks/...
 *
 * @param apiUrl - The API URL to convert (e.g., from attraction.url, park.url, etc.)
 * @returns The converted frontend URL, or '#' if conversion fails
 */
export function convertApiUrlToFrontendUrl(apiUrl: string | null | undefined): string {
  if (!apiUrl) return '#';

  // Convert /v1/parks/... URLs
  if (apiUrl.startsWith('/v1/parks/')) {
    let url = apiUrl.replace('/v1/parks/', '/parks/');

    // Remove /attractions/ segment (attractions are direct children of park)
    url = url.replace('/attractions/', '/');

    // Remove /shows/ and /restaurants/ segments (they use hash fragments)
    // Also remove any slug after /shows/ or /restaurants/
    // Example: /parks/.../shows/mystic-winter-castle → /parks/...
    if (url.includes('/shows/')) {
      const showsIndex = url.indexOf('/shows/');
      url = url.substring(0, showsIndex);
    }
    if (url.includes('/restaurants/')) {
      const restaurantsIndex = url.indexOf('/restaurants/');
      url = url.substring(0, restaurantsIndex);
    }

    return url;
  }

  // Convert /v1/shows/... URLs
  if (apiUrl.startsWith('/v1/shows/')) {
    // Extract park path from show URL
    // Format: /v1/shows/{showId} or /v1/parks/.../shows/...
    // For now, we need to construct from park data if available
    // This will be handled by the caller with park context
    return '#';
  }

  // Convert /v1/restaurants/... URLs
  if (apiUrl.startsWith('/v1/restaurants/')) {
    // Similar to shows - needs park context
    return '#';
  }

  // If already a frontend URL, clean it up
  if (apiUrl.startsWith('/parks/')) {
    let url = apiUrl;

    // Remove /attractions/ segment (attractions are direct children of park)
    url = url.replace('/attractions/', '/');

    // Remove /shows/ and /restaurants/ segments (they use hash fragments)
    // Also remove any slug after /shows/ or /restaurants/
    if (url.includes('/shows/')) {
      const showsIndex = url.indexOf('/shows/');
      url = url.substring(0, showsIndex);
    }
    if (url.includes('/restaurants/')) {
      const restaurantsIndex = url.indexOf('/restaurants/');
      url = url.substring(0, restaurantsIndex);
    }

    return url;
  }

  return '#';
}

/**
 * Extract park URL from an attraction URL
 *
 * Use when you only have an attraction URL (e.g. from attractions[0].url)
 * and need the parent park page URL.
 *
 * @param attractionUrl - API or frontend URL containing /attractions/
 * @returns Park page URL, or '#' if invalid
 */
export function getParkUrlFromAttractionUrl(attractionUrl: string): string {
  if (!attractionUrl) return '#';
  if (attractionUrl.includes('/attractions/')) {
    const parkPart = attractionUrl.split('/attractions/')[0];
    return convertApiUrlToFrontendUrl(parkPart);
  }
  return convertApiUrlToFrontendUrl(attractionUrl);
}

/**
 * The park-page chapter a show or restaurant lives under: `/parks/…#shows` or `/parks/…#restaurants`.
 *
 * Neither has a page of its own, so a link to one goes to its park's tab. `url` is whatever the API
 * handed over for the item or its park: a park URL, a `/parks/…/shows/<slug>` URL (the show segment
 * is dropped), or a bare `/v1/shows/<id>` that names no park at all. The last kind gives `null`, and
 * each caller picks its own fallback rather than linking to `#shows` on whatever page it is on.
 */
export function parkChapterUrl(
  url: string | null | undefined,
  chapter: 'shows' | 'restaurants'
): string | null {
  const parkUrl = convertApiUrlToFrontendUrl(url);
  return parkUrl.startsWith('/parks/') ? `${parkUrl.split('#')[0]}#${chapter}` : null;
}

/**
 * Build attraction URL from park URL and attraction slug
 */
export function buildAttractionUrl(parkUrl: string, attractionSlug: string): string {
  let cleanParkUrl = convertApiUrlToFrontendUrl(parkUrl);

  // Remove trailing slash if present to avoid double slashes
  if (cleanParkUrl.endsWith('/')) {
    cleanParkUrl = cleanParkUrl.slice(0, -1);
  }

  return `${cleanParkUrl}/${attractionSlug}`;
}

/**
 * Where a search result links to — one answer for the palette, the hero's dropdown and `/search`.
 *
 * Locale-less, like every path the i18n `Link` and router take; the locale only picks the
 * glossary's own URL segment. `null` when the result names nowhere, so a surface can refuse the
 * click instead of sending the visitor to "/" or to a bare `#`.
 *
 * In order: the result's own URL; for a park without one, its geo path; a glossary term; and for a
 * ride, show or restaurant without one, its park — the ride's page under it, the other two as the
 * park's tab (they have no page of their own).
 */
export function searchResultHref(result: SearchResultItem, locale: Locale): string | null {
  const own = convertApiUrlToFrontendUrl(result.url);
  if (own !== '#') return own;

  if (result.type === 'park' && result.continent && result.country) {
    const segment = (value: string) => value.toLowerCase().replace(/\s+/g, '-');
    const city = result.city ? segment(result.city) : 'unknown';
    return `/parks/${segment(result.continent)}/${segment(result.country)}/${city}/${result.slug}`;
  }

  if (result.type === 'glossary') {
    return `/${GLOSSARY_SEGMENTS[locale] ?? 'glossary'}/${result.slug}`;
  }

  const parkUrl = convertApiUrlToFrontendUrl(result.parentPark?.url);
  if (!parkUrl.startsWith('/parks/')) return null;
  if (result.type === 'show') return parkChapterUrl(parkUrl, 'shows');
  if (result.type === 'restaurant') return parkChapterUrl(parkUrl, 'restaurants');
  return `${parkUrl}/${result.slug}`;
}

// ============================================================================
// Robust Geo Route Builders
// ============================================================================

/**
 * Geographic data required to build park URLs
 */
export interface ParkGeoData {
  continent?: string | null;
  country?: string | null;
  city?: string | null;
  slug: string;
  url?: string | null; // Fallback if geo data is incomplete
}

/**
 * Geographic data required to build attraction URLs
 */
export interface AttractionGeoData {
  slug: string;
  url?: string | null;
  park?: ParkGeoData;
}

/**
 * Build a park URL from geographic data
 *
 * This is the PREFERRED method for building park URLs as it:
 * 1. Builds clean URLs from geographic data (most robust)
 * 2. Falls back to URL conversion if geographic data is incomplete
 * 3. Returns '#' only if both methods fail
 *
 * @param data - Park geographic data
 * @returns Clean frontend park URL
 *
 * @example
 * ```ts
 * buildParkUrl({
 *   continent: 'europe',
 *   country: 'germany',
 *   city: 'bruehl',
 *   slug: 'phantasialand'
 * })
 * // Returns: '/parks/europe/germany/bruehl/phantasialand'
 * ```
 */
export function buildParkUrl(data: ParkGeoData): string {
  // Method 1: Build from geographic data (PREFERRED)
  if (data.continent && data.country && data.city && data.slug) {
    return `/parks/${data.continent}/${data.country}/${data.city}/${data.slug}`;
  }

  // Method 2: Fallback to URL conversion if we have a URL
  if (data.url) {
    const converted = convertApiUrlToFrontendUrl(data.url);
    if (converted !== '#') {
      return converted;
    }
  }

  // Method 3: Failed - return fallback
  console.warn('[buildParkUrl] Incomplete geographic data and no valid URL:', data);
  return '#';
}

/**
 * Build an attraction URL from geographic data
 *
 * This is the PREFERRED method for building attraction URLs as it:
 * 1. Builds from park geographic data + attraction slug (most robust)
 * 2. Falls back to URL conversion if geographic data is incomplete
 * 3. Returns '#' only if both methods fail
 *
 * @param data - Attraction geographic data
 * @returns Clean frontend attraction URL
 *
 * @example
 * ```ts
 * buildAttractionUrlFromGeo({
 *   slug: 'taron',
 *   park: {
 *     continent: 'europe',
 *     country: 'germany',
 *     city: 'bruehl',
 *     slug: 'phantasialand'
 *   }
 * })
 * // Returns: '/parks/europe/germany/bruehl/phantasialand/taron'
 * ```
 */
export function buildAttractionUrlFromGeo(data: AttractionGeoData): string {
  // Method 1: Build from park geographic data (PREFERRED)
  if (data.park) {
    const parkUrl = buildParkUrl(data.park);
    if (parkUrl !== '#') {
      return `${parkUrl}/${data.slug}`;
    }
  }

  // Method 2: Fallback to URL conversion if we have a URL
  if (data.url) {
    const converted = convertApiUrlToFrontendUrl(data.url);
    if (converted !== '#') {
      return converted;
    }
  }

  // Method 3: Failed - return fallback
  console.warn('[buildAttractionUrlFromGeo] Incomplete geographic data and no valid URL:', data);
  return '#';
}
