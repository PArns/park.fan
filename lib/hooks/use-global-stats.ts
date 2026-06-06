import { useQuery } from '@tanstack/react-query';
import type { GlobalStats } from '@/lib/api/types';

/**
 * Live global platform stats (open parks, most/least crowded park, longest/shortest wait ride).
 *
 * Fetched on the client via the existing no-store `/api/analytics/realtime` proxy so the homepage
 * "global stats" section is no longer baked into (and revalidating) the ISR shell every 10 min.
 * Client-only + 5-min poll.
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
