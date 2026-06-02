import { useQuery } from '@tanstack/react-query';
import type { ParkWithAttractions } from '@/lib/api/types';

interface UseLiveParkDataParams {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  initialData?: ParkWithAttractions;
}

/**
 * Hook to fetch live park data with React Query
 * - Page HTML served from Full Route Cache (ISR); this hook provides live updates on top
 * - Refetches immediately on mount: initialData comes from the statically cached page and
 *   can be stale, so we anchor it to epoch (initialDataUpdatedAt: 0) to mark it stale and
 *   force a fresh fetch on mount. (React Query otherwise treats initialData as fresh as of
 *   mount time and would skip the refetch for the full staleTime.)
 * - Auto-polls every 5 min regardless of park status (catches opening/closing)
 * - staleTime 5 min prevents redundant focus-triggered refetches within the poll window
 */
export function useLiveParkData({
  continent,
  country,
  city,
  parkSlug,
  initialData,
}: UseLiveParkDataParams) {
  return useQuery<ParkWithAttractions>({
    queryKey: ['park-live', continent, country, city, parkSlug],
    queryFn: async () => {
      const response = await fetch(`/api/parks/${continent}/${country}/${city}/${parkSlug}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch park: ${response.statusText}`);
      }

      return response.json();
    },
    initialData,
    // initialData comes from the statically cached page HTML and may be stale; anchor it to
    // epoch so React Query treats it as stale and refetches live data on mount (see docblock).
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}
