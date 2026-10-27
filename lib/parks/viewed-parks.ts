import type { GeoStructure } from '@/lib/api/types';
import type { MostReadRanking } from '@/lib/blog/most-read-config';

/**
 * The parks this locale's readers open most, from the page-view counter (`kind=park`, keyed by
 * UUID), resolved against the geo structure. One source for every "popular parks" surface: the
 * footer's country columns, the homepage's featured parks, the parks menu's photo rail and the
 * hero's fallback. Each fills up with its hand-picked list where too few parks were read. See
 * docs/features/most-read.md.
 */

/** The window the park ranking sums over, in UTC days with today included. */
export const VIEWED_PARKS_DAYS = 30;

/** Views a park needs in that window to count as popular: below it one reader would decide. */
export const VIEWED_PARK_MIN_VIEWS = 3;

/**
 * The parks asked of the API per locale, its most. A country column in the footer takes the
 * country's parks among them, so the cut has to reach past the few parks every language reads.
 */
export const VIEWED_PARKS_ASK_FOR = 50;

/** A park as the popular-parks surfaces need it, with its views in the window. */
export interface ViewedPark {
  id: string;
  name: string;
  slug: string;
  /** Locale-less page path, `/parks/<continent>/<country>/<city>/<park>`. */
  href: string;
  city: string;
  countrySlug: string;
  countryName: string;
  countryCode: string;
  continentSlug: string;
  continentName: string;
  views: number;
}

/**
 * Every park of the geo structure by UUID, in the structure's order (continents, then countries,
 * cities and parks as the API lists them), with the fields the popular-parks surfaces draw.
 */
export function geoParks(geo: GeoStructure): Map<string, Omit<ViewedPark, 'views'>> {
  const byId = new Map<string, Omit<ViewedPark, 'views'>>();
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          byId.set(park.id, {
            id: park.id,
            name: park.name,
            slug: park.slug,
            href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
            city: city.name,
            countrySlug: country.slug,
            countryName: country.name,
            countryCode: country.code,
            continentSlug: continent.slug,
            continentName: continent.name,
          });
        }
      }
    }
  }
  return byId;
}

/**
 * The ranked parks the geo structure knows, most viewed first, without those under
 * {@link VIEWED_PARK_MIN_VIEWS}. A key that is no park of the structure (a park since merged or
 * removed) is dropped.
 */
export function resolveViewedParks(ranking: MostReadRanking, geo: GeoStructure): ViewedPark[] {
  const byId = geoParks(geo);
  return ranking.flatMap(({ key, views }) => {
    const park = byId.get(key);
    return park && views >= VIEWED_PARK_MIN_VIEWS ? [{ ...park, views }] : [];
  });
}

/**
 * `ranked` first, then `fallback` without what `ranked` already holds, cut to `count`: how a
 * popular-parks surface puts the counted parks ahead of its hand-picked list and keeps its length
 * when few parks were read.
 */
export function rankedFirst<T>(
  ranked: readonly T[],
  fallback: readonly T[],
  keyOf: (item: T) => string,
  count: number
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...ranked, ...fallback]) {
    if (out.length === count) break;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
