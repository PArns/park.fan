'use client';

import { useMemo } from 'react';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { calculateDistance, nearestDistance, type Coordinate } from '@/lib/utils/distance-utils';

export interface ViewerPosition {
  lat: number;
  lng: number;
  /** True for a GPS fix, false for the coarse (city-level) GeoIP fallback. */
  precise: boolean;
}

export interface ViewerPositionState {
  position: ViewerPosition | null;
  /**
   * True while a position may still arrive. Goes false for good once both sources have settled
   * without one — so a placeholder can reserve space while waiting and then collapse, instead of
   * pulsing forever for visitors who will never have a position (denied + no geolocatable IP).
   */
  pending: boolean;
}

/**
 * Where the visitor is, for "X km away" purposes — GPS when they granted location, otherwise the
 * coarse GeoIP position the backend resolved from their IP — plus whether one may still arrive.
 *
 * Both sources are already on every page: the geolocation context lives in the locale layout, and
 * the nearby query runs from the header on every route — so this reads two caches and issues no
 * request of its own. Using the same GeoIP fallback the homepage nearby card relies on is what
 * makes distances show up in the same situations here as they do there, instead of only for
 * visitors who granted location.
 *
 * On the server both fields are `null` / `true`: nothing is known there, and a position is still
 * expected on the client.
 */
export function useViewerPositionState(): ViewerPositionState {
  const { position, loading, initialCheckDone } = useGeolocation();
  const nearby = useHomeNearbyParks();
  const userLocation = nearby.data?.userLocation;
  // The nearby query is `enabled`-gated behind the after-load idle callback, so it reports
  // `isPending` both while gated and while in flight — either way a GeoIP position may still
  // land. `isError` and a settled response are the terminal states.
  const nearbySettled = nearby.isError || !nearby.isPending;

  return useMemo(() => {
    const resolved = resolvePosition(position, userLocation);
    // A GPS lookup in flight (or not yet attempted) can still supersede the GeoIP fallback, but
    // once we HAVE a position there is nothing left to wait for.
    const pending = resolved === null && (!initialCheckDone || loading || !nearbySettled);
    return { position: resolved, pending };
  }, [position, userLocation, initialCheckDone, loading, nearbySettled]);
}

function resolvePosition(
  position: { lat: number; lng: number } | null,
  userLocation: { latitude: number; longitude: number } | undefined
): ViewerPosition | null {
  if (position) return { lat: position.lat, lng: position.lng, precise: true };
  if (!userLocation) return null;
  const lat = Number(userLocation.latitude);
  const lng = Number(userLocation.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // /api/nearby answers (0, 0) when it had no usable client IP to geolocate (bots, local
  // addresses, privacy proxies) — a sentinel, not a position in the Gulf of Guinea.
  if (lat === 0 && lng === 0) return null;
  return { lat, lng, precise: false };
}

/** {@link useViewerPositionState} without the pending flag, for callers that only need the value. */
export function useViewerPosition(): ViewerPosition | null {
  return useViewerPositionState().position;
}

export interface DistanceState {
  /** Meters, or null when we can't say. */
  meters: number | null;
  /** True while a position may still arrive — render a placeholder rather than nothing. */
  pending: boolean;
}

/**
 * Distance in meters from the visitor to a single point, or null when we can't say (no position,
 * or the park has no coordinates).
 *
 * The server always renders null/pending; the value appears once a position resolves on the
 * client. `pending` is false when the point itself has no coordinates — no amount of waiting
 * produces a distance to an ungeocoded park.
 */
export function useDistanceTo(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): DistanceState {
  const { position, pending } = useViewerPositionState();

  // Coordinates are typed as numbers but decimal columns have leaked through as strings before.
  const lat = latitude == null ? NaN : Number(latitude);
  const lng = longitude == null ? NaN : Number(longitude);

  return useMemo(() => {
    const known = Number.isFinite(lat) && Number.isFinite(lng);
    if (!known) return { meters: null, pending: false };
    if (!position) return { meters: null, pending };
    return { meters: calculateDistance(position.lat, position.lng, lat, lng), pending: false };
  }, [position, pending, lat, lng]);
}

/**
 * Distance in meters to the CLOSEST of many parks — what a continent or country card shows.
 * Null when there is no position or the region has no geocoded park (the latter is never
 * `pending`: an empty coordinate list stays empty).
 */
export function useNearestDistance(coordinates: readonly Coordinate[] | undefined): DistanceState {
  const { position, pending } = useViewerPositionState();

  return useMemo(() => {
    if (!coordinates?.length) return { meters: null, pending: false };
    if (!position) return { meters: null, pending };
    return { meters: nearestDistance(position.lat, position.lng, coordinates), pending: false };
  }, [position, pending, coordinates]);
}
