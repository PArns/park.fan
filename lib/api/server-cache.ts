interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * In-process cache with strict max-age semantics — no stale-while-revalidate.
 *
 * - Fresh (< maxAgeSeconds): returns cached data immediately.
 * - Stale (>= maxAgeSeconds): awaits a fresh fetch before returning.
 * - Concurrent cache-miss requests for the same key are coalesced into one fetch.
 */
export async function withServerCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeSeconds: number
): Promise<T> {
  const now = Date.now();
  const cached = store.get(key) as CacheEntry<T> | undefined;

  if (cached && now - cached.fetchedAt < maxAgeSeconds * 1000) {
    return cached.data;
  }

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, fetchedAt: Date.now() });
      inFlight.delete(key);
      return data;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise as Promise<unknown>);
  return promise;
}
