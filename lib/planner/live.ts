import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import type { ParkShow, ParkWithAttractions } from '@/lib/api/types';

/**
 * What the live park payload contributes to a plan.
 *
 * Two things, and they arrive together because they ride the same poll: the
 * standby minutes that correct a block whose hour is now, and the showtimes that
 * become lines across the grid.
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

export interface PlannerShowLine {
  slug: string;
  name: string;
  /** Park-local minutes since midnight. */
  minute: number;
}

/**
 * Showtimes as minutes past park-local midnight.
 *
 * `startTime` is a full ISO instant carrying the park's own offset, so
 * `new Date(startTime)` is already park time and there is nothing to convert —
 * which is why this reads the offset out of the string rather than formatting
 * through a timezone it would have to be told.
 *
 * A show out of season is not drawn. `!== false`, never `=== true`: `null` means
 * "seasonal, nothing else known" and must hide nothing.
 */
export function showLinesFor(shows: readonly ParkShow[] | undefined | null): PlannerShowLine[] {
  const out: PlannerShowLine[] = [];
  for (const show of shows ?? []) {
    if (show.isCurrentlyInSeason === false) continue;
    for (const time of show.showtimes ?? []) {
      const at = new Date(time.startTime);
      if (Number.isNaN(at.getTime())) continue;
      // The instant carries the park's offset, so its own local reading IS park
      // time — but `getHours()` would read the BROWSER's. Pull the wall clock
      // straight out of the string instead.
      const match = /T(\d{2}):(\d{2})/.exec(time.startTime);
      if (!match) continue;
      out.push({
        slug: show.slug,
        name: show.name,
        minute: Number(match[1]) * 60 + Number(match[2]),
      });
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
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
