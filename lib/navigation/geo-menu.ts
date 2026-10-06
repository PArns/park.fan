import 'server-only';
import { getContinentsOrLastGood, perContinentsDocument } from '@/lib/api/discovery';
import type { Continent } from '@/lib/api/types';

/**
 * The geographic spine of the header menu: continents and their countries, and nothing else.
 * Trimmed to names, slugs and counts, because the header is serialized into every page and the
 * full discovery tree is far heavier. It stops at countries for the link graph: cities and parks
 * would spread sitewide weight over hundreds of targets the hubs already reach, so the menu's
 * third pane fetches them on demand. See
 * docs/rules/the-header-menu-is-three-kinds-of-content-and-the-split-is.md.
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
 * Continents with their countries, sorted by park count. Never throws, not even on a 502: it runs
 * inside `app/[locale]/layout.tsx`, where no `error.tsx` can catch a throw, so an unreachable API
 * gives the last good document this process read, or an empty list and a menu without the
 * geographic pane. Built once per continents document (`perContinentsDocument`).
 */
export async function getGeoMenu(): Promise<GeoMenuContinent[]> {
  const continents = await getContinentsOrLastGood().catch(() => []);
  return buildGeoMenu(continents);
}

const buildGeoMenu = perContinentsDocument((continents: Continent[]): GeoMenuContinent[] =>
  continents
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
    .sort((a, b) => b.parkCount - a.parkCount || a.slug.localeCompare(b.slug))
);
