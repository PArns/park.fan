/**
 * Covered rides: where a visitor can go when the nowcast says rain is coming. The „Überdacht"
 * filter pill and the nowcast banner's list share one predicate and one gate, so a park never
 * offers one without the other. Pure.
 */
import type { IndoorOutdoor } from '@/lib/api/types';
import { walkMinutesFrom } from '@/lib/planner/next-best-ride';

/** The fields of an attraction the gate reads. */
export interface CoveredGateInput {
  indoorOutdoor?: IndoorOutdoor | null;
  isCurrentlyInSeason?: boolean | null;
}

/**
 * Share of a park's in-season attractions that must carry an `indoorOutdoor` value before the
 * park offers anything covered. Below it the list is whatever somebody happened to check, and a
 * visitor reads a short list as a complete one.
 */
export const COVERED_MIN_KNOWN_SHARE = 0.5;

/** Rides the banner lists; the filter, one tap away, shows the rest. */
export const COVERED_BANNER_LIMIT = 4;

/**
 * Whether a ride keeps its riders dry while they queue: indoors, or a roofed queue. Absent is
 * unknown and never counts, as `mayGetWet` never reads absent as „dry".
 */
export function isCovered(attraction: { indoorOutdoor?: IndoorOutdoor | null }): boolean {
  return attraction.indoorOutdoor === 'indoor' || attraction.indoorOutdoor === 'covered_queue';
}

/**
 * Whether the park knows enough to offer covered rides at all: at least
 * {@link COVERED_MIN_KNOWN_SHARE} of its in-season attractions carry a value, and at least one is
 * covered. Off-season rides are left out of both counts.
 */
export function coveredOfferReady(attractions: readonly CoveredGateInput[]): boolean {
  let total = 0;
  let known = 0;
  let covered = 0;
  for (const a of attractions) {
    if (a.isCurrentlyInSeason === false) continue;
    total++;
    if (a.indoorOutdoor == null) continue;
    known++;
    if (isCovered(a)) covered++;
  }
  return total > 0 && covered > 0 && known / total >= COVERED_MIN_KNOWN_SHARE;
}

/** The fields of a candidate row the ranking reads. */
export interface CoveredCandidate {
  id: string;
  name: string;
  indoorOutdoor?: IndoorOutdoor | null;
  /** Live status as the page shows it. Only `OPERATING` rides are offered. */
  status: string;
  isCurrentlyInSeason?: boolean | null;
  /** Live standby wait in minutes, or null when the park posts none for this ride. */
  waitTime: number | null;
  /** Metres from the visitor, or null when the visitor is not placed in the park. */
  distance: number | null;
}

/**
 * The covered rides to offer, best first: operating, in season, covered, ordered by minutes until
 * the visitor is on the ride (walk plus queue).
 *
 * The walk (`walkMinutesFrom`) counts only when every offered ride has a distance; otherwise a ride
 * without one would read as zero minutes away, so the order is the queue alone. A ride posting no
 * wait sorts last, since an unknown queue is not a short one. Ties go to the shorter walk, then
 * the name.
 */
export function rankCoveredRides<T extends CoveredCandidate>(
  candidates: readonly T[],
  limit = COVERED_BANNER_LIMIT
): T[] {
  const offered = candidates.filter(
    (c) => c.status === 'OPERATING' && c.isCurrentlyInSeason !== false && isCovered(c)
  );
  const walksKnown = offered.every((c) => c.distance !== null);
  return offered
    .map((c) => {
      const walk = walksKnown ? walkMinutesFrom(c.distance) : 0;
      const wait =
        typeof c.waitTime === 'number' && Number.isFinite(c.waitTime) ? c.waitTime : null;
      return { c, walk, total: wait === null ? null : walk + wait };
    })
    .sort((a, b) => {
      if (a.total === null && b.total !== null) return 1;
      if (b.total === null && a.total !== null) return -1;
      return (a.total ?? 0) - (b.total ?? 0) || a.walk - b.walk || a.c.name.localeCompare(b.c.name);
    })
    .slice(0, limit)
    .map(({ c }) => c);
}
