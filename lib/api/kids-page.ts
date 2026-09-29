import { getParkByGeoPath } from '@/lib/api/parks';
import { parksWhere } from '@/lib/api/stats';
import type { ParkGeoPath } from '@/lib/api/stats';
import { hasKidsPage } from '@/lib/parks/kids-page';

/**
 * Does this park have a "with kids" page at all?
 *
 * The page holds the whole park payload and reads the gate off it. This is for the places that
 * must know whether the URL EXISTS without rendering it: the sitemap and anything that links
 * there. It goes through `getParkByGeoPath`, whose Data Cache entry (1 day) is the one the park
 * page, the record page and the calendar already read, so asking costs no upstream call the
 * site did not make anyway.
 *
 * **A failure answers `false`**, the same asymmetry as `hasParkStatsPage`: a URL left out of one
 * day's sitemap costs a day of discovery, one advertised at a 404 costs the file its credibility.
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
