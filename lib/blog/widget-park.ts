import { parseRefKey } from './derive.mjs';
import type { ResolvedPark } from './park-resolver';

export interface ParkGeoPath {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Derive the API geo-path segments from a ResolvedPark.href, which has the
 * shape `/parks/{continent}/{country}/{city}/{park}`. Returns null when the
 * href doesn't have all four segments (e.g. geo data was unavailable).
 */
export function parkGeoPath(park: ResolvedPark): ParkGeoPath | null {
  const [, continent, country, city, parkSlug] = park.href.split('/').filter(Boolean);
  if (!continent || !country || !city || !parkSlug) return null;
  return { continent, country, city, parkSlug };
}

/** A park named in a widget fence, split into what `resolvePark` needs. */
export interface WidgetParkRef {
  /** The value exactly as the post wrote it. The key every widget map is read back by. */
  key: string;
  /** The bare park slug. */
  slug: string;
  /** `continent/country/city`, present only for the long form. */
  geoPath?: string;
}

/**
 * Parse the park a widget fence names, in the bare form (`efteling`) or in the full-path form
 * `ref:` already takes (`/parks/europe/france/paris/disneyland-park`).
 *
 * **A bare park slug is not unique**, and exactly one collision exists in the catalogue today:
 * `disneyland-park` is Paris AND Anaheim. `parksBySlug` in the resolver is last-write-wins over
 * the geo iteration order, so Anaheim overwrites Paris — a `stats-widget slug=disneyland-park`
 * in a German post about Paris rendered Californian numbers, with no error and nothing in the
 * output to notice it by. Inline `ref:` links have been able to say which park they mean since
 * the resolver got its `geoPath` argument; the fences never learned the same form.
 *
 * Normalisation is {@link parseRefKey}'s, not a second copy of it, so a post can write one form
 * for both a link and a fence.
 *
 * `key` stays the string the post wrote. The prefetch and the render pass have to agree on what
 * they store and look up the resolved park by, and the written value is the one thing both hold —
 * keying by the normalised slug instead would also collapse Paris and Anaheim back into one entry
 * for a post that names both.
 */
export function parseWidgetParkRef(raw: string): WidgetParkRef | null {
  const key = raw.trim();
  if (!key) return null;
  const parsed = parseRefKey(key);
  // A `/parks/…` value with a ride segment is not a park reference; anything else falls through
  // to the bare slug, so a typo degrades to today's behaviour rather than resolving to nothing.
  if (parsed.kind === 'park') {
    return parsed.geoPath
      ? { key, slug: parsed.key, geoPath: parsed.geoPath }
      : { key, slug: parsed.key };
  }
  return { key, slug: key };
}

/**
 * Split a `rides=` entry's reference into the park it names and the ride, accepting the same two
 * park forms as {@link parseWidgetParkRef}: `efteling/joris-en-de-draak` or
 * `/parks/europe/france/paris/disneyland-park/peter-pans-flight`.
 *
 * `parkKey` is what the entry wrote for the park, so it matches the key the prefetch stored.
 */
export function parseWidgetRideRef(raw: string): { parkKey: string; rideSlug: string } | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('/parks/')) {
    const parts = value.slice('/parks/'.length).split('/').filter(Boolean);
    if (parts.length < 5) return null;
    return { parkKey: `/parks/${parts.slice(0, 4).join('/')}`, rideSlug: parts[4] };
  }
  const parts = value.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  return { parkKey: parts[0], rideSlug: parts[1] };
}
