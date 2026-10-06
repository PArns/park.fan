'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { resolveInParkBlock, type InParkBlockState } from '@/lib/utils/in-park-block';

type RideCoordinates = ReadonlyMap<string, { lat: number; lng: number }>;

const subscribeNever = () => () => {};
const NO_RIDE_COORDINATES: RideCoordinates = new Map();
const PENDING: InParkBlockState = { kind: 'pending' };

/** The rides' positions by id, the `rideCoordinates` argument of {@link useInParkBlock}. */
export function useRideCoordinates(
  attractions:
    readonly { id: string; latitude: number | null; longitude: number | null }[] | undefined
): RideCoordinates {
  return useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    for (const a of attractions ?? []) {
      if (a.latitude != null && a.longitude != null) {
        map.set(a.id, { lat: a.latitude, lng: a.longitude });
      }
    }
    return map;
  }, [attractions]);
}

/**
 * Where the visitor stands relative to this park, as `resolveInParkBlock` decides it.
 *
 * Two page parts read it: the location line in the park's title card (`ParkLocationLine`), which
 * only needs the kind, and the ride lists under it (`ParkInParkBlock`), which also need the rides.
 * Both read the same context and the same `/api/nearby` cache, so the second caller adds no request
 * and no read of the position. `rideCoordinates` is only used to measure the rides again from the
 * current fix; a caller that shows no rides leaves it out.
 *
 * Everything here reads browser state, so the server pass and the hydration pass both answer
 * `pending` — a local guard, not the provider's (the rule in
 * docs/rules/a-client-only-preference-may-not-decide-server-rendered-markup.md).
 */
export function useInParkBlock(
  park: { id: string; latitude: number | null; longitude: number | null },
  rideCoordinates: RideCoordinates = NO_RIDE_COORDINATES
): InParkBlockState {
  const { position, accuracy, loading, permissionGranted, permissionDenied, initialCheckDone } =
    useGeolocation();
  const nearbyQuery = useHomeNearbyParks();
  const nearby = nearbyQuery.data;
  // `placeholderData` counts too: when the fix arrives, the query key changes and React Query
  // paints the previous answer (usually the GeoIP one) until the request with coordinates returns.
  const nearbyPending = nearbyQuery.isPending || nearbyQuery.isPlaceholderData;

  const mounted = useMounted();
  const simulated = useSyncExternalStore(
    subscribeNever,
    () => new URLSearchParams(window.location.search).has('sim'),
    () => false
  );

  return useMemo(
    () =>
      mounted
        ? resolveInParkBlock({
            parkId: park.id,
            parkLatitude: park.latitude,
            parkLongitude: park.longitude,
            rideCoordinates,
            nearby,
            nearbyPending,
            position,
            accuracy,
            permissionGranted,
            permissionDenied,
            initialCheckDone,
            loading,
            simulated,
          })
        : PENDING,
    [
      mounted,
      park.id,
      park.latitude,
      park.longitude,
      rideCoordinates,
      nearby,
      nearbyPending,
      position,
      accuracy,
      permissionGranted,
      permissionDenied,
      initialCheckDone,
      loading,
      simulated,
    ]
  );
}
