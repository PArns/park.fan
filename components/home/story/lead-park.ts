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
      };
    })
    .filter((p): p is LeadPark => p !== null);
}
