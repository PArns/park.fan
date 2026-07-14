import { useQuery } from '@tanstack/react-query';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';

interface UseParkBestDaysCalendarParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

/**
 * Client-side fetch of the precomputed best-days snapshot that feeds the "best days" widget,
 * the crowd-derived FAQ entry and the header "Prognose heute" forecast.
 *
 * Hits the dedicated `/api/parks/.../best-days` route (→ backend `/best-days`, a materialized
 * Redis snapshot, CDN-cached). This replaced the old derive-from-`/calendar` path: no `from`/`to`
 * window is needed (the endpoint returns the rolling today → +90d window), the payload is ~15 KB
 * instead of ~2.25 MB, and it never triggers a cold ML compute.
 *
 * - Browser-only (`enabled` gated on `window`): never runs during the static prerender, where
 *   reading the clock internally (React Query) is forbidden under Cache Components.
 * - 30-min staleTime: this fuels trip-planning aggregates that only shift with the daily forecast,
 *   so a half-hour-old snapshot is fine.
 * - Deferred via `useLoadLast`: the best-travel-time data must ALWAYS load last on the park page —
 *   it must never compete with the live status/weather queries (see
 *   docs/architecture/system-overview.md → "Park page loading priority").
 */
export function useParkBestDaysCalendar({
  continent,
  country,
  city,
  parkSlug,
}: UseParkBestDaysCalendarParams) {
  const releasedLast = useLoadLast();

  return useQuery<BestDaysSnapshot>({
    queryKey: ['park-best-days-calendar', continent, country, city, parkSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/best-days`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch best-days data: ${response.statusText}`);
      }

      return (await response.json()) as BestDaysSnapshot;
    },
    // Browser-only, and held back by `releasedLast` until every other query on the page has
    // settled (loads-last rule).
    enabled: typeof window !== 'undefined' && releasedLast,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
