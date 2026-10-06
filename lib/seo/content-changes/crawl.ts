import 'server-only';
import { getGeoStructure } from '@/lib/api/discovery';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { getParkByGeoPathFresh } from '@/lib/api/parks';
import { getAttractionPaths } from '@/lib/content-urls';
import { getParkImages, getRideImages } from '@/lib/media';
import { getPostsForPark, getPostsForRide } from '@/lib/blog/backlinks';
import type { MediaImage } from '@/lib/media/types';
import type { Locale } from '@/i18n/config';
import { fingerprintAttraction, fingerprintGeoHub, fingerprintPark } from './fingerprint';
import type { EntityContext } from './fingerprint';

/**
 * One daily pass over the catalog (`/api/cron/content-changes`), producing the fingerprint of
 * every URL a sitemap gives a `<lastmod>`. It reads `getParkByGeoPathFresh`, because the cached
 * variant would report its own lag as tomorrow's change. A park that does not answer is named in
 * `failedParkPaths`, so `diffSnapshot` holds its existing dates instead of reading a timeout as a
 * deletion. Which rides count is decided by `getAttractionPaths()`, the sitemap's own list, so the
 * crawl covers exactly the URLs a sitemap lists. See
 * docs/rules/a-lastmod-is-observed-never-stamped.md.
 */

/** Blog backlinks are locale-scoped; the fingerprint is not. */
const BACKLINK_LOCALE: Locale = 'de';

const CONCURRENCY = 8;

export interface CrawlResult {
  fingerprints: Map<string, string>;
  /**
   * Park path → `scheduleCoverage.to`, the last date the API holds a park-level OPERATING row for,
   * for the calendar sitemap, which would otherwise repeat every park fetch. `null` means no
   * answer, and the reader must not shorten anything on it.
   */
  scheduleCoverage: Map<string, string | null>;
  /** `/parks/<continent>/<country>/<city>/<park>` for every park the API did not answer for. */
  failedParkPaths: string[];
  parksCovered: number;
  attractionsCovered: number;
}

function mediaVersions(images: MediaImage[]): string[] {
  return images.map((image) => `${image.id}@${image.version}`);
}

/**
 * The photos the park page itself carries: background, hero and gallery, but not the ride cards,
 * which belong to the ride pages.
 */
function parkContext(parkSlug: string, geoPath: string): EntityContext {
  const images = getParkImages(parkSlug).filter((image) => !image.ride);
  return {
    mediaVersions: mediaVersions(images),
    postKeys: getPostsForPark(BACKLINK_LOCALE, parkSlug, { geoPath }).map((p) => p.translationKey),
  };
}

function attractionContext(parkSlug: string, rideSlug: string, geoPath: string): EntityContext {
  return {
    mediaVersions: mediaVersions(getRideImages(parkSlug, rideSlug)),
    postKeys: getPostsForRide(BACKLINK_LOCALE, parkSlug, rideSlug, { geoPath }).map(
      (p) => p.translationKey
    ),
  };
}

/** Fingerprints every sitemap URL, with each park's schedule coverage and the parks that failed. */
export async function crawlContentFingerprints(): Promise<CrawlResult> {
  const [geo, attractionPaths] = await Promise.all([
    getGeoStructure(CACHE_TTL.geoSitemap),
    getAttractionPaths(),
  ]);
  const indexable = new Set(attractionPaths);
  const fingerprints = new Map<string, string>();
  const scheduleCoverage = new Map<string, string | null>();
  const failedParkPaths: string[] = [];
  let parksCovered = 0;
  let attractionsCovered = 0;

  // Single-park cities are skipped for the same reason the sitemap skips them:
  // the city page 308s to its only park.
  const allParks: { slug: string; name: string }[] = [];
  for (const continent of geo.continents) {
    const continentParks: { slug: string; name: string }[] = [];
    for (const country of continent.countries) {
      const countryParks: { slug: string; name: string }[] = [];
      for (const city of country.cities) {
        const cityParks = city.parks.map((p) => ({ slug: p.slug, name: p.name }));
        countryParks.push(...cityParks);
        if (city.parks.length > 1) {
          fingerprints.set(
            `/parks/${continent.slug}/${country.slug}/${city.slug}`,
            fingerprintGeoHub(cityParks)
          );
        }
      }
      continentParks.push(...countryParks);
      fingerprints.set(`/parks/${continent.slug}/${country.slug}`, fingerprintGeoHub(countryParks));
    }
    allParks.push(...continentParks);
    fingerprints.set(`/parks/${continent.slug}`, fingerprintGeoHub(continentParks));
  }
  fingerprints.set('/parks', fingerprintGeoHub(allParks));

  const targets = geo.continents.flatMap((continent) =>
    continent.countries.flatMap((country) =>
      country.cities.flatMap((city) =>
        city.parks.map((park) => ({
          continent: continent.slug,
          country: country.slug,
          city: city.slug,
          park: park.slug,
          geoPath: `${continent.slug}/${country.slug}/${city.slug}`,
          path: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
        }))
      )
    )
  );

  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor++];
      let park;
      try {
        park = await getParkByGeoPathFresh(
          target.continent,
          target.country,
          target.city,
          target.park
        );
      } catch {
        park = null;
      }
      if (!park) {
        failedParkPaths.push(target.path);
        continue;
      }

      fingerprints.set(target.path, fingerprintPark(park, parkContext(park.slug, target.geoPath)));
      scheduleCoverage.set(target.path, park.scheduleCoverage?.to ?? null);
      parksCovered++;

      for (const attraction of park.attractions ?? []) {
        if (!indexable.has(`${target.path}/${attraction.slug}`)) continue;
        fingerprints.set(
          `${target.path}/${attraction.slug}`,
          fingerprintAttraction(
            attraction,
            attractionContext(park.slug, attraction.slug, target.geoPath)
          )
        );
        attractionsCovered++;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return { fingerprints, scheduleCoverage, failedParkPaths, parksCovered, attractionsCovered };
}
