import { cache } from 'react';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import type { ParkHistoricalStats, ParkHourlyProfile, RideDayCurve } from '@/lib/api/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Backoff schedule (ms) for the lazy-compute retry. First attempt fires immediately. */
const RETRY_DELAYS_MS = [0, 1500, 3000, 5000];

/**
 * Fetch historical crowd and wait-time statistics for a park, retrying while a cold aggregate
 * builds. The endpoint computes lazily: the first request for a cold park answers non-OK and
 * succeeds a few seconds later, so the loop warms it within one request. A 200 with
 * `displayable: false` is returned at once, since retrying cannot change it.
 */
export async function getParkHistoricalStats(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  years = 2,
  /**
   * Ranked attractions to ask for; omitted means the backend's default of 10, which the park page
   * warms. Every distinct value is another CDN object per park, so the route forwards a small set.
   */
  topN?: number
): Promise<ParkHistoricalStats | null> {
  // Called from the `/api/parks/.../stats` route handler, whose CDN cache (see next.config.ts) does
  // the caching; the retry loop only warms a cold backend within this one request.
  const url =
    `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats?years=${years}` +
    (topN ? `&topN=${topN}` : '');

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) await sleep(RETRY_DELAYS_MS[attempt]);

    try {
      // Retries use a unique URL (`_r=attempt`) so a still-computing backend is re-polled instead
      // of replaying the first failed response.
      const res =
        attempt === 0
          ? await fetch(url, { headers: getServerApiHeaders() })
          : await fetch(`${url}&_r=${attempt}`, {
              headers: getServerApiHeaders(),
            });

      if (res.ok) {
        // Authoritative: either ready, or `displayable: false`. Neither changes on retry.
        return (await res.json()) as ParkHistoricalStats;
      }
      // A 404 is the one settled „no such park or aggregate", and the only thing `null` means. A
      // park with thin history gets a 200 with an aggregate to match.
      if (res.status === 404) return null;
      // Anything else: the cold aggregate is still computing.
    } catch {
      // Network or transient error.
    }
  }

  // Out of attempts. This is not the 404 above and must not be reported as one, or a caller
  // caches our own outage (a backend deploy longer than this window) as a fact about the park.
  throw new Error(
    `historical stats ${parkSlug}: no answer after ${RETRY_DELAYS_MS.length} attempts`
  );
}

/**
 * Fetch the park's hourly wait-time profile: median and busy wait per hour of the operating day,
 * ride by ride. Not a cold-compute path, so one attempt is enough. `null` means a 404; any other
 * failure throws, because the two are cached very differently.
 */
export async function getParkHourlyProfile(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  { years = 1, topN = 8 }: { years?: number; topN?: number } = {}
): Promise<ParkHourlyProfile | null> {
  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats/hourly?years=${years}&topN=${topN}`;

  const res = await fetch(url, { headers: getServerApiHeaders() });
  // `null` is the 404 and nothing else: the route turns a 404 into an hour of CDN cache and a throw
  // into an uncached 500, and an outage of ours must not be stored as a fact about the park.
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `hourly profile ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as ParkHourlyProfile;
}

/** How long a seed may hold a render: enough for a warm aggregate, not for a cold one. */
const STATS_SEED_TIMEOUT_MS = 3000;

/**
 * Bounds a seed fetch. A timeout and a miss both resolve `null`, because to every caller they mean
 * „render what you would render without a seed".
 */
function withSeedTimeout<T>(promise: Promise<T | null>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), STATS_SEED_TIMEOUT_MS);
    }),
  ]);
}

/**
 * Timeout-bounded, per-render-deduped {@link getParkHistoricalStats} for the blog widgets' server
 * seed, so a post's stats tables reach crawlers with figures instead of skeleton cells.
 *
 * A timeout rather than the retry loop, because this runs inside the post's static prerender and a
 * seed is not worth holding a build for. Only for aggregates: never seed the best-days calendar
 * this way, since its upcoming quiet days are derived against a clock and a build-time `today`
 * would ship wrong dates.
 */
export const getParkHistoricalStatsSeed = cache(async function getParkHistoricalStatsSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkHistoricalStats | null> {
  return withSeedTimeout(
    getParkHistoricalStats(continent, country, city, parkSlug).catch(() => null)
  );
});

/**
 * One ride's day curve. `attraction` pins a ride; without it the backend picks the park's busiest
 * ride that reported today. Only a 404 is an answer („no readable curve", draw nothing); every
 * other failure throws, because a broken endpoint and a thin park must not arrive as the same
 * value.
 */
export async function getRideDayCurve(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attraction?: string
): Promise<RideDayCurve | null> {
  const query = attraction ? `?attraction=${encodeURIComponent(attraction)}` : '';
  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats/day${query}`;

  const res = await fetch(url, { headers: getServerApiHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    // The API's own message for a 500 says which query broke.
    const body = await res.text().catch(() => '');
    throw new Error(
      `day curve ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as RideDayCurve;
}

