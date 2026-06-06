import { useQuery } from '@tanstack/react-query';
import type { NearbyParkItem } from '@/lib/api/types';

/**
 * Batch-fetch live status for the parks near a given location, keyed by park id.
 *
 * Backs the park page's nearby-parks overlay: the cards' structure is prerendered status-free and
 * this hook layers live open/closed status + crowd on the client (no-store, 5-min poll). Mirrors
 * the other live hooks; client-only so the SSR shell stays status-free.
 */
export function useParkNeighbors(
  lat: number,
  lng: number,
  excludeParkId: string,
  limit = 3,
  maxDistanceM = 100_000
) {
  const query = useQuery<Map<string, NearbyParkItem>>({
    queryKey: ['park-neighbors', lat, lng, excludeParkId],
    queryFn: async () => {
      const url = new URL('/api/parks/near', window.location.origin);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lng', String(lng));
      url.searchParams.set('exclude', excludeParkId);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('radius', String(maxDistanceM));
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch nearby parks: ${res.statusText}`);
      const data = (await res.json()) as { parks?: NearbyParkItem[] };
      const map = new Map<string, NearbyParkItem>();
      for (const park of data.parks ?? []) map.set(park.id, park);
      return map;
    },
    enabled: typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  return { liveByParkId: query.data };
}
