import { useEffect, useRef } from 'react';
import {
  trackNearbyPermissionGranted,
  trackNearbyPermissionDenied,
  trackNearbyParksLoaded,
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
 * keeps the geolocation context's in-park flag in sync. Extracted from NearbyParksCard; the
 * effects and their firing conditions are preserved so events neither double-fire nor go missing.
 *
 * These fire on *load*, not on a click, so they are the most expensive events on the site — every
 * property is billed as another event. `nearby_in_park_detected` was dropped for that reason: it
 * restated `nearby_parks_loaded` with `type: 'in_park'` and cost four billed rows to do it. So did
 * `in_park` (it is `type === 'in_park'`), `geo_allowed` (it is `source === 'gps'`) and `parkId`
 * (the same park as `parkName`). See `lib/analytics/umami.ts` for the property budget.
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

    if (nearbyData.type === 'nearby_parks') {
      trackNearbyParksLoaded({
        count: (nearbyData.data as NearbyParksData).parks.length,
        type: 'nearby_parks',
        source: locationSource,
      });
      setIsInPark(false);
    } else if (nearbyData.type === 'in_park') {
      const parkData = nearbyData.data as NearbyAttractionsData;
      if (!parkData?.park) return;
      trackNearbyParksLoaded({
        count: 1,
        type: 'in_park',
        source: locationSource,
        parkName: stripNewPrefix(parkData.park.name),
      });
      setIsInPark(true);
    }
  }, [nearbyData, setIsInPark, locationSource]);

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
