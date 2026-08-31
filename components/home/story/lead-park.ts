import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';

/** The four slugs every park-scoped widget needs, plus what a sentence can name it. */
export interface LeadPark {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  name: string;
  href: string;
  /** ISO country code, for the flag on the picker. */
  countryCode: string;
}

/**
 * The park the story's live exhibits are drawn from: the first entry of the
 * locale's featured list.
 *
 * The chapters that show real data have to show it for *some* park, and a
 * hard-coded one would be Phantasialand for a reader in Madrid. `FEATURED_PARK_SLUGS`
 * is already the per-locale ranking this site trusts for exactly that question
 * (PortAventura leads `es`, Magic Kingdom leads `en`), so the exhibit follows it
 * rather than introducing a second opinion about which park a locale cares about.
 *
 * Reads the same 24 h-cached `getGeoStructure()` as the featured grid and the
 * shortcut band, so it adds no request. Returns `null` when the geo fetch fails
 * or the list resolves empty — every caller drops its exhibit rather than
 * rendering an empty frame.
 */
export async function getLeadPark(locale: string): Promise<LeadPark | null> {
  return (await getLeadParks(locale))[0] ?? null;
}

/**
 * The locale's featured parks, in order, as candidates for an exhibit.
 *
 * A single lead park is not enough for anything that has to render something
 * today. A park closes for the winter, a park has a maintenance day, a park's
 * catalogue is too thin to have a readable curve — and the answer to any of
 * those is the next park on the same list, not an empty card. The list is the
 * locale's own featured ranking, so the fallback stays regionally sensible
 * without a second thing to curate.
 *
 * Costs no extra request: `getGeoStructure` is the same 24 h-cached fetch the
 * featured grid and the shortcut band already read.
 */
export async function getLeadParks(locale: string): Promise<LeadPark[]> {
  const geoData = await catchNonFatal(getGeoStructure());
  return extractFeaturedParks(geoData, locale)
    .map((park) => {
      // `href` is built by extractFeaturedParks as
      // /parks/<continent>/<country>/<city>/<park>; the city slug is the only
      // one of the four not already a named field.
      const city = park.href.split('/')[4];
      if (!city) return null;
      return {
        continent: park.continentSlug,
        country: park.countrySlug,
        city,
        parkSlug: park.slug,
        name: park.name,
        href: park.href,
        countryCode: park.countryCode,
      };
    })
    .filter((p): p is LeadPark => p !== null);
}

/**
 * The parks the homepage's day-curve picker offers, in order.
 *
 * NOT `FEATURED_PARK_SLUGS`. That list answers "which parks does this locale
 * search for", and for `de` the honest answer is four German parks — which makes
 * a picker that reads like a German directory and, worse, offers nothing open
 * between midnight and nine. This list answers a different question: which parks
 * have a headliner worth drawing, spread across enough of the planet that one of
 * them is always mid-afternoon.
 *
 * Two lists rather than one because the questions differ, and both are curated
 * by hand: an automatic "pick something far away" would land on whichever park
 * the catalogue happens to hold, and most of them have no headliner anybody has
 * heard of.
 *
 * Every slug here is one `FEATURED_PARK_SLUGS` already uses somewhere, so none
 * of them is a new claim about the catalogue — a park that disappears upstream
 * drops out of both.
 */
const CURVE_PARK_SLUGS = [
  'europa-park', // DE — Voltron Nevera
  'phantasialand', // DE — Taron
  'efteling', // NL — Baron 1898
  'disneyland-park', // FR — Paris
  'portaventura-park', // ES — Shambhala
  'gardaland', // IT
  'magic-kingdom-park', // US, Orlando — open while Europe sleeps
  'universal-studios-japan', // JP — open while Orlando sleeps
] as const;

/**
 * Resolve {@link CURVE_PARK_SLUGS} against the geo structure, keeping this
 * list's order rather than the catalogue's.
 *
 * Reads the same 24 h-cached `getGeoStructure()` as the featured grid, so it
 * adds no request. A slug the catalogue no longer has is skipped silently here
 * and warned about by `extractFeaturedParks`, which shares most of them.
 */
export async function getCurveCandidates(locale: string): Promise<LeadPark[]> {
  void locale; // the list is deliberately the same everywhere; see the docblock
  const geoData = await catchNonFatal(getGeoStructure());
  if (!geoData) return [];

  const found = new Map<string, LeadPark>();
  for (const continent of geoData.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (
            !found.has(park.slug) &&
            (CURVE_PARK_SLUGS as readonly string[]).includes(park.slug)
          ) {
            found.set(park.slug, {
              continent: continent.slug,
              country: country.slug,
              city: city.slug,
              parkSlug: park.slug,
              name: park.name,
              href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              countryCode: country.code,
            });
          }
        }
      }
    }
  }

  return CURVE_PARK_SLUGS.map((slug) => found.get(slug)).filter((p): p is LeadPark => p != null);
}
