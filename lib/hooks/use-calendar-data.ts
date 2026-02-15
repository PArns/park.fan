import { useQuery } from '@tanstack/react-query';
import type { IntegratedCalendarResponse } from '@/lib/api/types';

interface UseCalendarDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  enabled?: boolean;
}

/**
 * Hook to fetch calendar data with React Query
 * - Caches results for 5 minutes
 * - Instant navigation when month data is cached
 * - Automatically fetches when parameters change
 */
export function useCalendarData({
  continent,
  country,
  city,
  parkSlug,
  from,
  to,
  enabled = true,
}: UseCalendarDataParams) {
  return useQuery<IntegratedCalendarResponse>({
    queryKey: ['calendar', continent, country, city, parkSlug, from, to],
    queryFn: async () => {
      const response = await fetch(
        `/api/parks/${continent}/${country}/${city}/${parkSlug}/calendar?from=${from}&to=${to}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60_000, // 5 min cache
    gcTime: 10 * 60_000, // 10 min garbage collection
    retry: 2,
  });
}
