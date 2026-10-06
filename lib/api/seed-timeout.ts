import { after } from 'next/server';

/**
 * Wait for a streamed SEO seed, but not for long, and never leave a timer behind. SERVER ONLY:
 * `after` comes from `next/server`, which is why it is not in `lib/api/parks.ts` (that module
 * reaches the browser bundle).
 *
 * The seeds are started in the render and consumed inside `<Suspense>`, so they must never hold the
 * stream open on a cold backend. On timeout the caller gets `null` (meaning „no seed", never an
 * empty result) and `after()` lets the fetch finish so the next request finds the cache warm. The
 * `finally` clears the timer when the promise wins.
 */
export async function withSeedTimeout<T>(
  promise: Promise<T | null>,
  ms: number
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      promise,
      new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), ms);
      }),
    ]);
    if (result === 'timeout') {
      after(() => promise);
      return null;
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}
