import { useEffect, useRef } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
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

/** The nearby results already counted in this tab, by type and source. */
const countedNearby = new Set<string>();

/**
 * Counts `nearby_parks_loaded` the first time this tab gets a nearby result of a type from a
 * source. The card mounts again on every page that has one, with fresh refs, so a per-mount check
 * would count every page view of a visitor who stays on the same answer. No park is sent: the
 * park an in-park result is about is derived from where the visitor stands.
 */
export function countNearbyResultOnce(
  type: 'nearby_parks' | 'in_park',
  source: 'gps' | 'ip'
): void {
  const key = `${type}-${source}`;
  if (countedNearby.has(key)) return;
  countedNearby.add(key);
  trackSiteEvent('nearby_parks_loaded', { type, source });
}

/**
 * Counts the nearby-card events (`nearby_parks_loaded`, `nearby_permission`) and keeps the
 * geolocation context's in-park flag in sync. They fire on load, not on a click, which costs
 * nothing in our own statistic; a property on an Umami event would be billed per page view.
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
      countNearbyResultOnce('nearby_parks', locationSource);
      setIsInPark(false);
    } else if (nearbyData.type === 'in_park') {
      const parkData = nearbyData.data as NearbyAttractionsData;
      if (!parkData?.park) return;
      countNearbyResultOnce('in_park', locationSource);
      setIsInPark(true);
    }
  }, [nearbyData, setIsInPark, locationSource]);

  useEffect(() => {
    if (position && !permissionDenied && !hasTrackedGranted.current) {
      hasTrackedGranted.current = true;
      trackSiteEvent('nearby_permission', { result: 'granted' });
    }
    if (!position) hasTrackedGranted.current = false;
  }, [position, permissionDenied]);

  // The context also reports a denial stored from an earlier visit once its check has run. That
  // is not an answer given now, and counting it would count every page view of every visitor who
  // ever said no, so the first state seen after the check counts as tracked.
  useEffect(() => {
    if (!initialCheckDone) return;
    if (!seenCheck.current) {
      seenCheck.current = true;
      hasTrackedDenied.current = permissionDenied;
      return;
    }
    if (permissionDenied && !hasTrackedDenied.current) {
      hasTrackedDenied.current = true;
      trackSiteEvent('nearby_permission', { result: 'denied' });
    }
    if (!permissionDenied) hasTrackedDenied.current = false;
  }, [permissionDenied, initialCheckDone]);
}
