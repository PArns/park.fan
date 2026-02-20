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

  const { position, loading: geoLoading, initialCheckDone } = useGeolocation();

  // Run as soon as the initial permission check is done, unless GPS is actively loading
  // (permission was already granted — worth waiting for accurate coords in that case).
  // Covers: prompt state, pre-denied, denied, error → all use IP fallback via the proxy.
  const hasCoords = position != null;
  const canRun = initialCheckDone && (hasCoords || !geoLoading);

  return useQuery<NearbyResponse>({
    queryKey: ['nearby-parks', position?.lat, position?.lng, radiusInMeters, limit],
    queryFn: async () => {
      const url = new URL('/api/nearby', window.location.origin);
      const coords = position ?? null;
      if (coords) {
        url.searchParams.set('lat', String(coords.lat));
        url.searchParams.set('lng', String(coords.lng));
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
    enabled: canRun,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
