import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { ParkHourlyProfile } from '@/lib/api/types';

interface UseParkHourlyProfileParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** How many rides to show. Clamped to 1–12 at the route handler. */
  topN?: number;
}

/**
 * Client-side fetch for a park's hourly wait-time profile.
 *
 * Same shape as `useParkHistoricalStats` and for the same reasons: browser-only so the static
 * prerender never reads a clock, deferred behind `useLoadLast` because a historical aggregate must
 * never race the live status and weather queries, and a 1 h stale window matching the CDN's — the
 * backend recomputes this once a day, so polling it would only cost requests.
 *
 * A 404 means the park has no readable profile (too few measured days, or fewer than three hours
 * that were measured often enough to be columns). That is a settled answer, so it resolves to
 * `null` rather than retrying, and the caller renders nothing.
 */
export function useParkHourlyProfile({
  continent,
  country,
  city,
  parkSlug,
  topN = 8,
}: UseParkHourlyProfileParams) {
  const releasedLast = useLoadLast();

  return useQuery<ParkHourlyProfile | null>({
    queryKey: ['park-hourly-profile', continent, country, city, parkSlug, topN],
    queryFn: async () => {
      const res = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/stats/hourly?topN=${topN}`,
        { cache: 'no-store' }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`hourly profile ${parkSlug}: ${res.statusText}`);
      return (await res.json()) as ParkHourlyProfile;
    },
    enabled: typeof window !== 'undefined' && releasedLast,
    staleTime: 60 * 60_000,
    gcTime: 90 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
