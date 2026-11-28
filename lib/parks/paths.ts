/** The four URL segments that name a park: the geo path and the park's own slug. */
export interface ParkPathParts {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Locale-relative path of a park's page, `/parks/<continent>/<country>/<city>/<park>`. Every
 * sub-page, ride page and relay URL of the park hangs below it, so the order of the segments is
 * written here once.
 */
export function parkPagePath({ continent, country, city, parkSlug }: ParkPathParts): string {
  return `/parks/${continent}/${country}/${city}/${parkSlug}`;
}

/**
 * URL of the site's own relay for a park, `/api/parks/<geo>/<park>` plus `suffix` (a sub-resource
 * and its query, starting with `/` or `?`). The relay mirrors the page path, which is what lets a
 * client hook build its URL from the route's own parameters.
 */
export function parkRelayUrl(parts: ParkPathParts, suffix = ''): string {
  return `/api${parkPagePath(parts)}${suffix}`;
}
