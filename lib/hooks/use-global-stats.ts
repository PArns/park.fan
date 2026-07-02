import { useQuery } from '@tanstack/react-query';
import type { GlobalStats } from '@/lib/api/types';

/**
 * Client-side refresh of the global "right now" statistics (open parks / operating attractions).
 *
 * The homepage shell only bakes an HOURLY SSR seed of these counts (see GlobalStatsSection —
 * keeping the shell's ISR window at 3600s is what keeps Vercel ISR writes down); this hook
 * overlays the live values after mount via the no-store `/api/analytics/realtime` proxy.
 * Same contract as `useGeoLiveStats`: client-only, 5-min poll, refetch on focus/reconnect.
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
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}
