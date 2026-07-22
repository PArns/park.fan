import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import type { NearbyResponse, NearbyParksData } from '@/types/nearby';
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

const CACHE_KEY = 'nearby-parks-v2';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // matches staleTime
// Skip placeholder if user has moved more than this distance since the cache was written.
const CACHE_COORD_MAX_DIST_KM = 10;

interface CachedNearby {
  data: NearbyResponse;
  cachedAt: number;
  lat: number | null;
  lng: number | null;
}

/** Only count results that are worth showing — in_park always qualifies, nearby_parks needs ≥1 park. */
function isMeaningful(data: NearbyResponse): boolean {
  if (data.type === 'in_park') return true;
  if (data.type === 'nearby_parks') return ((data.data as NearbyParksData).parks?.length ?? 0) > 0;
  return false;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Read from localStorage. Returns undefined when:
 * - No entry exists
 * - Entry is older than CACHE_MAX_AGE_MS
 * - Both current and cached coords are present and user has moved > CACHE_COORD_MAX_DIST_KM
 *
 * Pass null for both coords to skip the distance check (used at init time before GPS resolves).
 */
function readCache(
  currentLat: number | null,
  currentLng: number | null
): NearbyResponse | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cached: CachedNearby = JSON.parse(raw);
    if (!cached?.data || !cached.cachedAt) return undefined;
    if (Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS) return undefined;
    if (
      currentLat != null &&
      currentLng != null &&
      cached.lat != null &&
      cached.lng != null &&
      haversineKm(currentLat, currentLng, cached.lat, cached.lng) > CACHE_COORD_MAX_DIST_KM
    ) {
      return undefined;
    }
    return cached.data;
  } catch {
    return undefined;
  }
}

function writeCache(data: NearbyResponse, lat: number | null, lng: number | null): void {
  try {
    const entry: CachedNearby = { data, cachedAt: Date.now(), lat, lng };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
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
    staleTime: CACHE_MAX_AGE_MS,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Homepage nearby-parks query with the shared canonical params. All homepage consumers
 * share one underlying request via React Query deduplication.
 */
export function useHomeNearbyParks() {
  return useNearbyParks({ radiusInMeters: HOME_NEARBY_RADIUS_M, limit: HOME_NEARBY_LIMIT });
}
