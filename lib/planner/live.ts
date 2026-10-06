import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * What the live park payload contributes to a plan: standby minutes for a block whose hour is now,
 * and which rides report closed. Showtimes come from `/plan/day` (`lib/planner/shows.ts`).
 */

/**
 * Standby minutes per ride slug, or `null` where the park has no readable feed. `null` and an empty
 * map are different answers: a park with no source looks exactly like one shut for the night, so
 * the curated flag decides. See docs/rules/parks-we-cannot-read.md.
 */
export function liveWaitsFor(
  park: ParkWithAttractions | undefined | null
): Map<string, number> | null {
  if (!park) return null;
  if (!hasReadableWaitTimes(park)) return null;

  const out = new Map<string, number>();
  for (const attraction of park.attractions ?? []) {
    // The house helpers: `getLiveAttractionStatus` prefers `effectiveStatus`, the only source that
    // knows a ride is out of season, and a stopped feed keeps its last queue value.
    if (getLiveAttractionStatus(attraction, park.status) !== 'OPERATING') continue;
    const minutes = getStandbyWait(attraction);
    if (typeof minutes === 'number') out.set(attraction.slug, minutes);
  }
  return out;
}

/**
 * Rides reporting closed right now. Not the complement of {@link liveWaitsFor}: an open ride can
 * have no standby queue. Only inside an open park, where saying so is information, and empty where
 * the park has no readable feed.
 */
export function closedNowFor(park: ParkWithAttractions | undefined | null): Set<string> {
  const out = new Set<string>();
  if (!park || park.status !== 'OPERATING') return out;
  if (!hasReadableWaitTimes(park)) return out;

  for (const attraction of park.attractions ?? []) {
    const status = getLiveAttractionStatus(attraction, park.status);
    // `UNKNOWN` is not `CLOSED`: a warning on it would assert what the API declined to.
    if (status === 'CLOSED' || status === 'REFURBISHMENT') out.add(attraction.slug);
  }
  return out;
}
