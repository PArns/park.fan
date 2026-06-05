import { cacheLife } from 'next/cache';
import { getServerAuthHeaders } from '@/lib/api/client';
import type { ParkHistoricalStats } from '@/lib/api/types';

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
  years = 2
): Promise<ParkHistoricalStats | null> {
  'use cache';
  // Cached (Cache Components): creating this promise in the park-page shell is allowed, while
  // the StreamedParkStats <Suspense> hole still streams it off the critical path. Short window
  // so a cold-compute miss (null) is re-attempted soon rather than stuck for a day.
  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });

  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats?years=${years}`;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) await sleep(RETRY_DELAYS_MS[attempt]);

    try {
      // Retries use a unique URL (`_r=attempt`) so a still-computing cold backend is genuinely
      // re-polled within this cache-fill instead of replaying the first failed response.
      const res =
        attempt === 0
          ? await fetch(url, { headers: getServerAuthHeaders() })
          : await fetch(`${url}&_r=${attempt}`, {
              headers: getServerAuthHeaders(),
            });

      if (res.ok) {
        // A successful response is authoritative: either the data is ready, or the park
        // genuinely has too little data to display (displayable: false). Neither changes
        // on retry, so return it and let the caller decide whether to render.
        return (await res.json()) as ParkHistoricalStats;
      }
      // Non-OK → backend is still computing the cold aggregate → retry after backoff.
    } catch {
      // Network / transient error → retry after backoff.
    }
  }

  return null;
}
