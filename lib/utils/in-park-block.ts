/**
 * What the park page's "near you" row shows, as one pure decision.
 *
 * The row sits at the top of the park page and is server-rendered at one fixed height, because
 * the server cannot know any of the inputs below. Every state except `inPark` fills that one row
 * and nothing else; `inPark` adds the ride lists under it. Kept out of the component so the
 * decision is testable without a browser (`pnpm test:in-park-block`).
 */
import { calculateDistance } from '@/lib/utils/distance-utils';
import type { AttractionWithDistance, NearbyAttractionsData, NearbyResponse } from '@/types/nearby';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';

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
   * Inside this park. `showDistances` is false when the fix is coarser than the in-park radius:
   * the backend still placed the visitor in the park, but a per-ride distance would be noise.
   */
  | { kind: 'inPark'; rides: AttractionWithDistance[]; showDistances: boolean };

export interface InParkBlockInput {
  parkId: string;
  parkLatitude: number | null | undefined;
  parkLongitude: number | null | undefined;
  /** Ride id → coordinates, from the park page's own attraction list. */
  rideCoordinates: ReadonlyMap<string, { lat: number; lng: number }>;
  nearby: NearbyResponse | undefined;
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
  initialCheckDone: boolean;
  loading: boolean;
  /**
   * `?sim=` is set (dev and preview only). When the simulated answer places the visitor in this
   * park, no fix is needed and none is used; otherwise the real inputs decide as usual.
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
 * The API's distances were measured from the position the request carried, which can be up to a
 * refresh interval old. Where the page knows a ride's point, measure again from the current fix.
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

export function resolveInParkBlock(input: InParkBlockInput): InParkBlockState {
  const data = inParkDataFor(input.nearby, input.parkId);

  if (input.simulated && data) {
    // The simulated answer was computed from preset coordinates; a real fix (the reader's desk)
    // would turn every distance into kilometres, so the API's numbers are the only honest ones.
    return { kind: 'inPark', rides: data.rides ?? [], showDistances: true };
  }

  if (!input.initialCheckDone) return { kind: 'pending' };
  if (input.permissionDenied) return { kind: 'blocked' };
  if (!input.permissionGranted) return { kind: 'ask' };
  if (!input.position) return input.loading ? { kind: 'pending' } : { kind: 'ask' };

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
