import type { PlannerGeo } from './types';

/**
 * The four slugs a plan is filed under, read out of a park's own frontend URL.
 *
 * `/api/nearby` answers with a park's `slug`, `name` and `timezone` and with no
 * geography at all — and a plan cannot be filed without the continent, country
 * and city, because that is the shape of every API path it will later fetch. Its
 * `url` is documented as "when provided by API" and in the `in_park` answer it
 * is not provided: checked against the running endpoint, the park object carries
 * twelve fields and none of them is a URL. Each RIDE does carry one
 * (`/v1/parks/<continent>/<country>/<city>/<park>/attractions/<slug>`), which is
 * the same geography by another door.
 *
 * So both shapes are accepted, and the `parks` segment is what anchors the read
 * rather than a fixed offset — which is what `rideFromPath` learned the hard
 * way twice over: a frontend path carries a locale prefix on five of six
 * locales and none on the sixth, and an API path carries a `/v1` instead.
 *
 * `…/parks/<continent>/<country>/<city>/<park>`, with anything after the park
 * (an attraction, a calendar segment) ignored.
 */
export function parkGeoFromUrl(url: string | undefined | null): PlannerGeo | null {
  if (!url) return null;
  // Absolute or relative — `URL` needs a base for the second, and the base is
  // never read because only the path is used.
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
