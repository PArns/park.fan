/**
 * URL conversion utilities
 * Converts backend API URLs to frontend routes
 *
 * IMPORTANT: Always use these utilities when working with URLs from the API.
 * Never manually construct URLs with string manipulation like `.replace('/v1/parks/', '/parks/')`.
 */

/**
 * Convert backend API URL to frontend route
 *
 * This is the primary utility for converting API URLs to frontend routes.
 * Use this whenever you receive a URL from the API response.
 *
 * Examples:
 * - /v1/parks/europe/germany/bruhl/phantasialand → /parks/europe/germany/bruhl/phantasialand
 * - /v1/parks/europe/germany/bruhl/phantasialand/attractions/taron → /parks/europe/germany/bruhl/phantasialand/taron
 * - /v1/shows/... → /parks/...#shows
 * - /v1/restaurants/... → /parks/...#restaurants
 * - /v1/discovery/... → /parks/...
 *
 * @param apiUrl - The API URL to convert (e.g., from attraction.url, park.url, etc.)
 * @returns The converted frontend URL, or '#' if conversion fails
 */
export function convertApiUrlToFrontendUrl(apiUrl: string): string {
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
 * Build show URL from park URL
 * Ensures the URL ends with #shows (replaces existing hash if present)
 */
export function buildShowUrl(parkUrl: string): string {
  const cleanParkUrl = convertApiUrlToFrontendUrl(parkUrl);
  // Remove any existing hash
  const urlWithoutHash = cleanParkUrl.split('#')[0];
  return `${urlWithoutHash}#shows`;
}

/**
 * Build restaurant URL from park URL
 * Ensures the URL ends with #restaurants (replaces existing hash if present)
 */
export function buildRestaurantUrl(parkUrl: string): string {
  const cleanParkUrl = convertApiUrlToFrontendUrl(parkUrl);
  // Remove any existing hash
  const urlWithoutHash = cleanParkUrl.split('#')[0];
  return `${urlWithoutHash}#restaurants`;
}

/**
 * Build attraction URL from park URL and attraction slug
 */
export function buildAttractionUrl(parkUrl: string, attractionSlug: string): string {
  const cleanParkUrl = convertApiUrlToFrontendUrl(parkUrl);
  return `${cleanParkUrl}/${attractionSlug}`;
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
 *   city: 'bruhl',
 *   slug: 'phantasialand'
 * })
 * // Returns: '/parks/europe/germany/bruhl/phantasialand'
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
 *     city: 'bruhl',
 *     slug: 'phantasialand'
 *   }
 * })
 * // Returns: '/parks/europe/germany/bruhl/phantasialand/taron'
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
