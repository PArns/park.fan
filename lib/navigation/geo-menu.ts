import 'server-only';
import { catchNonFatal } from '@/lib/api/client';
import { getContinents } from '@/lib/api/discovery';

/**
 * The geographic spine of the header menu: continents and their countries, and nothing else.
 *
 * WHY THIS TRIMS RATHER THAN PASSING THE PAYLOAD ALONG
 *
 * `/v1/discovery/continents` answers with the whole tree — 5 continents, 23 countries, 144 cities,
 * 212 parks, every park carrying coordinates, a schedule and live analytics. Measured: 168.6 KB
 * raw, 16.8 KB brotli. The header renders on EVERY page, so whatever it holds is serialized into
 * that page's HTML and again into its RSC payload. Trimmed to name/slug/parkCount it is 1.3 KB raw
 * and **420 B brotli**, which is what a sitewide structure is allowed to cost.
 *
 * WHY IT STOPS AT COUNTRIES
 *
 * Not bytes — links. Everything rendered here is a link on ~35,000 pages. 28 hub links concentrate
 * internal weight on the continent and country pages, which is the point. Adding the 144 cities
 * and 212 parks would spread the same weight over 356 further targets that are already reachable
 * from those hubs and from the sitemap; the menu's third pane fetches them on demand instead
 * (`/api/nav/geo/[continent]/[country]`), so they never enter the sitewide link graph.
 *
 * No new request per page: `getContinents()` is served from the Vercel Data Cache under the `geo`
 * tag with the continents TTL, the same entry the discovery pages already read.
 */

export interface GeoMenuCountry {
  slug: string;
  /** Upstream English name — the header localizes it via `geo.countries.<slug>`. */
  name: string;
  /** ISO code, which is what the flag set is keyed by. */
  code: string;
  parkCount: number;
}

export interface GeoMenuContinent {
  slug: string;
  name: string;
  parkCount: number;
  countryCount: number;
  countries: GeoMenuCountry[];
}

/**
 * Continents with their countries, sorted by park count so the regions somebody is most likely to
 * be looking for sit at the top of each column.
 *
 * Never throws: `catchNonFatal` turns an unreachable API into an empty list, and the menu then
 * renders its plain links without the geographic pane. A header is not worth a 500.
 */
export async function getGeoMenu(): Promise<GeoMenuContinent[]> {
  const continents = await catchNonFatal(getContinents()).then((r) => r ?? []);

  return continents
    .map((continent) => ({
      slug: continent.slug,
      name: continent.name,
      parkCount: continent.parkCount,
      countryCount: continent.countryCount,
      countries: (continent.countries ?? [])
        .map((country) => ({
          slug: country.slug,
          name: country.name,
          code: country.code,
          parkCount: country.parkCount,
        }))
        .sort((a, b) => b.parkCount - a.parkCount || a.slug.localeCompare(b.slug)),
    }))
    .filter((continent) => continent.countries.length > 0)
    .sort((a, b) => b.parkCount - a.parkCount || a.slug.localeCompare(b.slug));
}
