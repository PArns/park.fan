import { cache } from 'react';
import { getServerApiHeaders } from '@/lib/api/client';
import type { ParkHistoricalStats, ParkHourlyProfile, RideDayCurve } from '@/lib/api/types';

const getApiBaseUrl = () =>
  typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan' : '';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Backoff schedule (ms) for the lazy-compute retry. First attempt fires immediately. */
const RETRY_DELAYS_MS = [0, 1500, 3000, 5000];

/**
 * Fetch historical crowd/wait-time statistics for a park.
 *
 * The stats endpoint computes its aggregate lazily: the very first request for a "cold"
 * park kicks off the computation and answers with a non-OK status while it builds, then
 * succeeds a few seconds later. The park page is dynamically rendered (no-store park +
 * nowcast), so without a retry that first render gave up and dropped the whole stats
 * section — which only reappeared on a manual reload once the backend had warmed up.
 *
 * This section is streamed off the critical path (<Suspense>), so we retry with a short
 * backoff instead: the page shell stays interactive, the skeleton shows during the wait,
 * and the real stats stream in on the first load. A 200 that is simply not displayable
 * (genuinely too little data) is returned immediately — that state won't change on retry.
 *
 * Cached 24h on success — data changes daily, not in real-time.
 */
export async function getParkHistoricalStats(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  years = 2,
  /**
   * How many ranked attractions to ask for. Omitted → the backend's default of 10, which is what
   * the park page warms; a table that names specific rides asks deeper. Every distinct value is
   * another CDN object per park, so the route handler only forwards a small closed set.
   */
  topN?: number
): Promise<ParkHistoricalStats | null> {
  // Invoked from the `/api/parks/.../stats` route handler (the park page loads stats CLIENT-side),
  // which is CDN-cached (Cache-Control s-maxage=3600 — see next.config.ts), so caching happens at
  // that edge layer. The retry loop below warms a cold-compute backend WITHIN a single request, so
  // a successful aggregate is returned on first load; the CDN then serves it for the hour.
  const url =
    `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats?years=${years}` +
    (topN ? `&topN=${topN}` : '');

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) await sleep(RETRY_DELAYS_MS[attempt]);

    try {
      // Retries use a unique URL (`_r=attempt`) so a still-computing cold backend is genuinely
      // re-polled within this cache-fill instead of replaying the first failed response.
      const res =
        attempt === 0
          ? await fetch(url, { headers: getServerApiHeaders() })
          : await fetch(`${url}&_r=${attempt}`, {
              headers: getServerApiHeaders(),
            });

      if (res.ok) {
        // A successful response is authoritative: either the data is ready, or the park
        // genuinely has too little data to display (displayable: false). Neither changes
        // on retry, so return it and let the caller decide whether to render.
        return (await res.json()) as ParkHistoricalStats;
      }
      // A 404 is the API saying there is no such park or no such aggregate. That is a
      // settled answer and the only one `null` may mean: retrying cannot make a park
      // exist, and the caller is allowed to cache it. A park with THIN history is not
      // this case — the API answers those with a 200 and an aggregate to match, which
      // is why `null` never meant "too little history" however the route read it.
      if (res.status === 404) return null;
      // Anything else → backend still computing the cold aggregate → retry after backoff.
    } catch {
      // Network / transient error → retry after backoff.
    }
  }

  // Out of attempts without an answer. This is NOT the same as the 404 above and must not
  // be reported as one: a caller that treats it as "this park has no stats" caches our own
  // outage as a fact about the park. It happened — three backend deploys inside ninety
  // minutes, each a container swap wider than this 9.5-second window, and Phantasialand's
  // stats section was served as `{"error":"Stats not available"}` from the edge for an hour
  // while the API answered every request with 200.
  throw new Error(
    `historical stats ${parkSlug}: no answer after ${RETRY_DELAYS_MS.length} attempts`
  );
}

