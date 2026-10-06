/**
 * Converts backend API URLs to frontend routes. Always go through these helpers with a URL from
 * the API, never string surgery like `.replace('/v1/parks/', '/parks/')`.
 */

import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import type { Locale } from '@/i18n/config';
import type { SearchResultItem } from '@/lib/api/types';

/**
 * Convert a backend API URL to a frontend route, or `'#'` when it cannot be converted.
 *
 * - /v1/parks/europe/germany/bruehl/phantasialand/attractions/taron → /parks/europe/germany/bruehl/phantasialand/taron
 * - /v1/parks/…/shows/<slug> and …/restaurants/<slug> → the park page (they live in its tabs)
 * - /v1/shows/<id> and /v1/restaurants/<id> name no park → '#'
 */
export function convertApiUrlToFrontendUrl(apiUrl: string | null | undefined): string {
  if (!apiUrl) return '#';

  if (apiUrl.startsWith('/v1/parks/')) {
    let url = apiUrl.replace('/v1/parks/', '/parks/');

    // Attractions are direct children of the park.
    url = url.replace('/attractions/', '/');

    // Shows and restaurants have no page of their own: drop the segment and its slug.
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

  if (apiUrl.startsWith('/v1/shows/')) {
    // Names no park; the caller has to build the URL from park context.
    return '#';
  }

  if (apiUrl.startsWith('/v1/restaurants/')) {
    return '#';
  }

  // Already a frontend URL: same clean-up.
  if (apiUrl.startsWith('/parks/')) {
    let url = apiUrl;

    url = url.replace('/attractions/', '/');

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

/** Extract the parent park's page URL from an attraction URL (API or frontend), or `'#'`. */
export function getParkUrlFromAttractionUrl(attractionUrl: string): string {
  if (!attractionUrl) return '#';
  if (attractionUrl.includes('/attractions/')) {
    const parkPart = attractionUrl.split('/attractions/')[0];
    return convertApiUrlToFrontendUrl(parkPart);
  }
  return convertApiUrlToFrontendUrl(attractionUrl);
}

/**
 * The park-page tab a show or restaurant lives under: `/parks/…#shows` or `/parks/…#restaurants`.
 * `null` for a bare `/v1/shows/<id>` that names no park, so each caller picks its own fallback
 * rather than linking to `#shows` on whatever page it is on.
 */
export function parkChapterUrl(
  url: string | null | undefined,
  chapter: 'shows' | 'restaurants'
): string | null {
  const parkUrl = convertApiUrlToFrontendUrl(url);
  return parkUrl.startsWith('/parks/') ? `${parkUrl.split('#')[0]}#${chapter}` : null;
}

/** Build an attraction URL from a park URL and the attraction's slug. */
export function buildAttractionUrl(parkUrl: string, attractionSlug: string): string {
  let cleanParkUrl = convertApiUrlToFrontendUrl(parkUrl);

  if (cleanParkUrl.endsWith('/')) {
    cleanParkUrl = cleanParkUrl.slice(0, -1);
  }

  return `${cleanParkUrl}/${attractionSlug}`;
}

/**
 * Where a search result links to, the one answer for the palette, the hero's dropdown and
 * `/search`. Locale-less like every path the i18n `Link` takes (the locale only picks the
 * glossary's segment). `null` when the result names nowhere, so a surface can refuse the click
 * instead of sending the visitor to „/" or a bare `#`.
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

/** Geographic data for building a park URL; `url` is the fallback when it is incomplete. */
export interface ParkGeoData {
  continent?: string | null;
  country?: string | null;
  city?: string | null;
  slug: string;
  url?: string | null;
}

/** Geographic data for building an attraction URL. */
export interface AttractionGeoData {
  slug: string;
  url?: string | null;
  park?: ParkGeoData;
}

/**
 * Build a park URL from geographic data, the preferred way to link a park. Falls back to
 * converting `url` when the geo path is incomplete, and returns `'#'` (with a warning) if both
 * fail.
 */
export function buildParkUrl(data: ParkGeoData): string {
  if (data.continent && data.country && data.city && data.slug) {
    return `/parks/${data.continent}/${data.country}/${data.city}/${data.slug}`;
  }

  if (data.url) {
    const converted = convertApiUrlToFrontendUrl(data.url);
    if (converted !== '#') {
      return converted;
    }
  }

  console.warn('[buildParkUrl] Incomplete geographic data and no valid URL:', data);
  return '#';
}

/**
 * Build an attraction URL from its park's geographic data and its slug, falling back to `url` and
 * then `'#'` like {@link buildParkUrl}.
 */
export function buildAttractionUrlFromGeo(data: AttractionGeoData): string {
  if (data.park) {
    const parkUrl = buildParkUrl(data.park);
    if (parkUrl !== '#') {
      return `${parkUrl}/${data.slug}`;
    }
  }

  if (data.url) {
    const converted = convertApiUrlToFrontendUrl(data.url);
    if (converted !== '#') {
      return converted;
    }
  }

  console.warn('[buildAttractionUrlFromGeo] Incomplete geographic data and no valid URL:', data);
  return '#';
}
