import { useEffect, useRef } from 'react';
import {
  trackNearbyPermissionGranted,
  trackNearbyPermissionDenied,
  trackNearbyParksLoaded,
  trackNearbyInParkDetected,
} from '@/lib/analytics/umami';
import { stripNewPrefix } from '@/lib/utils';
import type { GeolocationPosition } from '@/lib/contexts/geolocation-context';
import type { NearbyResponse, NearbyParksData, NearbyAttractionsData } from '@/types/nearby';

interface UseNearbyAnalyticsParams {
  nearbyData: NearbyResponse | undefined;
  position: GeolocationPosition | null;
  permissionDenied: boolean;
  locationSource: 'gps' | 'ip';
  setIsInPark: (inPark: boolean) => void;
}

/**
 * Fires the nearby-card analytics events (parks/in-park loaded, permission granted/denied) and
 * keeps the geolocation context's in-park flag in sync. Extracted verbatim from NearbyParksCard;
 * the effects, their dependency arrays and firing conditions are preserved exactly so events
 * neither double-fire nor go missing.
 */
export function useNearbyAnalytics({
  nearbyData,
  position,
  permissionDenied,
  locationSource,
  setIsInPark,
}: UseNearbyAnalyticsParams): void {
  const hasTrackedGranted = useRef(false);
  const hasTrackedDenied = useRef(false);
  const lastTrackedDataKey = useRef<string | null>(null);

  // Track analytics when nearby data changes (once per result, include source: gps | ip)
  useEffect(() => {
    if (!nearbyData) return;

    const dataKey =
      nearbyData.type === 'nearby_parks'
        ? `parks-${(nearbyData.data as NearbyParksData).parks.length}-${locationSource}`
        : `in_park-${(nearbyData.data as NearbyAttractionsData).park?.id}-${locationSource}`;
    if (lastTrackedDataKey.current === dataKey) return;
    lastTrackedDataKey.current = dataKey;

    const geoAllowed = !!position;

    if (nearbyData.type === 'nearby_parks') {
      trackNearbyParksLoaded({
        count: (nearbyData.data as NearbyParksData).parks.length,
        type: 'nearby_parks',
        in_park: false,
        geo_allowed: geoAllowed,
        source: locationSource,
      });
      setIsInPark(false);
    } else if (nearbyData.type === 'in_park') {
      const parkData = nearbyData.data as NearbyAttractionsData;
      if (!parkData?.park) return;
      trackNearbyParksLoaded({
        count: 1,
        type: 'in_park',
        in_park: true,
        geo_allowed: geoAllowed,
        source: locationSource,
        parkId: parkData.park.id,
        parkName: stripNewPrefix(parkData.park.name),
      });
      trackNearbyInParkDetected({
        parkId: parkData.park.id,
        parkName: stripNewPrefix(parkData.park.name),
        geo_allowed: geoAllowed,
      });
      setIsInPark(true);
    }
  }, [nearbyData, setIsInPark, locationSource, position]);

  // Track permission granted once when user grants location
  useEffect(() => {
    if (position && !permissionDenied && !hasTrackedGranted.current) {
      hasTrackedGranted.current = true;
      trackNearbyPermissionGranted();
    }
    if (!position) hasTrackedGranted.current = false;
  }, [position, permissionDenied]);

  // Track permission denied once when user denies location
  useEffect(() => {
    if (permissionDenied && !hasTrackedDenied.current) {
      hasTrackedDenied.current = true;
      trackNearbyPermissionDenied();
    }
    if (!permissionDenied) hasTrackedDenied.current = false;
  }, [permissionDenied]);
}
