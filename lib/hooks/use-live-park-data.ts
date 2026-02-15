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
 * - Uses initial SSR data for instant render
 * - Refreshes on window focus (when user returns to tab)
 * - Refreshes on network reconnect
 * - Smart staleTime: 5min for open parks, 1h for closed parks
 * - No automatic polling (cost optimization)
 */
export function useLiveParkData({
  continent,
  country,
  city,
  parkSlug,
  initialData,
}: UseLiveParkDataParams) {
  // Smart staleTime based on park status
  // Open parks: 5 min (live wait times change frequently)
  // Closed parks: 1 hour (no live updates needed)
  const isOpen = initialData?.status === 'OPERATING';
  const staleTime = isOpen ? 5 * 60_000 : 60 * 60_000;

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
    staleTime, // Dynamic: 5min (open) or 1h (closed)
    gcTime: 10 * 60_000, // 10 min garbage collection
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh on network reconnect
    retry: 2,
  });
}
