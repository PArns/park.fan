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

/**
 * Where the visitor is, for "X km away" purposes — GPS when they granted location, otherwise the
 * coarse GeoIP position the backend resolved from their IP.
 *
 * Both sources are already on every page: the geolocation context lives in the locale layout, and
 * the nearby query runs from the header on every route — so this reads two caches and issues no
 * request of its own. Using the same GeoIP fallback the homepage nearby card relies on is what
 * makes distances show up in the same situations here as they do there, instead of only for
 * visitors who granted location.
 *
 * Null when neither source has a position yet (always the case during server rendering).
 */
export function useViewerPosition(): ViewerPosition | null {
  const { position } = useGeolocation();
  const { data } = useHomeNearbyParks();
  const userLocation = data?.userLocation;

  return useMemo(() => {
    if (position) return { lat: position.lat, lng: position.lng, precise: true };
    if (!userLocation) return null;
    const lat = Number(userLocation.latitude);
    const lng = Number(userLocation.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    // /api/nearby answers (0, 0) when it had no usable client IP to geolocate (bots, local
    // addresses, privacy proxies) — a sentinel, not a position in the Gulf of Guinea.
    if (lat === 0 && lng === 0) return null;
    return { lat, lng, precise: false };
  }, [position, userLocation]);
}

/**
 * Distance in meters from the visitor to a single point, or null when we can't say (no position
 * yet, or the park has no coordinates).
 *
 * The server always renders null; the value appears once a position resolves on the client.
 */
export function useDistanceTo(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): number | null {
  const viewer = useViewerPosition();

  // Coordinates are typed as numbers but decimal columns have leaked through as strings before.
  const lat = latitude == null ? NaN : Number(latitude);
  const lng = longitude == null ? NaN : Number(longitude);

  return useMemo(() => {
    if (!viewer || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return calculateDistance(viewer.lat, viewer.lng, lat, lng);
  }, [viewer, lat, lng]);
}

/**
 * Distance in meters to the CLOSEST of many parks — what a continent or country card shows.
 * Null when there is no position or the region has no geocoded park.
 */
export function useNearestDistance(coordinates: readonly Coordinate[] | undefined): number | null {
  const viewer = useViewerPosition();

  return useMemo(() => {
    if (!viewer || !coordinates?.length) return null;
    return nearestDistance(viewer.lat, viewer.lng, coordinates);
  }, [viewer, coordinates]);
}
