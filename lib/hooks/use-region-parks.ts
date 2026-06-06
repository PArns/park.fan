import { useQuery } from '@tanstack/react-query';
import type { DiscoveryCityResponse, ParkStatus, CrowdLevel, ScheduleSummary } from '@/lib/api/types';

/** Live, per-park fields the hub ParkCards overlay client-side (everything that can change during the day). */
export interface LiveParkFields {
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  operatingAttractions?: number;
  totalAttractions?: number;
  timezone?: string;
  hasOperatingSchedule?: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}

/**
 * Batch-fetch live status for every park in a country, keyed by park id.
 *
 * One request per (continent, country) — React Query dedupes it across all `<LiveParkGrid>`
 * instances on a country page (one per city), so a country page makes a SINGLE live call no
 * matter how many cities it lists. Mirrors the `useLiveParkData` contract: client-only, refetch
 * on mount (the SSR shell is status-free), 5-min poll, refetch on focus/reconnect.
 */
export function useRegionParks(continent: string, country: string) {
  const query = useQuery<Map<string, LiveParkFields>>({
    queryKey: ['region-parks', continent, country],
    queryFn: async () => {
      const res = await fetch(`/api/discovery/${continent}/${country}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch region parks: ${res.statusText}`);
      const data = (await res.json()) as DiscoveryCityResponse;
      const map = new Map<string, LiveParkFields>();
      for (const city of data.data ?? []) {
        for (const park of city.parks ?? []) {
          map.set(park.id, {
            status: park.status,
            crowdLevel: park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel,
            averageWaitTime: park.analytics?.statistics?.avgWaitTime,
            operatingAttractions: park.analytics?.statistics?.operatingAttractions,
            totalAttractions: park.analytics?.statistics?.totalAttractions,
            timezone: park.timezone,
            hasOperatingSchedule: park.hasOperatingSchedule,
            todaySchedule: park.todaySchedule,
            nextSchedule: park.nextSchedule,
          });
        }
      }
      return map;
    },
    // Run only on the client: the SSR/prerendered shell renders status-free cards.
    enabled: typeof window !== 'undefined',
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  return { liveByParkId: query.data, isFetching: query.isFetching };
}
