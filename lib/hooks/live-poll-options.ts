/** React Query timing shared by every client query that polls live data on the five-minute cycle. */
export const LIVE_POLL_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,
  gcTime: 10 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 5 * 60_000,
  retry: 2,
} as const;
