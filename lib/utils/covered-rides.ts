/**
 * Covered rides: the rides a visitor can go to when the nowcast says rain is coming.
 *
 * Two page parts ask the same question here — the park page's „Überdacht" filter pill and the
 * list the nowcast banner offers when rain or a thunderstorm is due — so both read the same
 * predicate and the same gate, and a park never offers one without the other.
 *
 * Pure: no clock, no storage, no fetch.
 */
import type { IndoorOutdoor } from '@/lib/api/types';
import { walkMinutesFrom } from '@/lib/planner/next-best-ride';

/** The fields of an attraction the gate reads. */
export interface CoveredGateInput {
  indoorOutdoor?: IndoorOutdoor | null;
  isCurrentlyInSeason?: boolean | null;
}

/**
 * Share of a park's in-season attractions that must carry a value before the park offers
 * anything covered.
 *
 * Below it the list would be a list of the rides somebody happened to check, not of the rides
 * that are covered, and a visitor reads a short list as a complete one. Counted 2026-09-29 over
 * the 203 parks with attractions: five carry any value at all, at 53 % (Movie Park Germany) to
 * 83 % (Phantasialand), so every park that has been curated passes and a park with a handful of
 * values does not.
 */
export const COVERED_MIN_KNOWN_SHARE = 0.5;

/** Rides the banner lists. More is the filter's job, one tap away on the same page. */
export const COVERED_BANNER_LIMIT = 4;

/**
 * Whether a ride keeps its riders dry while they queue: the ride is indoors, or its queue is
 * roofed. Absent/null is unknown and never counts, the same way `mayGetWet` never reads
 * absent as "dry".
 */
export function isCovered(attraction: { indoorOutdoor?: IndoorOutdoor | null }): boolean {
  return attraction.indoorOutdoor === 'indoor' || attraction.indoorOutdoor === 'covered_queue';
}

/**
 * Whether the park knows enough to offer covered rides at all: at least
 * {@link COVERED_MIN_KNOWN_SHARE} of its in-season attractions carry a value, and at least one
 * of them is covered.
 *
 * Off-season rides are left out of both counts. They are hidden from the list by default and a
 * winter-only ride nobody has checked should not decide whether a summer afternoon gets a
 * rain plan.
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
 * The covered rides to offer, best first: operating, in season, covered — and ordered by the
 * minutes until the visitor is on the ride, walk plus queue.
 *
 * The walk is the planner's ceiling (`walkMinutesFrom`, detour factor at park pace), and it only
 * counts when every offered ride has a distance. Without a position, or when the nearby answer
 * left a ride out (it measures only rides with coordinates), the walk is zero for all of them and
 * the order is the queue alone: a ride with no distance would otherwise read as zero minutes away
 * and jump ahead of every ride whose walk is known. A ride that posts no wait sorts after every
 * ride that does: an unknown queue is not a short one. Between equal totals the shorter walk goes
 * first — the point is to get under a roof — then the name, for a stable order.
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
