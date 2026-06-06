import { useQuery } from '@tanstack/react-query';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

interface UseParkBestDaysCalendarParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

/**
 * Client-side fetch of the calendar window that feeds the "best days" widget and the
 * crowd-derived FAQ entry.
 *
 * Moved off the server render so the park page no longer needs a dynamic Suspense hole
 * (connection()) for the calendar — which forced the whole route into `no-store` and caused
 * ISR write churn. Hits the existing `/api/parks/.../calendar?from=&to=` route (CDN-cached,
 * s-maxage), the same endpoint the calendar tab already polls.
 *
 * - Browser-only (`enabled` gated on `window`): never runs during the static prerender,
 *   where reading the clock internally (React Query) is forbidden under Cache Components.
 * - 30-min staleTime: this fuels trip-planning aggregates that only shift with the daily
 *   forecast, so a half-hour-old snapshot is fine.
 */
export function useParkBestDaysCalendar({
  continent,
  country,
  city,
  parkSlug,
  from,
  to,
}: UseParkBestDaysCalendarParams) {
  return useQuery<IntegratedCalendarResponse>({
    queryKey: ['park-best-days-calendar', continent, country, city, parkSlug, from, to],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/calendar?from=${from}&to=${to}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
      }

      return (await response.json()) as IntegratedCalendarResponse;
    },
    enabled: typeof window !== 'undefined',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
