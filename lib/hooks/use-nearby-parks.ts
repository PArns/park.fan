import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import {
  CACHE_MAX_AGE_MS,
  isMeaningful,
  readCache,
  readCacheEntry,
  writeCache,
} from '@/lib/nearby/nearby-cache';
import { resolveCompassDemo } from '@/lib/nearby-simulation';
import type { NearbyResponse } from '@/types/nearby';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';

export interface UseNearbyParksOptions {
  /** Radius in meters (default: 1000). */
  radiusInMeters?: number;
  /** Max number of parks when type is nearby_parks (default: 6, max: 50). */
  limit?: number;
}

/**
 * Canonical radius for the homepage nearby-parks query; every consumer must share the params so
 * React Query dedupes them into one request, hence `useHomeNearbyParks`. It is the hero's in-park
 * distance, so standing at the entrance still returns `in_park` with its rides.
 */
export const HOME_NEARBY_RADIUS_M = IN_PARK_FALLBACK_DISTANCE_M; // 1 km
export const HOME_NEARBY_LIMIT = 6;

/**
 * Nearby parks for the visitor's position, or for the backend's GeoIP guess without one. The last
 * good answer is kept in localStorage, shown at once and used when a request fails.
 */
function useNearbyParks(options: UseNearbyParksOptions | number = {}) {
  const opts: UseNearbyParksOptions =
    typeof options === 'number' ? { radiusInMeters: options } : options;
  const radiusInMeters = opts.radiusInMeters ?? 1000;
  const limit = opts.limit ?? 6;

  const { position, loading: geoLoading, initialCheckDone } = useGeolocation();
  // Hold the (GeoIP/nearby) network request until the page has loaded + gone idle, so it never
  // competes with first paint / LCP for bandwidth. Cached results still render instantly via
  // `placeholderData`, so for returning visitors there's no perceived delay; new visitors see
  // the nearby skeleton resolve a moment later.
  const afterLoad = useAfterLoad();

  // Dev-only: `?sim=in_park` (and friends) simulates standing in a park so the in-park UI can be
  // previewed without real GPS. Forwarded to /api/nearby, which only honors it outside production.
  // The compass demo (`?sim=compass`) is not one of them: it asks for its park itself and leaves
  // this request, and the hero, to the device's real position.
  const rawSim =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sim') : null;
  const simMode = resolveCompassDemo(rawSim) ? null : rawSim;

  const hasCoords = position != null;
  // Wait while a GPS lookup is pending instead of firing a GeoIP request the coordinates would
  // supersede a second later; without permission, or after a GPS failure, the GeoIP fallback
  // runs. A simulation overrides the location server-side, so it skips both gates.
  const canRun = !!simMode || ((hasCoords || (initialCheckDone && !geoLoading)) && afterLoad);

  return useQuery<NearbyResponse>({
    queryKey: ['nearby-parks', position?.lat, position?.lng, radiusInMeters, limit, simMode],
    queryFn: async () => {
      const url = new URL('/api/nearby', window.location.origin);
      const coords = position ?? null;
      // Don't send the user's real coordinates while simulating — the server picks the park.
      if (coords && !simMode) {
        url.searchParams.set('lat', String(coords.lat));
        url.searchParams.set('lng', String(coords.lng));
      }
      url.searchParams.set('radius', radiusInMeters.toString());
      url.searchParams.set('limit', limit.toString());
      if (simMode) url.searchParams.set('sim', simMode);

      const response = await fetch(url.toString(), { cache: 'no-store' });

      if (!response.ok) {
        // On API error (e.g. 400 location unavailable): return cached data if available
        // so the user keeps seeing their last known results instead of an error state.
        // Skip the cache while simulating so simulated data never mixes with real results.
        if (!simMode) {
          const cached = readCache(position?.lat ?? null, position?.lng ?? null);
          if (cached) return cached;
        }

        const body = await response.json().catch(() => ({}));
        const message =
          typeof body?.error === 'string'
            ? body.error
            : `Failed to fetch nearby parks: ${response.statusText}`;
        throw new Error(message);
      }

      const data: NearbyResponse = await response.json();

      // Never read from or write to the real cache while simulating.
      if (simMode) return data;

      // Only persist and return meaningful results. Empty parks array or unknown types
      // fall back to the last cached result so stale-but-good data isn't replaced.
      if (isMeaningful(data)) {
        writeCache(data, position?.lat ?? null, position?.lng ?? null);
        return data;
      }

      return readCache(position?.lat ?? null, position?.lng ?? null) ?? data;
    },
    enabled: canRun,
    // The previous in-memory answer first (it covers the key change when GPS arrives
    // mid-session), else the persisted cache for this position. Off while simulating.
    placeholderData: (prev) =>
      simMode ? undefined : (prev ?? readCache(position?.lat ?? null, position?.lng ?? null)),
    // `placeholderData` only paints; seeding the persisted entry as `initialData`, with its real
    // `cachedAt`, lets `staleTime` apply, so a load within the window sends no request. When GPS
    // arrives, only an entry written from coordinates within 10 km seeds the new key, so the first
    // request with real coordinates goes out at once. Off while simulating.
    initialData: simMode
      ? undefined
      : () => readCacheEntry(position?.lat ?? null, position?.lng ?? null)?.data,
    initialDataUpdatedAt: simMode
      ? undefined
      : () => readCacheEntry(position?.lat ?? null, position?.lng ?? null)?.cachedAt,
    staleTime: CACHE_MAX_AGE_MS,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // Poll only with real coordinates, to notice somebody walking into a park. A GeoIP answer is
    // city-level, cannot resolve the in-park radius and does not move while the tab is open;
    // focus refetching covers a change of network.
    refetchInterval: hasCoords ? 5 * 60 * 1000 : false,
  });
}

/**
 * Homepage nearby-parks query with the shared canonical params. All homepage consumers
 * share one underlying request via React Query deduplication.
 */
export function useHomeNearbyParks() {
  return useNearbyParks({ radiusInMeters: HOME_NEARBY_RADIUS_M, limit: HOME_NEARBY_LIMIT });
}
