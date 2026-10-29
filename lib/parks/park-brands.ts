import { stripNewPrefix } from '@/lib/utils';
import type { City, GeoStructure, ParkReference } from '@/lib/api/types';

/**
 * A park chain with an overview page of its own, found by the name its parks carry. The API knows
 * no operator, so membership is the name and nothing else: La Ronde belongs to Six Flags and is not
 * on the page, which is what a hand-kept list would get wrong the day a park is sold.
 */
export interface ParkBrand {
  /** The page's path segment under `/parks`. */
  slug: 'six-flags';
  /** How the brand is written, also where it starts each park's name. */
  name: string;
}

/** Six Flags, the one brand with a page so far. */
export const SIX_FLAGS: ParkBrand = { slug: 'six-flags', name: 'Six Flags' };

/** Whether a park's name puts it under the brand: „Six Flags Great Adventure", not „Flags Park". */
export function isBrandPark(brand: ParkBrand, parkName: string): boolean {
  return stripNewPrefix(parkName).toLowerCase().startsWith(`${brand.name.toLowerCase()} `);
}

/** The brand a park belongs to by its name, or null. */
export function parkBrandOf(parkName: string): ParkBrand | null {
  return isBrandPark(SIX_FLAGS, parkName) ? SIX_FLAGS : null;
}

/** One country's parks of a brand, with the slugs a park URL and a live request need. */
export interface BrandCountry {
  continentSlug: string;
  countrySlug: string;
  /** The API's name for the country; pages translate it by slug. */
  countryName: string;
  parks: { park: ParkReference; city: City }[];
}

/**
 * A brand's parks from the geo tree, grouped by country: the country with the most parks first,
 * parks by the name the page shows within it. Read from the same day-cached `/v1/discovery/geo` the geo pages use.
 */
export function brandParksByCountry(geo: GeoStructure, brand: ParkBrand): BrandCountry[] {
  const countries: BrandCountry[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      const parks = country.cities.flatMap((city) =>
        city.parks.filter((park) => isBrandPark(brand, park.name)).map((park) => ({ park, city }))
      );
      if (parks.length === 0) continue;
      parks.sort((a, b) => stripNewPrefix(a.park.name).localeCompare(stripNewPrefix(b.park.name)));
      countries.push({
        continentSlug: continent.slug,
        countrySlug: country.slug,
        countryName: country.name,
        parks,
      });
    }
  }
  return countries.sort(
    (a, b) => b.parks.length - a.parks.length || a.countryName.localeCompare(b.countryName)
  );
}
