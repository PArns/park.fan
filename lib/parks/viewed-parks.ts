import type { GeoStructure } from '@/lib/api/types';
import type { MostReadRanking } from '@/lib/blog/most-read-config';

/**
 * The parks this locale's readers open most, from the page-view counter (`kind=park`, keyed by
 * UUID), resolved against the geo structure. One source for every "popular parks" surface: the
 * footer's country columns, the homepage's featured parks, the parks menu's photo rail and the
 * hero's fallback. Each fills up with its hand-picked list where too few parks were read. The
 * same ranking orders a country's park list. See docs/features/most-read.md.
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
  /**
   * Whether the park had published hours today or a next opening when the geo structure was read
   * (`todaySchedule` operating, or a `nextSchedule`). False for an event whose run is over
   * (Traumatica after Halloween) and a park shut for the season with no dates out yet: neither has
   * a day the planner could plan. Absent in a seed written before the field existed.
   */
  hasHoursAhead?: boolean;
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
            hasHoursAhead:
              park.todaySchedule?.scheduleType === 'OPERATING' || park.nextSchedule != null,
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
 * Views a park needs before a country's list places it by them (the country page, the header
 * menu's country pane); below, it keeps the list's own order. The API takes at most ten reads of
 * a page from one address per UTC day, so from eleven no single address on a single day decides
 * the order every reader of the language gets for the next 30 days.
 */
export const PARK_ORDER_MIN_VIEWS = 11;

/**
 * The views, by park id, that may order a country's parks: those of at least
 * {@link PARK_ORDER_MIN_VIEWS}, and where the ranking came back as long as `askedFor`, only those
 * above its last entry, since a park with as many views as the last may lie past the cut.
 */
export function parkOrderViews(ranking: MostReadRanking, askedFor: number): Map<string, number> {
  const cut = ranking.length >= askedFor ? (ranking.at(-1)?.views ?? 0) + 1 : 0;
  const floor = Math.max(PARK_ORDER_MIN_VIEWS, cut);
  return new Map(
    ranking.filter(({ views }) => views >= floor).map(({ key, views }) => [key, views])
  );
}

/**
 * A country's cities in view order: in each city the counted parks by their views, the others
 * after them as they came; the cities by their most viewed park, those without a counted park
 * after them as they came. Equal views keep the input order, so with no views the input comes
 * back unchanged.
 */
export function orderCitiesByViews<C extends { parks: readonly { id: string }[] }>(
  cities: readonly C[],
  views: ReadonlyMap<string, number>
): C[] {
  const viewsOf = (park: { id: string }) => views.get(park.id) ?? 0;
  return cities
    .map((city) => {
      const parks = [...city.parks].sort((a, b) => viewsOf(b) - viewsOf(a));
      return { city: { ...city, parks }, lead: parks[0] ? viewsOf(parks[0]) : 0 };
    })
    .sort((a, b) => b.lead - a.lead)
    .map(({ city }) => city);
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
