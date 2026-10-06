import 'server-only';
import { getGeoStructure } from '@/lib/api/discovery';
import { compareKey, type CompareRef } from '@/lib/compare/selection';
import type { ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';

export interface ResolvedCompare {
  parks: ComparisonPark[];
  /** Slugs that more than one park carries — the picker writes those in the long form. */
  ambiguousSlugs: string[];
}

/**
 * Turn the references in the URL into the rows the comparison card takes.
 *
 * The geo tree is the same document the header reads, so this costs no request of its own. A
 * reference that names no park is dropped; the page shows the others. A bare slug that two parks
 * share resolves to the first one in tree order — only the long form is exact, and that is what
 * the picker writes for such a slug.
 */
export async function resolveCompareParks(refs: readonly CompareRef[]): Promise<ResolvedCompare> {
  const byPath = new Map<string, ComparisonPark>();
  const bySlug = new Map<string, ComparisonPark>();
  const seenSlugs = new Set<string>();
  const ambiguous = new Set<string>();

  try {
    const geo = await getGeoStructure();
    for (const continent of geo.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            const row: ComparisonPark = {
              slug: compareKey({
                continent: continent.slug,
                country: country.slug,
                city: city.slug,
                parkSlug: park.slug,
              }),
              name: park.name,
              href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              continent: continent.slug,
              country: country.slug,
              city: city.slug,
              parkSlug: park.slug,
            };
            byPath.set(row.slug, row);
            if (seenSlugs.has(park.slug)) ambiguous.add(park.slug);
            else bySlug.set(park.slug, row);
            seenSlugs.add(park.slug);
          }
        }
      }
    }
  } catch {
    // No geo tree: an empty selection and the picker, which does not need it.
  }

  const parks: ComparisonPark[] = [];
  for (const ref of refs) {
    const row = ref.geoPath ? byPath.get(`${ref.geoPath}/${ref.slug}`) : bySlug.get(ref.slug);
    if (row && !parks.some((p) => p.slug === row.slug)) parks.push(row);
  }
  return { parks, ambiguousSlugs: [...ambiguous] };
}