/**
 * Fetch the park's hourly wait-time profile — median and busy wait per hour of the operating day,
 * ride by ride.
 *
 * Unlike `/stats` this is not a cold-compute path: the backend reads the same daily hourly rollup
 * and caches the projection for 24 h, so a single attempt is enough. The retry loop above exists
 * for the aggregate's first-request-builds-it behaviour, which this endpoint does not have.
 *
 * `null` means the API answered 404 — a settled "no such profile". A failure throws, so the
 * caller can tell the two apart; they are cached very differently.
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
  // Same rule as `getRideDayCurve`: `null` is the API's 404 and nothing else — no such
  // park, no such profile. Every other failure throws, because the route above turns a
  // 404 into an hour of CDN cache and a throw into an uncached 500, and an outage of ours
  // must not be stored as a fact about the park.
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `hourly profile ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as ParkHourlyProfile;
}

/**
 * How long a seed may hold a render. Generous enough that a warm aggregate (a few hundred ms)
 * always lands, short enough that a cold one does not sit in the build.
 */
const STATS_SEED_TIMEOUT_MS = 3000;

/**
 * Bounds a seed fetch. A timeout and a genuine miss both resolve `null`, because they mean the
 * same thing to every caller: render what you would render without a seed.
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
 * Timeout-bounded, per-render-deduped wrapper around {@link getParkHistoricalStats} for the blog
 * widgets' server seed.
 *
 * Why it exists: `ParkStatsSection` and `ParkComparisonCard` fetch client-side, so a blog post
 * shipped its numbers as `data-slot="skeleton"` placeholders — the Europa-Park guide's cross-park
 * comparison table reached crawlers as seven park names with empty cells, which is the one table
 * in that post an answer engine would have quoted. Seeding puts the aggregate into the first HTML;
 * the deferred client queries still replace it exactly as before.
 *
 * Why a TIMEOUT instead of the retry loop above: this runs inside the blog post's static
 * prerender. `getParkHistoricalStats` waits up to 9.5s warming a cold aggregate, and a seed is
 * not worth holding a build for — on timeout it resolves `null` and the widget renders the
 * skeleton it renders today. Best-effort by construction, never a new failure mode.
 *
 * Why `cache()`: the Europa-Park guide embeds three `stats-widget`s for that park plus a
 * seven-park comparison table, so without per-render dedupe one park costs four fetches.
 *
 * Only for AGGREGATES. Do not seed the best-days calendar this way: blog posts are statically
 * prerendered, its "upcoming quiet days" are derived against a clock, and a build-time `today`
 * would ship crawlers wrong DATES — worse than a skeleton. A two-year median carries no today.
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
 * The same seed for the hourly profile, which needed one for the same reason: the Europa-Park
 * guide shipped this table as 132 skeleton placeholders — twelve rides × ten hours of nothing —
 * in the post that replaced a hand-typed matrix with it.
 *
 * `topN` is part of the identity, not a detail: it reaches the API as a query parameter and the
 * client hook keys on it, so a seed fetched with a different one would be replaced by a
 * differently-sized table the moment the query settles. Callers pass the clamped value they give
 * the card.
 */
/**
 * One ride's day curve. `attraction` pins a ride; without it the backend picks
 * the park's busiest ride that actually reported today, so the answer is not a
 * closed or out-of-season one.
 *
 * **Only a 404 is an answer.** It means "this park has no readable curve" —
 * too few measured days — and the caller draws nothing, which is correct and
 * needs no alarm. Every other failure is an outage and THROWS.
 *
 * The first version returned `null` for both, and that one line cost a day of
 * debugging: a 500 became a 404 at the route handler, became "no curve" at the
 * hook, became "try the next park" at the card, and six parks later the homepage
 * chapter rendered empty with not one line in any log saying why. A broken
 * endpoint and a thin park are not the same thing and must not arrive as the
 * same value.
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
    // The body carries the API's own message for a 500; a truncated copy of it
    // is the difference between "it is broken" and knowing which query broke.
    const body = await res.text().catch(() => '');
    throw new Error(
      `day curve ${parkSlug}: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return (await res.json()) as RideDayCurve;
}

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
