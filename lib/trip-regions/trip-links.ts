import { foldText } from '@/lib/utils/text-fold';
import { shortGroupName } from './hub-data';
import { tripRegionPath } from './paths';
import { plannerHrefOn, type TripPlannerHrefInput } from './plan-query';
import { liveTripRegion } from './registry';
import type { TripRegion } from './types';

/**
 * What a page outside a trip region's hub needs to link into its planner: the region's parks and
 * the names a search knows it by; the hub's address follows from the slug and the reader's locale
 * (`tripRegionPath`). Built from the API's region route, so no page holds a list of slugs, and
 * small enough for the browser (`/api/nav/trip-regions`). Pure and client-safe;
 * `pnpm test:orlando-plan` covers it.
 */

/** A park of a trip region, as a link names it. */
export interface TripRegionLinkPark {
  id: string;
  slug: string;
  name: string;
  /** The park's page, locale-free: `/parks/north-america/united-states/orlando/epcot`. */
  path: string;
}

/** One trip region, reduced to what its links need. */
export interface TripRegionLinks {
  /** The registry's slug, whose hub (`tripRegionPath`) holds the planner as chapter 03. */
  slug: string;
  name: string;
  /** The region's name and each resort's without "Resort": what a search matches it by. */
  names: string[];
  parks: TripRegionLinkPark[];
}

/**
 * A region answer reduced to its links, or `null` for a region the registry does not list as live
 * (one the API curates before its hub exists), whose links would lead nowhere.
 */
export function tripRegionLinks(
  region: Pick<TripRegion, 'slug' | 'name' | 'groups' | 'parks'>
): TripRegionLinks | null {
  if (!liveTripRegion(region.slug)) return null;
  const resorts = region.groups
    .filter((group) => group.kind === 'resort')
    .map((group) => shortGroupName(group.name));
  return {
    slug: region.slug,
    name: region.name,
    names: [region.name, ...resorts],
    parks: region.parks.map(({ id, slug, name, path }) => ({ id, slug, name, path })),
  };
}

/**
 * The region's parks among `keys`, each a park's UUID or its locale-free path, in the region's
 * order and each once.
 */
export function regionParksOf(
  region: Pick<TripRegionLinks, 'parks'>,
  keys: Iterable<string>
): TripRegionLinkPark[] {
  const wanted = new Set(keys);
  return region.parks.filter((park) => wanted.has(park.id) || wanted.has(park.path));
}

/** The first region that holds one of `keys`, with the parks it holds, or `null`. */
export function findTripRegion(
  regions: readonly TripRegionLinks[],
  keys: Iterable<string>
): { region: TripRegionLinks; parks: TripRegionLinkPark[] } | null {
  const list = [...keys];
  for (const region of regions) {
    const parks = regionParksOf(region, list);
    if (parks.length > 0) return { region, parks };
  }
  return null;
}

/**
 * The locale-relative address of a region's planner on a state, for `Link` from
 * `@/i18n/navigation`. Without a state it is the bare chapter (`/orlando#planner`).
 */
export function tripPlannerHref(
  region: string,
  locale: string,
  input: TripPlannerHrefInput = {}
): string {
  return plannerHrefOn(tripRegionPath(region, locale), input);
}

const words = (text: string): string[] =>
  foldText(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** A query word against a name word; only the last query word may still be being typed. */
const wordHits = (query: string, name: string, last: boolean): boolean =>
  query === name || (last && query.length >= 3 && name.startsWith(query));

/**
 * The region a search query names, or `null`. A query names a region when one of its words is the
 * region's name ("orlando", or "orl" while typing), or when two words or more run along a resort's
 * name ("disney world", "universal orlando"). One word of a resort is not enough: "universal" and
 * "disney" are just as much Japan and Paris.
 */
export function matchTripRegion(
  query: string,
  regions: readonly TripRegionLinks[]
): TripRegionLinks | null {
  const q = words(query);
  if (q.length === 0 || q.join('').length < 3) return null;
  for (const region of regions) {
    const [own, ...resorts] = region.names.map(words);
    if (q.some((word, i) => own.some((name) => wordHits(word, name, i === q.length - 1)))) {
      return region;
    }
    for (const name of resorts) {
      if (q.length < 2 && q.length < name.length) continue;
      for (let start = 0; start + q.length <= name.length; start += 1) {
        if (q.every((word, i) => wordHits(word, name[start + i], i === q.length - 1))) {
          return region;
        }
      }
    }
  }
  return null;
}