/**
 * Timeout-bounded, per-render-deduped fetch of a park's hourly wait profile for the blog widget's
 * server seed; resolves `null` on a miss or after 3 s.
 *
 * `topN` is part of the identity: the client hook keys on it, so a seed fetched with a different
 * value would be replaced by a differently-sized table. Callers pass the clamped value they give
 * the card.
 */
export const getParkHourlyProfileSeed = cache(async function getParkHourlyProfileSeed(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  topN: number
): Promise<ParkHourlyProfile | null> {
  return withSeedTimeout(
    getParkHourlyProfile(continent, country, city, parkSlug, { topN }).catch(() => null)
  );
});

/**
 * How the wait-time record page asks for its two aggregates, shared by the page, the client cards
 * that re-query the same figures, and the Data Cache entry. `topN` is omitted on the aggregate so
 * the page reuses the exact request the park page's route handler already warms.
 */
export const PARK_STATS_PAGE_QUERY = { years: 2, hourlyYears: 1, hourlyTopN: 8 } as const;

/**
 * The park's historical aggregate for an ISR page rather than a widget.
 *
 * Data-cached with `next.revalidate`, because one uncached fetch turns the whole route dynamic.
 * No retry loop: a cold park just misses this revalidation. `null` means 404 and nothing else;
 * every other failure throws so the ISR entry stays unwritten instead of caching our outage for
 * a day as „this park has no stats".
 */
export const getParkStatsForPage = cache(async function getParkStatsForPage(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkHistoricalStats | null> {
  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats?years=${PARK_STATS_PAGE_QUERY.years}`;
  const res = await fetch(url, {
    headers: getServerApiHeaders(),
    next: { revalidate: CACHE_TTL.stats, tags: ['parks'] },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `park stats page ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as ParkHistoricalStats;
});

/**
 * The hourly profile for the same page, on the same terms as {@link getParkStatsForPage}, with
 * {@link PARK_STATS_PAGE_QUERY.hourlyTopN} so the card asks for the same table.
 */
export const getParkHourlyProfileForPage = cache(async function getParkHourlyProfileForPage(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkHourlyProfile | null> {
  const url =
    `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats/hourly` +
    `?years=${PARK_STATS_PAGE_QUERY.hourlyYears}&topN=${PARK_STATS_PAGE_QUERY.hourlyTopN}`;
  const res = await fetch(url, {
    headers: getServerApiHeaders(),
    next: { revalidate: CACHE_TTL.stats, tags: ['parks'] },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `hourly profile page ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as ParkHourlyProfile;
});

/**
 * Does this park have a wait-time record page at all? `meta.displayable` is the API's answer to
 * „is there enough measured history to print" and gates the route. For the sitemap and links that
 * must know whether the URL exists; shares {@link getParkStatsForPage}'s cache entry.
 *
 * A failure answers `false`, on purpose: leaving a URL out of one day's sitemap costs a day of
 * discovery, while advertising one that 404s costs the crawler's trust in the whole file.
 */
export async function hasParkStatsPage(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<boolean> {
  try {
    const stats = await getParkStatsForPage(continent, country, city, parkSlug);
    return stats?.meta.displayable === true;
  } catch {
    return false;
  }
}

/** The geo path that identifies a park. */
export interface ParkGeoPath {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * The key a park is identified by here. Not the slug: the same slug exists in more than one city,
 * so only the whole geo path is unique.
 */
export const parkGeoKey = ({ continent, country, city, parkSlug }: ParkGeoPath): string =>
  `${continent}/${country}/${city}/${parkSlug}`;

/**
 * How many availability probes may be in flight at once. The sitemap asks about every park, and
 * all at once would open hundreds of sockets for one file; the probes share the pages' Data Cache
 * entries, so after the first build they cost little.
 */
const AVAILABILITY_CONCURRENCY = 8;

/**
 * Which of these parks have a wait-time record page, as a set of {@link parkGeoKey}s. Every probe
 * answers `false` rather than throwing, per {@link hasParkStatsPage}.
 */
export async function parksWithStatsPage(
  parks: readonly ParkGeoPath[]
): Promise<ReadonlySet<string>> {
  return parksWhere(parks, (p) => hasParkStatsPage(p.continent, p.country, p.city, p.parkSlug));
}

/**
 * The parks for which a probe answers `true`, asked {@link AVAILABILITY_CONCURRENCY} at a time.
 * A probe must answer `false` rather than throw.
 */
export async function parksWhere(
  parks: readonly ParkGeoPath[],
  probe: (park: ParkGeoPath) => Promise<boolean>
): Promise<ReadonlySet<string>> {
  const available = new Set<string>();
  for (let i = 0; i < parks.length; i += AVAILABILITY_CONCURRENCY) {
    const batch = parks.slice(i, i + AVAILABILITY_CONCURRENCY);
    const answers = await Promise.all(batch.map(probe));
    answers.forEach((ok, j) => {
      if (ok) available.add(parkGeoKey(batch[j]));
    });
  }
  return available;
}
