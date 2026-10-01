import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { getPopularParks } from '@/lib/api/parks';
import { locales } from '@/i18n/config';

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
  const geo = await getGeoStructure(CACHE_TTL.geoSitemap);
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
 * Attraction detail paths, one per `/v1/sitemap/attractions` entry. Transforms the
 * API url (`/v1/parks/.../attractions/<slug>`) to the frontend path.
 *
 * No variant-slug filter here. The attraction page marks a numbered-suffix slug
 * noindex only when the base slug in the same park carries the same name, and this
 * list has no names to check that (the endpoint answers `{url, slug}`). It does not
 * need them: since PAR-498 the backend lists exactly one row per attraction name,
 * the row the park payload serves, so a same-name duplicate never reaches this
 * list. What does reach it with a base slug beside it is a different ride
 * ("Main Train 2" next to "Main Train"), and filtering by slug dropped those pages.
 */
export async function getAttractionPaths(): Promise<string[]> {
  const attractions = await getSitemapAttractions();
  return attractions.map((attraction) =>
    attraction.url.replace(/^\/v1\/parks\//, '/parks/').replace(/\/attractions\//, '/')
  );
}

/** Expand locale-agnostic paths into absolute URLs for every locale. */
export function localizedUrls(paths: string[], baseUrl: string): string[] {
  return paths.flatMap((path) => locales.map((locale) => `${baseUrl}/${locale}${path}`));
}
