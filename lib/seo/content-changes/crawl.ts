import 'server-only';
import { getGeoStructure } from '@/lib/api/discovery';
import { getParkByGeoPathFresh } from '@/lib/api/parks';
import { getAttractionPaths } from '@/lib/content-urls';
import { getParkImages, getRideImages } from '@/lib/media';
import { getPostsForPark, getPostsForRide } from '@/lib/blog/backlinks';
import type { MediaImage } from '@/lib/media/types';
import type { Locale } from '@/i18n/config';
import { fingerprintAttraction, fingerprintGeoHub, fingerprintPark } from './fingerprint';
import type { EntityContext } from './fingerprint';

/**
 * One pass over the catalog, producing the fingerprint of every URL a sitemap
 * emits a `<lastmod>` for.
 *
 * It costs 212 park fetches (~64–116 KB each, so ~20 MB) and runs once a day from
 * `/api/cron/content-changes`. Deliberately `getParkByGeoPathFresh`: the cached
 * variant would compare today's crawl against a six-hour-old snapshot of the
 * catalog and report the lag as a change tomorrow.
 *
 * Failure is per park and is not an error. A park that does not answer is left
 * out of the map and named in `failedParkPaths`, which `diffSnapshot`'s
 * `retainUncovered` uses to hold that park's existing dates instead of treating a
 * timeout as a deletion.
 *
 * Which rides count is decided by `getAttractionPaths()` — the sitemap's own list
 * — rather than by re-reading the park payload's roster. The two disagree: the
 * payload for Paultons Park carries `raven-2` while `/v1/sitemap/attractions`
 * carries `raven` as well and therefore drops the variant as a noindex duplicate.
 * Seven rides came out on the wrong side of that, which is seven `<lastmod>`
 * values for URLs no sitemap lists and seven IndexNow pings at noindex pages. The
 * allowlist is one cached request and makes the disagreement structurally
 * impossible instead of a rule copied into two places.
 */

/** Blog backlinks are locale-scoped; the fingerprint is not. */
const BACKLINK_LOCALE: Locale = 'de';

const CONCURRENCY = 8;

export interface CrawlResult {
  fingerprints: Map<string, string>;
  /** `/parks/<continent>/<country>/<city>/<park>` for every park the API did not answer for. */
  failedParkPaths: string[];
  parksCovered: number;
  attractionsCovered: number;
}

function mediaVersions(images: MediaImage[]): string[] {
  return images.map((image) => `${image.id}@${image.version}`);
}

/**
 * The photos the park page itself carries: background, hero and gallery, but not
 * the ride cards — those belong to the ride pages, and a new photo of one of 82
 * rides is not a change to the park page's own content.
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

export async function crawlContentFingerprints(): Promise<CrawlResult> {
  const [geo, attractionPaths] = await Promise.all([getGeoStructure(86400), getAttractionPaths()]);
  const indexable = new Set(attractionPaths);
  const fingerprints = new Map<string, string>();
  const failedParkPaths: string[] = [];
  let parksCovered = 0;
  let attractionsCovered = 0;

  // ── Geo hubs ──────────────────────────────────────────────────────────────
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

  // ── Parks and their attractions ───────────────────────────────────────────
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

  return { fingerprints, failedParkPaths, parksCovered, attractionsCovered };
}
