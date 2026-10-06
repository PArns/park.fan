'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ParkWithAttractions,
  ParkAttraction,
  ParkShow,
  ParkRestaurant,
} from '@/lib/api/types';
import { useGeolocation, type GeolocationPosition } from '@/lib/contexts/geolocation-context';
import { calculateDistance } from '@/lib/utils/distance-utils';
import { stripNewPrefix } from '@/lib/utils';

const IN_PARK_THRESHOLD = 1000; // 1km in meters

export interface EntityWithDistance {
  id: string;
  name: string;
  type: 'attraction' | 'show' | 'restaurant';
  distance: number;
  latitude: number;
  longitude: number;
  data: ParkAttraction | ParkShow | ParkRestaurant;
}

export interface ParkMapGeolocation {
  userLocation: { lat: number; lng: number } | null;
  nearbyEntities: EntityWithDistance[];
  distanceToPark: number | null;
  isInPark: boolean;
}

/**
 * Geolocation for the park map: the visitor's position from the geolocation context, and
 * distance-to-park, in-park state and the five nearest entities while inside the park. The map
 * never asks for location itself: in Chrome, ignored prompts block the site for a week. See
 * docs/rules/location-is-asked-for-where-it-is-needed.md.
 */
export function useParkMapGeolocation(
  park: ParkWithAttractions,
  validAttractions: ParkAttraction[],
  validShows: ParkShow[],
  validRestaurants: ParkRestaurant[]
): ParkMapGeolocation {
  const { position, permissionGranted } = useGeolocation();

  // A fix from the in-park watch below, and the context position it replaced. The watch is newer
  // than the context until the context itself moves on (a new object: it keeps its identity while
  // the fix does not move), so the two sources never fight over the marker.
  const [followed, setFollowed] = useState<{
    over: GeolocationPosition | null;
    at: { lat: number; lng: number };
  } | null>(null);
  const contextPositionRef = useRef(position);
  useEffect(() => {
    contextPositionRef.current = position;
  }, [position]);

  const userLocation = followed && followed.over === position ? followed.at : position;

  const { nearbyEntities, distanceToPark, isInPark } = useMemo(() => {
    // `!= null` rather than truthiness: 0 is a legal coordinate, and these values
    // are parsed to real numbers at the fetch boundary (lib/api/coordinates).
    if (!userLocation || park.latitude == null || park.longitude == null) {
      return { nearbyEntities: [] as EntityWithDistance[], distanceToPark: null, isInPark: false };
    }

    const dist = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      park.latitude,
      park.longitude
    );
    const inPark = dist < IN_PARK_THRESHOLD;

    if (!inPark) {
      return { nearbyEntities: [] as EntityWithDistance[], distanceToPark: dist, isInPark: false };
    }

    const entities: EntityWithDistance[] = [];

    validAttractions.forEach((attraction) => {
      if (attraction.latitude != null && attraction.longitude != null) {
        entities.push({
          id: attraction.id,
          name: stripNewPrefix(attraction.name),
          type: 'attraction',
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            attraction.latitude,
            attraction.longitude
          ),
          latitude: attraction.latitude,
          longitude: attraction.longitude,
          data: attraction,
        });
      }
    });

    validShows.forEach((show) => {
      if (show.latitude != null && show.longitude != null) {
        entities.push({
          id: show.id,
          name: stripNewPrefix(show.name),
          type: 'show',
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            show.latitude,
            show.longitude
          ),
          latitude: show.latitude,
          longitude: show.longitude,
          data: show,
        });
      }
    });

    validRestaurants.forEach((restaurant) => {
      if (restaurant.latitude != null && restaurant.longitude != null) {
        entities.push({
          id: restaurant.id,
          name: stripNewPrefix(restaurant.name),
          type: 'restaurant',
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            restaurant.latitude,
            restaurant.longitude
          ),
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          data: restaurant,
        });
      }
    });

    return {
      nearbyEntities: entities.sort((a, b) => a.distance - b.distance).slice(0, 5),
      distanceToPark: dist,
      isInPark: true,
    };
  }, [userLocation, park.latitude, park.longitude, validAttractions, validShows, validRestaurants]);

  // In the park, follow the visitor with `watchPosition`, which calls back only on movement
  // instead of waking the hardware on a timer. Only while the grant holds: a watch started after
  // a one-time grant ran out would open a prompt.
  useEffect(() => {
    if (!isInPark || !permissionGranted) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (fix) => {
        const { latitude, longitude } = fix.coords;
        // Preserve identity while stationary so an unchanged fix doesn't
        // re-render the map tree.
        setFollowed((prev) =>
          prev &&
          prev.over === contextPositionRef.current &&
          prev.at.lat === latitude &&
          prev.at.lng === longitude
            ? prev
            : { over: contextPositionRef.current, at: { lat: latitude, lng: longitude } }
        );
      },
      () => {
        // Permission revoked or position unavailable — keep the last fix.
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isInPark, permissionGranted]);

  return { userLocation, nearbyEntities, distanceToPark, isInPark };
}
