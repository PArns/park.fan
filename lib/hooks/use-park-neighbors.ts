import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NearbyParkItem } from '@/lib/api/types';

/** How old the neighbours' status may get while the section is in view. */
const NEIGHBORS_STALE_MS = 30 * 60_000;

/**
 * Batch-fetch live status for the parks near a given location, keyed by park id.
 *
 * Backs the park page's nearby-parks overlay: the cards' structure is prerendered status-free and
 * this hook layers live open/closed status + crowd on the client (no-store). Fetched once on load;
 * after that it refreshes 30 min after the last attempt, only while the section is on screen
 * (`active`), and at once when it scrolls back into view with a status older than that. Someone
 * standing in a park does not need the neighbours' status every 5 min, and each request wakes the
 * phone's radio. Client-only so the SSR shell stays status-free.
 */
export function useParkNeighbors(
  lat: number,
  lng: number,
  excludeParkId: string,
  limit = 3,
  maxDistanceM = 100_000,
  active = false
) {
  // Plain object (not a Map) so React Query's structural sharing keeps the result identity
  // stable across polls when nothing changed (a Map would re-render consumers every poll).
  const query = useQuery<Record<string, NearbyParkItem>>({
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
      const map: Record<string, NearbyParkItem> = {};
      for (const park of data.parks ?? []) map[park.id] = park;
      return map;
    },
    enabled: typeof window !== 'undefined',
    staleTime: NEIGHBORS_STALE_MS,
    gcTime: 2 * NEIGHBORS_STALE_MS,
    // Coming back to the tab or the network is not a reason to ask: the section refreshes itself
    // when it is on screen (below), and a hidden tab does not need the answer.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // One timer, set from the last attempt (a failed refresh counts, or an API outage would refetch
  // in a loop): it fires 30 min after that attempt, or at once when the section comes back into
  // view with an older one. Leaving the view clears it; no data yet is the initial fetch's job.
  const { dataUpdatedAt, errorUpdatedAt, refetch } = query;
  useEffect(() => {
    if (!active || dataUpdatedAt === 0) return;
    const lastAttempt = Math.max(dataUpdatedAt, errorUpdatedAt);
    const timer = setTimeout(
      () => void refetch(),
      Math.max(0, lastAttempt + NEIGHBORS_STALE_MS - Date.now())
    );
    return () => clearTimeout(timer);
  }, [active, dataUpdatedAt, errorUpdatedAt, refetch]);

  return { liveByParkId: query.data };
}
