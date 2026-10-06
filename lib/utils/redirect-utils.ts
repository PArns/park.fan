/**
 * Redirects for malformed or stale park URLs: a missing city segment (a park slug where the city
 * goes), and geo segments that went stale after an API re-slug (`bruhl` → `bruehl`).
 */

import { cache } from 'react';
import { getContinentsOrLastGood, perContinentsDocument } from '@/lib/api/discovery';
import type { Continent } from '@/lib/api/types';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';

/**
 * Park-slug → geo-path index for redirect lookups, built once per continents document and falling
 * back to the last good one. Only for malformed-URL redirects, never to serve a valid park. Read
 * from `getContinents()`, which the layout has already parsed for the header menu, rather than a
 * second geo body. Values are lists: slugs are not unique (`disneyland-park` in Paris and
 * Anaheim), so callers disambiguate by continent and country.
 */
const getParkSlugIndex = cache(async (): Promise<Record<string, ParkLookupResult[]>> => {
  try {
    return buildParkSlugIndex(await getContinentsOrLastGood());
  } catch (error) {
    console.error('[RedirectUtils] Failed to fetch continents:', error);
    return {};
  }
});

const buildParkSlugIndex = perContinentsDocument((continents: Continent[]) => {
  const index: Record<string, ParkLookupResult[]> = {};
  for (const continent of continents) {
    for (const country of continent.countries ?? []) {
      for (const city of country.cities ?? []) {
        for (const park of city.parks) {
          (index[park.slug] ??= []).push({
            continent: continent.slug,
            country: country.slug,
            city: city.slug,
            parkSlug: park.slug,
          });
        }
      }
    }
  }
  return index;
});

/** Where a park slug lives in the geo tree. */
export interface ParkLookupResult {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Parks per city, keyed `continent/country/city`, built once per continents document like the
 * park-slug index.
 */
const getCityParkCounts = cache(async (): Promise<Map<string, number>> => {
  try {
    return buildCityParkCounts(await getContinentsOrLastGood());
  } catch (error) {
    console.error('[RedirectUtils] Failed to fetch continents:', error);
    return new Map();
  }
});

const buildCityParkCounts = perContinentsDocument((continents: Continent[]) => {
  const counts = new Map<string, number>();
  for (const continent of continents) {
    for (const country of continent.countries ?? []) {
      for (const city of country.cities ?? []) {
        counts.set(`${continent.slug}/${country.slug}/${city.slug}`, city.parks.length);
      }
    }
  }
  return counts;
});

/**
 * Whether a city answers with a page of its own rather than a 308 to its only park: the rule the
 * city route redirects by and the sitemap lists by (`city.parks.length > 1`). Breadcrumbs ask this
 * so a single-park city's crumb does not link to a redirect. An unknown city keeps its crumb.
 */
export const cityHasOwnPage = cache(
  async (continent: string, country: string, citySlug: string): Promise<boolean> => {
    const count = (await getCityParkCounts()).get(`${continent}/${country}/${citySlug}`);
    return count === undefined || count > 1;
  }
);

/** Every location a park slug exists at: usually one, sometimes more (`disneyland-park`). */
async function findParkLocationsBySlug(parkSlug: string): Promise<ParkLookupResult[]> {
  const index = await getParkSlugIndex();
  return index[parkSlug] ?? [];
}

/**
 * The real URL for a city-page URL whose city segment is a park slug
 * (`/parks/{continent}/{country}/{parkSlug}`), or null.
 */
export const findCityPageRedirect = cache(
  async (continent: string, country: string, citySlug: string): Promise<string | null> => {
    const park = (await findParkLocationsBySlug(citySlug)).find(
      (p) => p.continent === continent && p.country === country
    );

    if (park) {
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }

    return null;
  }
);

/**
 * Redirect for a park-page URL whose city segment holds a park slug: the same lookup as
 * {@link findCityPageRedirect}. The park segment is not read: the discovery data lists no
 * attractions to check it against.
 */
export function findParkPageRedirect(
  continent: string,
  country: string,
  citySlug: string,
  _parkSlug: string
): Promise<string | null> {
  return findCityPageRedirect(continent, country, citySlug);
}

/**
 * The canonical URL for a park whose geo segments went stale (a re-slugged or moved city), keyed
 * by the stable park slug, or null. Duplicate slugs prefer the requested continent and country,
 * then continent; otherwise no redirect rather than a cross-continent bounce.
 *
 * Call it only AFTER the API lookup for the requested path failed: the snapshot is cached for
 * days, and on the happy path a lagging snapshot could bounce a working new URL to a stale one.
 */
export const findRelocatedParkRedirect = cache(
  async (
    continent: string,
    country: string,
    citySlug: string,
    parkSlug: string
  ): Promise<string | null> => {
    const locations = await findParkLocationsBySlug(parkSlug);
    if (locations.length === 0) return null;

    const park =
      locations.find((l) => l.continent === continent && l.country === country) ??
      locations.find((l) => l.continent === continent) ??
      (locations.length === 1 ? locations[0] : null);

    if (
      park &&
      (park.continent !== continent || park.country !== country || park.city !== citySlug)
    ) {
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.parkSlug}`;
    }

    return null;
  }
);

/**
 * Canonical park path for a park the API DID return, when it differs from the requested path, or
 * null. The API answers a renamed park's old path with a 301 that `fetch` follows silently, so
 * without this the park would render under the stale URL too. Compares the park's own `url`, so it
 * covers slug renames, which {@link findRelocatedParkRedirect} cannot see, and geo re-slugs.
 */
export function findRenamedParkRedirect(
  park: { url?: string | null },
  requested: { continent: string; country: string; city: string; parkSlug: string }
): string | null {
  if (!park.url) return null;

  const canonical = convertApiUrlToFrontendUrl(park.url);
  // `'#'` means the URL could not be parsed; never redirect on that.
  if (!canonical.startsWith('/parks/')) return null;

  const requestedPath = `/parks/${requested.continent}/${requested.country}/${requested.city}/${requested.parkSlug}`;
  return canonical === requestedPath ? null : canonical;
}
