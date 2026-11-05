import { getParkByGeoPath } from '@/lib/api/parks';
import { parksWhere } from '@/lib/api/stats';
import type { ParkGeoPath } from '@/lib/api/stats';
import { hasKidsPage } from '@/lib/parks/kids-page';

/**
 * Which of these parks have a "with kids" page, as a set of `parkGeoKey`s. A failed probe throws,
 * for the reason `parksWithStatsPage` gives: one outage must not empty the sitemap's class.
 */
export async function parksWithKidsPage(
  parks: readonly ParkGeoPath[]
): Promise<ReadonlySet<string>> {
  return parksWhere(parks, async (p) => {
    const park = await getParkByGeoPath(p.continent, p.country, p.city, p.parkSlug);
    return park ? hasKidsPage(park.attractions ?? []) : false;
  });
}
