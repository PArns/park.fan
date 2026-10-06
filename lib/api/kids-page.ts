import { getParkByGeoPath } from '@/lib/api/parks';
import { parksWhere } from '@/lib/api/stats';
import type { ParkGeoPath } from '@/lib/api/stats';
import { hasKidsPage } from '@/lib/parks/kids-page';

/**
 * Does this park have a „with kids" page at all? For the sitemap and links that must know whether
 * the URL exists; reads the park payload from the Data Cache entry the park page already fills. A
 * failure answers `false`, the same asymmetry as `hasParkStatsPage`: a URL missing from one day's
 * sitemap costs a day, one advertised at a 404 costs the file its credibility.
 */
export async function hasParkKidsPage(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<boolean> {
  try {
    const park = await getParkByGeoPath(continent, country, city, parkSlug);
    return park ? hasKidsPage(park.attractions ?? []) : false;
  } catch {
    return false;
  }
}

/** Which of these parks have a "with kids" page, as a set of `parkGeoKey`s. */
export async function parksWithKidsPage(
  parks: readonly ParkGeoPath[]
): Promise<ReadonlySet<string>> {
  return parksWhere(parks, (p) => hasParkKidsPage(p.continent, p.country, p.city, p.parkSlug));
}
