import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import type { NearbyResponse, NearbyParksData } from '@/types/nearby';

export interface UseNearbyParksOptions {
  /** Radius in meters (default: 1000). */
  radiusInMeters?: number;
  /** Max number of parks when type is nearby_parks (default: 6, max: 50). */
  limit?: number;
}

const CACHE_KEY = 'nearby-parks-v1';

/** Only count results that are worth showing — in_park always qualifies, nearby_parks needs ≥1 park. */
function isMeaningful(data: NearbyResponse): boolean {
  if (data.type === 'in_park') return true;
  if (data.type === 'nearby_parks') return ((data.data as NearbyParksData).parks?.length ?? 0) > 0;
  return false;
}

function readCache(): NearbyResponse | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as NearbyResponse) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(data: NearbyResponse): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Hook to fetch nearby parks using React Query.
 * - Shows last cached response immediately via placeholderData (no spinner on repeat visits).
 * - Fetches fresh data in the background and re-renders on update.
 * - If user allows geolocation: sends lat/lng for accurate results.
 * - If user denies or GPS times out: calls without lat/lng; backend uses GeoIP.
 * - On 400 (e.g. location could not be determined): error is set; show message or retry.
 */
export function useNearbyParks(options: UseNearbyParksOptions | number = {}) {
  const opts: UseNearbyParksOptions =
    typeof options === 'number' ? { radiusInMeters: options } : options;
  const radiusInMeters = opts.radiusInMeters ?? 1000;
  const limit = opts.limit ?? 6;

  const { position, loading: geoLoading, initialCheckDone } = useGeolocation();

  // If there's no cached data at all, fire immediately with IP fallback so the user
  // sees results right away instead of waiting for GPS on first visit.
  // If cached data exists, wait for GPS so the refetch uses accurate coords.
  const [initiallyHadCache] = useState(() => readCache() !== undefined);

  const hasCoords = position != null;
  const canRun = !initiallyHadCache || (initialCheckDone && (hasCoords || !geoLoading));

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
        // On API error (e.g. 400 location unavailable): return cached data if available
        // so the user keeps seeing their last known results instead of an error state.
        const cached = readCache();
        if (cached) return cached;

        const body = await response.json().catch(() => ({}));
        const message =
          typeof body?.error === 'string'
            ? body.error
            : `Failed to fetch nearby parks: ${response.statusText}`;
        throw new Error(message);
      }

      const data: NearbyResponse = await response.json();

      // Only persist and return meaningful results. Empty parks array or unknown types
      // fall back to the last cached result so stale-but-good data isn't replaced.
      if (isMeaningful(data)) {
        writeCache(data);
        return data;
      }

      return readCache() ?? data;
    },
    enabled: canRun,
    // Show last successful response immediately while fresh data loads in the background.
    placeholderData: readCache,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
