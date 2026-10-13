/** React Query timing shared by every client query that polls live data on the five-minute cycle. */
export const LIVE_POLL_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 5 * 60_000,
  retry: 2,
} as const;

/**
 * How long one live poll of the park may take before it counts as failed. A request stalled on a
 * park's mobile network otherwise hangs for minutes with `isFetching` set, and the „as of" line,
 * which says nothing about age while a poll is on its way, would keep quiet over old waits.
 */
export const LIVE_POLL_TIMEOUT_MS = 15_000;
