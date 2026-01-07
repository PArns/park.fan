/**
 * URL conversion utilities
 * Converts backend API URLs to frontend routes
 */

/**
 * Convert backend API URL to frontend route
 *
 * Examples:
 * - /v1/parks/europe/germany/bruhl/phantasialand → /parks/europe/germany/bruhl/phantasialand
 * - /v1/parks/europe/germany/bruhl/phantasialand/attractions/taron → /parks/europe/germany/bruhl/phantasialand/taron
 * - /v1/shows/... → /parks/...#shows
 * - /v1/restaurants/... → /parks/...#restaurants
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
