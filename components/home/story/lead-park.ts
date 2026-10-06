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
 * The park the story's live exhibits are drawn from: the first entry of the locale's featured
 * list, the per-locale ranking this site already trusts, so a reader in Madrid does not get
 * Phantasialand. Reads the same 24 h-cached `getGeoStructure()` as the featured grid, so it adds no
 * request. `null` when the geo fetch fails or the list is empty; callers then drop their exhibit.
 */
export async function getLeadPark(locale: string): Promise<LeadPark | null> {
  return (await getLeadParks(locale))[0] ?? null;
}

/**
 * The locale's featured parks, in order, as candidates for an exhibit: a park closed for the
 * winter or for a maintenance day hands over to the next one on the same list. No extra request,
 * since `getGeoStructure` is the same cached fetch.
 */
async function getLeadParks(locale: string): Promise<LeadPark[]> {
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
 * The parks the homepage's day-curve picker offers, in order. Not `FEATURED_PARK_SLUGS`, which
 * answers what a locale searches for (for `de`, four German parks with nothing open at night);
 * this list holds parks with a headliner worth drawing, spread so one is always mid-afternoon.
 * Curated by hand, and every slug is one `FEATURED_PARK_SLUGS` already uses.
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
  return resolveParkSlugs(CURVE_PARK_SLUGS);
}

/**
 * The parks the homepage's "with kids" chapter names, in order. Curated rather than the featured
 * ranking, because for `en` that list holds no park that clears the page's gate
 * (`KIDS_PAGE_GATE`). Only parks that clear it with room to spare, since one that slips under turns
 * the link into a 404; re-measure before adding a park.
 */
const KIDS_ENTRY_SLUGS = ['phantasialand', 'europa-park', 'parc-asterix'] as const;

/** {@link KIDS_ENTRY_SLUGS} resolved against the 24 h-cached geo structure, in this list's order. */
export async function getKidsEntryParks(): Promise<LeadPark[]> {
  return resolveParkSlugs(KIDS_ENTRY_SLUGS);
}

/** Resolves a curated slug list against the geo structure, in the list's order. */
async function resolveParkSlugs(slugs: readonly string[]): Promise<LeadPark[]> {
  const geoData = await catchNonFatal(getGeoStructure());
  if (!geoData) return [];

  const found = new Map<string, LeadPark>();
  for (const continent of geoData.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (!found.has(park.slug) && slugs.includes(park.slug)) {
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

  return slugs.map((slug) => found.get(slug)).filter((p): p is LeadPark => p != null);
}
