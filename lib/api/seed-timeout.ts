import { after } from 'next/server';

/**
 * Wait for a streamed SEO seed, but not for long, and never leave a timer behind.
 *
 * Three fetches on the park page's tail have the same posture: they are started during the render,
 * consumed only inside a `<Suspense>` boundary, and must never hold the stream open when the
 * backend is cold. Two of them (the best-days snapshot and the calendar month summary) carried a
 * character-for-character copy of this race, which is two places to fix when the contract changes
 * and one of them to forget — the yearly outlook would have been a third, so the copy moved here.
 *
 * Both copies also leaked their `setTimeout` for the full window even when the promise resolved in
 * 40 ms, on routes that fire two seeds per request across tens of thousands of URLs. The `finally`
 * is what fixes that.
 *
 * On timeout the caller gets `null` and `after()` keeps the fetch alive past the response, so the
 * work still lands in the data cache and the NEXT request finds it warm. Callers treat `null` as
 * "no seed", never as an empty result.
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
