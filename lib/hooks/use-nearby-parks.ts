import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import type { NearbyResponse } from '@/types/nearby';

/**
 * Hook to fetch nearby parks using React Query
 * - Automatically uses geolocation from context
 * - Caches results for 5 minutes
 * - Deduplicates simultaneous requests
 */
export function useNearbyParks(radiusInMeters: number = 500) {
  const { position, loading: geoLoading, permissionDenied } = useGeolocation();

  return useQuery<NearbyResponse>({
    queryKey: ['nearby-parks', position?.lat, position?.lng, radiusInMeters],
    queryFn: async () => {
      if (!position) {
        throw new Error('No position available');
      }

      const url = new URL('/api/nearby', window.location.origin);
      url.searchParams.set('lat', position.lat.toString());
      url.searchParams.set('lng', position.lng.toString());
      url.searchParams.set('radius', radiusInMeters.toString());

      const response = await fetch(url.toString(), {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch nearby parks: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !geoLoading && !permissionDenied && position !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes - location-based data changes slowly
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
