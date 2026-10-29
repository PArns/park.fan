import { stripNewPrefix } from '@/lib/utils';
import type { City, GeoStructure, ParkReference } from '@/lib/api/types';

/**
 * A park chain with an overview page of its own, found by the name its parks carry. The API knows
 * no operator, so membership is the name and nothing else: La Ronde belongs to Six Flags and is not
 * on the page, which is what a hand-kept list would get wrong the day a park is sold.
 */
export interface ParkBrand {
  /** The page's path segment under `/parks`; each has its own page folder there. */
  slug: 'six-flags' | 'universal';
  /** The message namespace of its page: German compounds differ per brand ("Six-Flags-Parks"). */
  namespace: 'sixFlags' | 'universal';
  /** How the brand is written. */
  name: string;
  /**
   * The words a park's name starts with when it is the brand's, in the order the page lists them.
   * Six Flags' water parks are "Six Flags Hurricane Harbor" in full and in the catalog only
   * "Hurricane Harbor".
   */
  names: readonly string[];
}

/** Six Flags, with its Hurricane Harbor water parks. */
export const SIX_FLAGS: ParkBrand = {
  slug: 'six-flags',
  namespace: 'sixFlags',
  name: 'Six Flags',
  names: ['Six Flags', 'Hurricane Harbor'],
};

/** Universal: Hollywood, the four Orlando parks (Volcano Bay included) and the three in Asia. */
export const UNIVERSAL: ParkBrand = {
  slug: 'universal',
  namespace: 'universal',
  name: 'Universal',
  names: ['Universal'],
};

/** Every brand with a page, for the sitemap, the content-change crawl and the park page's link. */
export const PARK_BRANDS: readonly ParkBrand[] = [SIX_FLAGS, UNIVERSAL];

/** Which of `brand.names` a park's name starts with, as its index, or -1. */
function brandNameIndex(brand: ParkBrand, parkName: string): number {
  const name = stripNewPrefix(parkName).toLowerCase();
  return brand.names.findIndex((brandName) => {
    const prefix = brandName.toLowerCase();
    return name === prefix || name.startsWith(`${prefix} `);
  });
}

/** Whether a park's name puts it under the brand: "Six Flags Great Adventure", not "Flags Park". */
export function isBrandPark(brand: ParkBrand, parkName: string): boolean {
  return brandNameIndex(brand, parkName) >= 0;
}

/** The brand a park belongs to by its name, or null. */
export function parkBrandOf(parkName: string): ParkBrand | null {
  return PARK_BRANDS.find((brand) => isBrandPark(brand, parkName)) ?? null;
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
 * within it the parks in the order of `brand.names` (theme parks before water parks), then by the
 * name the page shows. Read from the same day-cached `/v1/discovery/geo` the geo pages use.
 */
export function brandParksByCountry(geo: GeoStructure, brand: ParkBrand): BrandCountry[] {
  const countries: BrandCountry[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      const ranked = country.cities.flatMap((city) =>
        city.parks.flatMap((park) => {
          const rank = brandNameIndex(brand, park.name);
          return rank < 0 ? [] : [{ park, city, rank, shown: stripNewPrefix(park.name) }];
        })
      );
      if (ranked.length === 0) continue;
      ranked.sort((a, b) => a.rank - b.rank || a.shown.localeCompare(b.shown));
      countries.push({
        continentSlug: continent.slug,
        countrySlug: country.slug,
        countryName: country.name,
        parks: ranked.map(({ park, city }) => ({ park, city })),
      });
    }
  }
  return countries.sort(
    (a, b) => b.parks.length - a.parks.length || a.countryName.localeCompare(b.countryName)
  );
}
