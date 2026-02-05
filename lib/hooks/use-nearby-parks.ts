import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import type { NearbyResponse } from '@/types/nearby';

export interface UseNearbyParksOptions {
  /** Radius in meters (default: 1000). */
  radiusInMeters?: number;
  /** Max number of parks when type is nearby_parks (default: 6, max: 50). */
  limit?: number;
}

/**
 * Hook to fetch nearby parks using React Query.
 * - If user allows geolocation: sends lat/lng for accurate results.
 * - If user denies or error: calls without lat/lng; backend uses GeoIP (X-Forwarded-For).
 * - On 400 (e.g. location could not be determined): error is set; show message or retry.
 */
export function useNearbyParks(options: UseNearbyParksOptions | number = {}) {
  const opts: UseNearbyParksOptions =
    typeof options === 'number' ? { radiusInMeters: options } : options;
  const radiusInMeters = opts.radiusInMeters ?? 1000;
  const limit = opts.limit ?? 6;

  const { position, loading: geoLoading, permissionDenied, error: geoError } = useGeolocation();

  const useCoords = position !== null;

  return useQuery<NearbyResponse>({
    queryKey: ['nearby-parks', position?.lat, position?.lng, radiusInMeters, limit],
    queryFn: async () => {
      const url = new URL('/api/nearby', window.location.origin);
      if (position) {
        url.searchParams.set('lat', position.lat.toString());
        url.searchParams.set('lng', position.lng.toString());
      }
      url.searchParams.set('radius', radiusInMeters.toString());
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString(), { cache: 'no-store' });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message =
          typeof body?.error === 'string'
            ? body.error
            : `Failed to fetch nearby parks: ${response.statusText}`;
        throw new Error(message);
      }

      return response.json();
    },
    enabled: !geoLoading && (useCoords || permissionDenied || geoError),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
