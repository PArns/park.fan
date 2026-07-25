'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ParkWithAttractions,
  ParkAttraction,
  ParkShow,
  ParkRestaurant,
} from '@/lib/api/types';
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
 * Geolocation for the park map: acquires the visitor's position on mount
 * (GDPR compliant — no cookie storage), and derives distance-to-park,
 * in-park state and the five nearest entities while inside the park.
 */
export function useParkMapGeolocation(
  park: ParkWithAttractions,
  validAttractions: ParkAttraction[],
  validShows: ParkShow[],
  validRestaurants: ParkRestaurant[]
): ParkMapGeolocation {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      () => {
        // User denied or position unavailable — expected, no action needed
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
      }
    );
  };

  // Automatically request location on mount (GDPR compliant - no cookie storage)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      requestLocation();
    }
  }, []);

  const { nearbyEntities, distanceToPark, isInPark } = useMemo(() => {
    if (!userLocation || !park.latitude || !park.longitude) {
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
      if (attraction.latitude && attraction.longitude) {
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
      if (show.latitude && show.longitude) {
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
      if (restaurant.latitude && restaurant.longitude) {
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

  // When in-park, follow the visitor via watchPosition for responsive
  // nearby-entity updates. Unlike the old 5s getCurrentPosition poll this lets
  // the browser drive the geolocation hardware (callbacks only on movement) —
  // no fixed-interval wakeups, far less battery/CPU on the device actually
  // walking around a park. Outside the park the geolocation context already
  // refreshes at 5-min intervals.
  useEffect(() => {
    if (!isInPark || typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Preserve identity while stationary so an unchanged fix doesn't
        // re-render the map tree.
        setUserLocation((prev) =>
          prev && prev.lat === latitude && prev.lng === longitude
            ? prev
            : { lat: latitude, lng: longitude }
        );
      },
      () => {
        // Permission revoked or position unavailable — keep the last fix.
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isInPark]);

  return { userLocation, nearbyEntities, distanceToPark, isInPark };
}
