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
  /** The context's permission check has run; a denial present at that point was stored, not answered. */
  initialCheckDone: boolean;
  locationSource: 'gps' | 'ip';
  setIsInPark: (inPark: boolean) => void;
}

/**
 * Fires the nearby-card analytics events (parks or in-park loaded, permission granted or denied)
 * and keeps the geolocation context's in-park flag in sync. They fire on load, not on a click, so
 * every property is billed on a great many page views; see docs/rules/umami-event-budget.md.
 */
export function useNearbyAnalytics({
  nearbyData,
  position,
  permissionDenied,
  initialCheckDone,
  locationSource,
  setIsInPark,
}: UseNearbyAnalyticsParams): void {
  const hasTrackedGranted = useRef(false);
  const hasTrackedDenied = useRef(false);
  const seenCheck = useRef(false);
  const lastTrackedDataKey = useRef<string | null>(null);

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
        type: 'nearby_parks',
        source: locationSource,
      });
      setIsInPark(false);
    } else if (nearbyData.type === 'in_park') {
      const parkData = nearbyData.data as NearbyAttractionsData;
      if (!parkData?.park) return;
      trackNearbyParksLoaded({
        type: 'in_park',
        source: locationSource,
        parkName: stripNewPrefix(parkData.park.name),
      });
      setIsInPark(true);
    }
  }, [nearbyData, setIsInPark, locationSource]);

  useEffect(() => {
    if (position && !permissionDenied && !hasTrackedGranted.current) {
      hasTrackedGranted.current = true;
      trackNearbyPermissionGranted();
    }
    if (!position) hasTrackedGranted.current = false;
  }, [position, permissionDenied]);

  // The context also reports a denial stored from an earlier visit once its check has run. That
  // is not an answer given now, and counting it would bill an event on every page view of every
  // visitor who ever said no, so the first state seen after the check counts as tracked.
  useEffect(() => {
    if (!initialCheckDone) return;
    if (!seenCheck.current) {
      seenCheck.current = true;
      hasTrackedDenied.current = permissionDenied;
      return;
    }
    if (permissionDenied && !hasTrackedDenied.current) {
      hasTrackedDenied.current = true;
      trackNearbyPermissionDenied();
    }
    if (!permissionDenied) hasTrackedDenied.current = false;
  }, [permissionDenied, initialCheckDone]);
}
