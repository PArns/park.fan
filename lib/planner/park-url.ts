import type { PlannerGeo } from './types';

/**
 * The four slugs a plan is filed under, read out of a park's URL. `/api/nearby`'s `in_park` park
 * has no URL and no geography, but each of its rides has an API URL with the same geography, so
 * both a frontend and an API path are accepted, anchored on the `parks` segment since a locale
 * prefix or `/v1` shifts every offset.
 *
 * `…/parks/<continent>/<country>/<city>/<park>`, with anything after the park ignored.
 */
export function parkGeoFromUrl(url: string | undefined | null): PlannerGeo | null {
  if (!url) return null;
  // Absolute or relative: `URL` needs a base for the second, and only the path is read.
  let path: string;
  try {
    path = new URL(url, 'https://park.fan').pathname;
  } catch {
    return null;
  }
  const parts = path.split('/').filter(Boolean);
  const parksAt = parts.indexOf('parks');
  if (parksAt === -1) return null;
  const [continent, country, city] = parts.slice(parksAt + 1);
  if (!continent || !country || !city) return null;
  return { continent, country, city };
}
