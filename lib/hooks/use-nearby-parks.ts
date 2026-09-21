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
import type { NearbyResponse } from '@/types/nearby';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';

export interface UseNearbyParksOptions {
  /** Radius in meters (default: 1000). */
  radiusInMeters?: number;
  /** Max number of parks when type is nearby_parks (default: 6, max: 50). */
  limit?: number;
}

/**
 * Canonical params for the homepage nearby-parks query. All homepage consumers
 * (header, hero, nearby card) MUST share these so React Query dedupes them into a
 * single request (the query key is derived from these values). Use `useHomeNearbyParks`
 * rather than passing the literals inline so they can't silently drift apart.
 */
// The backend classifies the user as "in park" (and returns the rides list) only when within
// `radius` of a park. Match the hero's in-park distance so standing at the entrance/parking
// (a few hundred metres from the park point) returns in_park with rides, instead of the
// "nearest parks" list — keeping the hero welcome and the card in sync.
export const HOME_NEARBY_RADIUS_M = IN_PARK_FALLBACK_DISTANCE_M; // 1 km
export const HOME_NEARBY_LIMIT = 6;

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
  // Hold the (GeoIP/nearby) network request until the page has loaded + gone idle, so it never
  // competes with first paint / LCP for bandwidth. Cached results still render instantly via
  // `placeholderData`, so for returning visitors there's no perceived delay; new visitors see
  // the nearby skeleton resolve a moment later.
  const afterLoad = useAfterLoad();

  // Dev-only: `?sim=in_park` (and friends) simulates standing in a park so the in-park UI can be
  // previewed without real GPS. Forwarded to /api/nearby, which only honors it outside production.
  const simMode =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sim') : null;

  const hasCoords = position != null;
  // Wait while a GPS lookup is pending (permission granted → coords imminent) instead of
  // firing a throwaway IP-fallback request that the coords refetch would supersede ~1-2s
  // later — that double-fire is what showed up as two backend requests per load. Once GPS
  // resolves we run with coords; if it never starts (permission not granted) or fails
  // (timeout/unavailable), `!geoLoading` lets us run with the GeoIP fallback. Cached
  // results still show instantly via `placeholderData`, so waiting costs no perceived UX.
  // A simulation overrides the location server-side, so it can run even before/without GPS
  // (and bypasses the after-load gate so previews are immediate).
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
    // Show last cached response immediately while fresh data loads in the background.
    // Prefer the previous query's in-memory data (`prev`) — it covers the key change when
    // GPS coords arrive mid-session, where the localStorage entry may already be stale;
    // without it every consumer (header pill, hero variant, search dialog) blanked out for
    // the refetch and popped back in. Falls back to the persisted cache; the closure
    // captures the current position so stale data from a different location (> 10 km away
    // or > 5 min old) is silently dropped. Disabled while simulating.
    placeholderData: (prev) =>
      simMode ? undefined : (prev ?? readCache(position?.lat ?? null, position?.lng ?? null)),
    // …but `placeholderData` only PAINTS the cached result, it does not count as data, so
    // React Query fetched again on every single page load — the persisted entry saved the
    // spinner and nothing else. Seeding it as `initialData` makes `staleTime` apply to it, so
    // a load within the 5-minute window renders from localStorage and sends no request at all.
    //
    // `initialDataUpdatedAt` is what makes that honest: without it React Query would treat a
    // 4-minute-old entry as written just now and hold off the refresh for another five. With
    // it the entry expires when it actually expires. Both stay off while simulating, same as
    // the placeholder — a simulated location must never seed or read the real cache.
    //
    // When GPS coords arrive and the query key changes, readCacheEntry seeds the new query
    // only from an entry that asked the same question: one written from coordinates, and from
    // no further than 10 km away. The GeoIP entry the page just wrote seeds nothing, so the
    // first request with real coordinates goes out immediately instead of waiting out
    // `staleTime` — that wait is what kept the in-park hero from ever appearing.
    initialData: simMode
      ? undefined
      : () => readCacheEntry(position?.lat ?? null, position?.lng ?? null)?.data,
    initialDataUpdatedAt: simMode
      ? undefined
      : () => readCacheEntry(position?.lat ?? null, position?.lng ?? null)?.cachedAt,
    staleTime: CACHE_MAX_AGE_MS,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // Poll only when the answer can actually change. With real coordinates it can — the point
    // of the poll is noticing that somebody walked into a park, which is what flips the hero
    // and the header pill. Without them the backend geolocates the request IP, and that is
    // city-level at best: it can never resolve the 1 km in-park radius, and it does not move
    // while a tab sits open. So the IP case was re-asking the same question every five minutes
    // for the whole life of the tab and getting the same answer back. `refetchOnWindowFocus`
    // still covers the case where someone leaves the tab for an hour and comes back on a
    // different network.
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
