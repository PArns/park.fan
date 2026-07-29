import { useQuery } from '@tanstack/react-query';
import type {
  AttractionStatus,
  ParkStatus,
  ParkWaitTimesResponse,
  QueueDataItem,
} from '@/lib/api/types';

/** Live, per-ride fields the blog's ride references overlay client-side. */
export interface LiveRideFields {
  /** Effective ride status, taken from the STANDBY queue (falls back to the first queue). */
  status?: AttractionStatus;
  /** Current STANDBY wait in minutes, `null` when the ride publishes none. */
  waitTime: number | null;
  /** Every live queue as returned by the API — AttractionCard renders these directly. */
  queues: QueueDataItem[];
}

export interface ParkWaitTimesSnapshot {
  parkStatus?: ParkStatus;
  /** Keyed by attraction slug. */
  ridesBySlug: Record<string, LiveRideFields>;
}

function toSnapshot(data: ParkWaitTimesResponse): ParkWaitTimesSnapshot {
  const ridesBySlug: Record<string, LiveRideFields> = {};
  for (const entry of data.attractions ?? []) {
    const queues = entry.queues ?? [];
    const standby = queues.find((q) => q.queueType === 'STANDBY');
    ridesBySlug[entry.attraction.slug] = {
      status: (standby?.status ?? queues[0]?.status) as AttractionStatus | undefined,
      waitTime: standby && 'waitTime' in standby ? (standby.waitTime ?? null) : null,
      queues,
    };
  }
  return { parkStatus: data.park?.status, ridesBySlug };
}

/**
 * Batch-fetch the live status + standby wait of every ride in a park, keyed by attraction slug.
 *
 * One request per park — React Query dedupes it across every ride reference in a blog post, so a
 * post naming a dozen Phantasialand coasters costs a single ~9 KB call, not one park-page-sized
 * payload per ride. Mirrors the `useRegionParks` contract: client-only (the prerendered shell has
 * no live data to seed), refetch on mount, 5-min poll, refetch on focus/reconnect.
 */
export function useParkWaitTimes(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  enabled = true
) {
  const query = useQuery<ParkWaitTimesSnapshot>({
    queryKey: ['park-wait-times', continent, country, city, parkSlug],
    queryFn: async () => {
      const res = await fetch(`/api/parks/${continent}/${country}/${city}/${parkSlug}/wait-times`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Failed to fetch wait times: ${res.statusText}`);
      return toSnapshot((await res.json()) as ParkWaitTimesResponse);
    },
    // Client-only: during the static (Cache Components) prerender the consumers render from the
    // server-resolved snapshot, and activating React Query there would read the clock.
    enabled: enabled && !!parkSlug && typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  // Data only — subscribing consumers to `isFetching` would re-render every ride reference in the
  // post on each 5-min poll for identity-stable data (same reasoning as `useRegionParks`).
  return { live: query.data };
}
