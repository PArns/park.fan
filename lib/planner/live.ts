import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * What the live park payload contributes to a plan.
 *
 * The standby minutes that correct a block whose hour is now, and which rides
 * are reporting closed. Showtimes used to be read here too and are not any
 * more: the live payload only ever knew today's, while `/plan/day` answers for
 * every date the picker offers (`lib/planner/shows.ts`).
 */

/**
 * Standby minutes per ride slug, or `null` where the park has no readable feed.
 *
 * `null` and an empty map are different answers and the caller must not conflate
 * them. A park with no wait-time source aggregates to zero over an empty set and
 * is byte-for-byte a park shut for the night, so the curated flag is the only
 * signal — never the queues themselves.
 */
export function liveWaitsFor(
  park: ParkWithAttractions | undefined | null
): Map<string, number> | null {
  if (!park) return null;
  if (!hasReadableWaitTimes(park)) return null;

  const out = new Map<string, number>();
  for (const attraction of park.attractions ?? []) {
    // The house helpers, not a third copy of "which queue do people mean" and
    // "is this ride actually open". `getLiveAttractionStatus` prefers the API's
    // `effectiveStatus`, which is the only source that knows a ride is out of
    // season — and a queue row keeps its last value after a feed stops
    // publishing, so reading the number alone still says 45 minutes at midnight.
    if (getLiveAttractionStatus(attraction, park.status) !== 'OPERATING') continue;
    const minutes = getStandbyWait(attraction);
    if (typeof minutes === 'number') out.set(attraction.slug, minutes);
  }
  return out;
}

/**
 * Rides reporting closed right now.
 *
 * Deliberately NOT the complement of {@link liveWaitsFor}: a ride can be open
 * and simply have no standby queue, and calling that closed would put a warning
 * on a ride somebody can walk onto. This asks the status directly, and only
 * where the park itself is open — inside a shut park every ride is closed and
 * saying so on every block is noise, not information.
 *
 * An empty set where the park has no readable feed, for the same reason
 * `liveWaitsFor` returns null there: at 03:00 a park with no source and a park
 * shut for the night are byte-for-byte identical.
 */
export function closedNowFor(park: ParkWithAttractions | undefined | null): Set<string> {
  const out = new Set<string>();
  if (!park || park.status !== 'OPERATING') return out;
  if (!hasReadableWaitTimes(park)) return out;

  for (const attraction of park.attractions ?? []) {
    const status = getLiveAttractionStatus(attraction, park.status);
    // `UNKNOWN` is not `CLOSED`. The API reports it when it cannot tell, and a
    // warning built on it would be this app asserting exactly what the API
    // declined to.
    if (status === 'CLOSED' || status === 'REFURBISHMENT') out.add(attraction.slug);
  }
  return out;
}
