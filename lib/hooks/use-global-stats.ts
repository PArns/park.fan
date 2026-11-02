import { useQuery } from '@tanstack/react-query';
import type { GlobalStats } from '@/lib/api/types';
import { LIVE_POLL_QUERY_OPTIONS } from '@/lib/hooks/live-poll-options';

/**
 * Client-side refresh of the global "right now" statistics (open parks / operating attractions).
 *
 * The homepage server-renders a seed of these counts from `getGlobalStats`, which caches it for a
 * long time on purpose (its comment says why); this hook overlays the live values after mount
 * through the no-store `/api/analytics/realtime` proxy, on the same {@link LIVE_POLL_QUERY_OPTIONS}
 * cycle as `useGeoLiveStats`.
 */
export function useGlobalStats() {
  return useQuery<GlobalStats>({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/realtime', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch global stats: ${res.statusText}`);
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    ...LIVE_POLL_QUERY_OPTIONS,
  });
}
