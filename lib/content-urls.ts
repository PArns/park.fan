import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { getPopularParks } from '@/lib/api/parks';
import { locales } from '@/i18n/config';

/** Variant slugs like "taron-2" are noindex pages — excluded everywhere. */
const VARIANT_SLUG_RE = /^.+-\d+$/;

/**
 * Locale-agnostic content paths, shared by the IndexNow submitter and the
 * cache-prewarm crawler so both always cover the same URL set.
 */

/**
 * Park detail paths (`/parks/<continent>/<country>/<city>/<park>`), ordered
 * most-popular-first so a time-bounded prewarm run covers the highest-traffic
 * parks before the long tail. Popularity ranking is best-effort.
 */
export async function getParkPaths(): Promise<string[]> {
  const geo = await getGeoStructure(86400);
  const parks = geo.continents.flatMap((continent) =>
    continent.countries.flatMap((country) =>
      country.cities.flatMap((city) =>
        city.parks.map((park) => ({
          slug: park.slug,
          path: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
        }))
      )
    )
  );

  const rank = new Map<string, number>();
  try {
    const popular = await getPopularParks(100);
    popular.forEach((p, i) => rank.set(p.slug, i));
  } catch {
    // Ranking is best-effort; fall back to the natural geo order.
  }
  parks.sort((a, b) => (rank.get(a.slug) ?? Infinity) - (rank.get(b.slug) ?? Infinity));

  return parks.map((p) => p.path);
}

/**
 * Attraction detail paths, excluding noindex variant slugs (e.g. "taron-2").
 * Transforms the API url (`/v1/parks/.../attractions/<slug>`) to the frontend path.
 */
export async function getAttractionPaths(): Promise<string[]> {
  const attractions = await getSitemapAttractions();
  const paths: string[] = [];
  for (const attraction of attractions) {
    if (VARIANT_SLUG_RE.test(attraction.slug)) continue;
    paths.push(attraction.url.replace(/^\/v1\/parks\//, '/parks/').replace(/\/attractions\//, '/'));
  }
  return paths;
}

/** Expand locale-agnostic paths into absolute URLs for every locale. */
export function localizedUrls(paths: string[], baseUrl: string): string[] {
  return paths.flatMap((path) => locales.map((locale) => `${baseUrl}/${locale}${path}`));
}
