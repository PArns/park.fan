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
 * Parses the park a widget fence names, bare (`efteling`) or in the full-path form `ref:` takes
 * (`/parks/europe/france/paris/disneyland-park`), through {@link parseRefKey}. The full form is
 * how a fence picks between the two `disneyland-park`s, since a bare slug resolves
 * last-write-wins. `key` stays the string the post wrote: it is the one value the prefetch and
 * the render pass both hold, and it keeps Paris and Anaheim apart in a post naming both.
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

/**
 * A widget fence's attributes: `key=value` pairs on the fence line (unquoted values keep their
 * spaces up to the next ` key=`), then `key: value` lines inside the fence.
 */
export function parseWidgetAttrs(line: string | undefined, body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const consume = (input: string) => {
    // Unquoted values run until the next ` key=` token or end of line, so a
    // bare `heading=A few moments from the trip` keeps its spaces instead of
    // collapsing to just "A". Quoted values win when present.
    const re =
      /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.+?))(?=\s+[a-zA-Z][a-zA-Z0-9_-]*\s*=|\s*$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      out[m[1]] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    }
  };
  if (line) consume(line);
  // Also accept attrs as `key: value` lines inside the fence.
  for (const ln of body.split(/\r?\n/)) {
    const m = ln.match(/^\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*[:=]\s*(.+?)\s*$/);
    if (m) {
      out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return out;
}
