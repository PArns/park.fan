import type { NearbyResponse, NearbyParksData } from '@/types/nearby';

/**
 * The last nearby answer, persisted so a returning visitor sees parks before the network does
 * anything. `useNearbyParks` reads it twice: as `placeholderData` (paint only) and as
 * `initialData` (counts as data, so `staleTime` applies and a load inside the window sends no
 * request at all). The second use is why the guards below matter — an entry that seeds a query
 * it cannot answer does not just look wrong, it suppresses the request that would fix it.
 *
 * Kept free of React and of anything with a `.tsx` extension so `scripts/test-nearby-cache.mjs`
 * can import it directly.
 */

export const CACHE_KEY = 'nearby-parks-v2';
export const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // matches the hook's staleTime
/** Skip a cached entry once the user has moved more than this far since it was written. */
export const CACHE_COORD_MAX_DIST_KM = 10;

export interface CachedNearby {
  data: NearbyResponse;
  cachedAt: number;
  lat: number | null;
  lng: number | null;
}

/** Only count results that are worth showing — in_park always qualifies, nearby_parks needs ≥1 park. */
export function isMeaningful(data: NearbyResponse): boolean {
  if (data.type === 'in_park') return true;
  if (data.type === 'nearby_parks') return ((data.data as NearbyParksData).parks?.length ?? 0) > 0;
  return false;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * An entry answers a question, and the question is "where am I" asked either with real
 * coordinates or without them. An entry written without coordinates is a GeoIP answer —
 * city-level at best, never able to resolve the 1 km in-park radius — so it may not stand in
 * for a query that carries coordinates, and vice versa. The distance check cannot cover this:
 * it needs coordinates on both sides, and one side has none.
 *
 * Without this check the entry the IP request had just written seeded the first GPS query, and
 * because `initialDataUpdatedAt` dated it to a moment ago, `staleTime` held that request back
 * for five minutes. A visitor who opened the homepage and then granted location — the ordinary
 * first visit, and the only order that happens inside a park — kept reading the generic
 * headline while standing in front of the gate.
 */
export function sameLocationBasis(
  currentLat: number | null,
  currentLng: number | null,
  cached: Pick<CachedNearby, 'lat' | 'lng'>
): boolean {
  const queryHasCoords = currentLat != null && currentLng != null;
  const entryHasCoords = cached.lat != null && cached.lng != null;
  return queryHasCoords === entryHasCoords;
}

/**
 * Read from localStorage. Returns undefined when:
 * - No entry exists, or it is unreadable
 * - The entry is older than CACHE_MAX_AGE_MS
 * - The entry and the current query do not share a location basis (see sameLocationBasis)
 * - Both carry coordinates and the user has moved more than CACHE_COORD_MAX_DIST_KM
 *
 * Pass null for both coords to ask for the GeoIP-based entry (used at init time before GPS
 * resolves); an entry written from coordinates is not returned for that call.
 */
export function readCacheEntry(
  currentLat: number | null,
  currentLng: number | null
): CachedNearby | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const cached: CachedNearby = JSON.parse(raw);
    if (!cached?.data || !cached.cachedAt) return undefined;
    if (Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS) return undefined;
    if (!sameLocationBasis(currentLat, currentLng, cached)) return undefined;
    if (
      currentLat != null &&
      currentLng != null &&
      cached.lat != null &&
      cached.lng != null &&
      haversineKm(currentLat, currentLng, cached.lat, cached.lng) > CACHE_COORD_MAX_DIST_KM
    ) {
      return undefined;
    }
    return cached;
  } catch {
    return undefined;
  }
}

export function readCache(
  currentLat: number | null,
  currentLng: number | null
): NearbyResponse | undefined {
  return readCacheEntry(currentLat, currentLng)?.data;
}

export function writeCache(data: NearbyResponse, lat: number | null, lng: number | null): void {
  try {
    const entry: CachedNearby = { data, cachedAt: Date.now(), lat, lng };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}
