import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { RideDayCurve } from '@/lib/api/types';

interface UseRideDayCurveParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Pin a ride. Omit to let the backend pick one that reported today. */
  attraction?: string;
  /** Keep the hook call unconditional while the caller has no park yet. */
  enabled?: boolean;
}

/**
 * One ride's day curve, deferred behind `useLoadLast` like `useParkHourlyProfile` because it is a
 * historical aggregate. The stale window is five minutes, the route's own `s-maxage`, because most
 * of the payload is today; it still does not poll. A 404 means the park has no readable curve and
 * resolves to `null`.
 */
export function useRideDayCurve({
  continent,
  country,
  city,
  parkSlug,
  attraction,
  enabled = true,
}: UseRideDayCurveParams) {
  const releasedLast = useLoadLast();

  return useQuery<RideDayCurve | null>({
    queryKey: ['ride-day-curve', continent, country, city, parkSlug, attraction ?? null],
    queryFn: async () => {
      const query = attraction ? `?attraction=${encodeURIComponent(attraction)}` : '';
      const res = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/stats/day${query}`,
        { cache: 'no-store' }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`day curve ${parkSlug}: ${res.statusText}`);
      return (await res.json()) as RideDayCurve;
    },
    enabled: enabled && typeof window !== 'undefined' && releasedLast && Boolean(parkSlug),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
