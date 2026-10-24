import { useEffect, useEffectEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import {
  CACHE_MAX_AGE_MS,
  isMeaningful,
  readCache,
  readSeedEntry,
  writeCache,
} from '@/lib/nearby/nearby-cache';
import { fetchNearby } from '@/lib/nearby/fetch-nearby';
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
 * How long after the tab comes back a position-keyed answer waits for the fix the geolocation
 * provider asks for on the same `visibilitychange` (its read times out after 5 s) before it is
 * refetched where it stands.
 */
const RETURN_REFETCH_DELAY_MS = 6000;

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

  const queryClient = useQueryClient();
  const queryKey = ['nearby-parks', position?.lat, position?.lng, radiusInMeters, limit, simMode];
  const query = useQuery<NearbyResponse>({
    queryKey,
    queryFn: async () => {
      // Don't send the user's real coordinates while simulating — the server picks the park.
      const coords = position && !simMode ? position : null;
      const result = await fetchNearby({
        lat: coords?.lat,
        lng: coords?.lng,
        radius: radiusInMeters,
        limit,
        sim: simMode,
      });

      if (!result.ok) {
        // On API error (e.g. 400 location unavailable): return cached data if available
        // so the user keeps seeing their last known results instead of an error state.
        // Skip the cache while simulating so simulated data never mixes with real results.
        if (!simMode) {
          const cached = readCache(position?.lat ?? null, position?.lng ?? null);
          if (cached) return cached;
        }
        throw new Error(result.message);
      }

      const data = result.data;

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
    // `cachedAt`, lets `staleTime` apply, so a load within the window sends no request. A new fix
    // is seeded only by an answer its move cannot have overturned (`readSeedEntry`): walking
    // inside a park sends nothing extra, walking in or out asks at once. Off while simulating.
    initialData: simMode
      ? undefined
      : () => readSeedEntry(position?.lat ?? null, position?.lng ?? null, radiusInMeters)?.data,
    initialDataUpdatedAt: simMode
      ? undefined
      : () => readSeedEntry(position?.lat ?? null, position?.lng ?? null, radiusInMeters)?.cachedAt,
    staleTime: CACHE_MAX_AGE_MS,
    gcTime: 10 * 60 * 1000,
    // Only the GeoIP answer refetches on focus, which covers a change of network. A
    // position-keyed answer would go out with the coordinates from before the tab was hidden, in
    // the same `visibilitychange` that asks for a new fix, for an answer the new fix replaces a
    // moment later. The new fix's key fetches by itself; the effect below covers a fix that does
    // not move. A simulation places the visitor on the server, so its coordinates cannot be stale.
    refetchOnWindowFocus: !hasCoords || !!simMode,
    // Poll only with real coordinates, to notice somebody walking into a park. A GeoIP answer is
    // city-level, cannot resolve the in-park radius and does not move while the tab is open.
    refetchInterval: hasCoords ? 5 * 60 * 1000 : false,
  });

  // Coming back to the tab with a position: once the provider's new fix has had its chance to
  // change the key, refetch whatever key stands if its answer is past `staleTime`. Every consumer
  // of the hook runs this, so the refetch joins one in flight instead of cancelling it. The state
  // is read from the cache, not from `query`, whose fields a read would subscribe every consumer to.
  const refetchIfStale = useEffectEvent(() => {
    if (!canRun) return;
    const state = queryClient.getQueryState(queryKey);
    if (state?.fetchStatus === 'fetching') return;
    if (state && Date.now() - state.dataUpdatedAt < CACHE_MAX_AGE_MS) return;
    void queryClient.refetchQueries({ queryKey, exact: true }, { cancelRefetch: false });
  });
  useEffect(() => {
    if (!hasCoords || simMode) return;
    let timer = 0;
    const onVisibility = () => {
      window.clearTimeout(timer);
      if (!document.hidden) timer = window.setTimeout(refetchIfStale, RETURN_REFETCH_DELAY_MS);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timer);
    };
  }, [hasCoords, simMode]);

  return query;
}

/**
 * Homepage nearby-parks query with the shared canonical params. All homepage consumers
 * share one underlying request via React Query deduplication.
 */
export function useHomeNearbyParks() {
  return useNearbyParks({ radiusInMeters: HOME_NEARBY_RADIUS_M, limit: HOME_NEARBY_LIMIT });
}
