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
 * One ride's day curve.
 *
 * Same shape as `useParkHourlyProfile` and deferred behind the same
 * `useLoadLast` gate, because it is the same kind of thing: a historical
 * aggregate that must never race the live status and weather queries.
 *
 * The stale window is FIVE minutes rather than that hook's hour, and matches the
 * route's own `s-maxage`. Two thirds of this payload is today — the measured
 * hours and the forecast for the rest — so an hour-old copy is exactly the thing
 * a chart headed "today" must not draw. It still does not poll: a five-minute
 * stale window means the next mount refetches, not that a tab left open hammers
 * the route.
 *
 * A 404 is the settled answer "this park has no readable curve" (too few
 * measured days), so it resolves to `null` rather than retrying and the caller
 * renders nothing.
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
