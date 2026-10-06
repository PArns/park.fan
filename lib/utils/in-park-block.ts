/**
 * Where the visitor stands relative to the park page's park, as one pure decision for
 * `ParkLocationLine` and, when in the park, `ParkInParkBlock`. Kept out of the components so
 * `pnpm test:in-park-block` can run it without a browser.
 */
import { calculateDistance } from '@/lib/utils/distance-utils';
import type { AttractionWithDistance, NearbyAttractionsData, NearbyResponse } from '@/types/nearby';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';

/** What the in-park line and block show. */
export type InParkBlockState =
  /** Nothing known yet (before the permission check, or a fix is on its way). Row invisible. */
  | { kind: 'pending' }
  /** Location not granted: a button that asks only when tapped. */
  | { kind: 'ask' }
  /** The browser has denied location; asking again would do nothing. */
  | { kind: 'blocked' }
  /** A fix exists and it is not inside this park. `distanceM` is null when the park has no point. */
  | { kind: 'away'; distanceM: number | null }
  /**
   * Inside this park. `showDistances` is false when the fix is coarser than the in-park radius,
   * where a per-ride distance would be noise.
   */
  | { kind: 'inPark'; rides: AttractionWithDistance[]; showDistances: boolean };

/** Everything {@link resolveInParkBlock} decides from. */
export interface InParkBlockInput {
  parkId: string;
  parkLatitude: number | null | undefined;
  parkLongitude: number | null | undefined;
  /** Ride id → coordinates, from the park page's own attraction list. */
  rideCoordinates: ReadonlyMap<string, { lat: number; lng: number }>;
  nearby: NearbyResponse | undefined;
  /**
   * The nearby query has no answer for the current key yet (`isPending`, or still showing the
   * previous key's `placeholderData`). With a fix in hand this must not read as „away".
   */
  nearbyPending: boolean;
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
  initialCheckDone: boolean;
  loading: boolean;
  /**
   * `?sim=` is set (dev and preview only). A simulated in-park answer needs no fix; otherwise the
   * real inputs decide.
   */
  simulated: boolean;
}

/** The nearby answer's park data, when it places the visitor inside `parkId`. */
function inParkDataFor(nearby: NearbyResponse | undefined, parkId: string) {
  if (nearby?.type !== 'in_park') return null;
  const data = nearby.data as NearbyAttractionsData;
  return data?.park?.id === parkId ? data : null;
}

/**
 * Re-measures ride distances from the current fix where the page knows a ride's point, since the
 * API measured from the position the request carried, up to a refresh interval old.
 */
export function withCurrentDistances(
  rides: AttractionWithDistance[],
  position: { lat: number; lng: number },
  rideCoordinates: ReadonlyMap<string, { lat: number; lng: number }>
): AttractionWithDistance[] {
  return rides.map((ride) => {
    const point = rideCoordinates.get(ride.id);
    if (!point) return ride;
    return {
      ...ride,
      distance: Math.round(calculateDistance(position.lat, position.lng, point.lat, point.lng)),
    };
  });
}

/** Decides what the in-park line and block show for the current location state. */
export function resolveInParkBlock(input: InParkBlockInput): InParkBlockState {
  const data = inParkDataFor(input.nearby, input.parkId);

  if (input.simulated && data) {
    // Computed from preset coordinates; a real fix (the developer's desk) would make every distance
    // kilometres, so the API's numbers are the only honest ones.
    return { kind: 'inPark', rides: data.rides ?? [], showDistances: true };
  }

  if (!input.initialCheckDone) return { kind: 'pending' };
  if (input.permissionDenied) return { kind: 'blocked' };
  if (!input.permissionGranted) return { kind: 'ask' };
  if (!input.position) return input.loading ? { kind: 'pending' } : { kind: 'ask' };

  if (!data && input.nearbyPending) return { kind: 'pending' };

  if (data) {
    const showDistances = input.accuracy == null || input.accuracy <= IN_PARK_FALLBACK_DISTANCE_M;
    const rides = data.rides ?? [];
    return {
      kind: 'inPark',
      rides: showDistances
        ? withCurrentDistances(rides, input.position, input.rideCoordinates)
        : rides,
      showDistances,
    };
  }

  const distanceM =
    input.parkLatitude != null && input.parkLongitude != null
      ? calculateDistance(
          input.position.lat,
          input.position.lng,
          input.parkLatitude,
          input.parkLongitude
        )
      : null;
  return { kind: 'away', distanceM };
}
