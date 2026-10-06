/**
 * Which rides in a park still have no photograph, and which of them to shoot first. The score is
 * layered rather than blended, and each layer degrades into the next: the ten rides `/stats`
 * ranks, then headliners (which survive a cold `/stats`), then today's peak wait, which only
 * orders the long tail because it is near zero in the morning. Nothing here fetches or throws;
 * `pnpm test:photo-backlog` pins the rules.
 */

import { isInSeason } from '@/lib/utils/season';

/** One ride, as the backlog route assembles it from park payload + stats + media index. */
export interface BacklogRide {
  slug: string;
  name: string;
  land: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Minutes in the standby queue right now, or null when nothing is reported. */
  waitTime: number | null;
  /** The highest wait seen today, or null before the park has been open a while. */
  peakWaitToday: number | null;
  isHeadliner: boolean;
  /** 1–10 from `/stats.topAttractions`, or null for everything below the top ten. */
  statsRank: number | null;
  /** The P90 that earned that rank, in minutes. */
  p90: number | null;
  /** A curated ride profile exists — somebody has already spent time on this ride. */
  hasRideProfile: boolean;
  /**
   * `false` only when the ride is definitively out of its season. `null` means "seasonal, nothing
   * else known" and behaves like in-season, per the `!== false` rule.
   */
  isCurrentlyInSeason: boolean | null;
  /**
   * At least one picture answers for this ride, on `main` or in the open media
   * session's pull request.
   */
  hasPhoto: boolean;
  /** One of those pictures is in the open session and not merged yet. */
  inSession?: boolean;
}

/** Why a ride sits where it sits — rendered as the badge next to its name. */
export type BacklogReasonKind = 'stats-rank' | 'headliner' | 'wait' | 'none';

export interface BacklogReason {
  kind: BacklogReasonKind;
  /** Rank for `stats-rank`, minutes for `wait`, P90 for `headliner` when known. */
  value: number | null;
}

export interface RankedRide extends BacklogRide {
  score: number;
  reason: BacklogReason;
}

export interface Backlog {
  /** No picture yet, in season, hardest-hitting first. */
  missing: RankedRide[];
  /** Out of season and unphotographed: the facade is still shootable, just not the queue. */
  outOfSeason: RankedRide[];
  /** Already covered, same order, so the list reads as one catalogue. */
  covered: RankedRide[];
  /**
   * Coverage over the WHOLE catalogue, out-of-season rides included.
   *
   * Deliberately unlike the park page's "12 of 45 operating", which excludes a
   * ride that cannot open before November because it is answering "what can I
   * queue for today". This one answers "is the catalogue complete", and a winter
   * ride missing its photograph in August is missing it.
   */
  coverage: { withPhoto: number; total: number };
}

/** Layer one: the ten rides `/stats` ranked, best first. */
const STATS_BASE = 3000;
/** Layer two: a headliner the stats endpoint did not rank (or could not answer for). */
const HEADLINER_SCORE = 2000;
/** Layer three: today's numbers, which only ever separate the long tail. */
const WAIT_BASE = 1000;
/**
 * A hair, added to a curated ride so it wins a tie against an identical uncurated
 * one. Deliberately smaller than one minute of wait: it breaks ties, it does not
 * outrank data.
 */
const CURATED_NUDGE = 0.5;

/**
 * The importance of one ride, and the sentence explaining it.
 *
 * Exported for the test and for the route, which shows the reason rather than the
 * number: "Rang 2" and "P90 50 Min." mean something to a person holding a camera,
 * and `2998.5` does not.
 */
export function scoreRide(ride: BacklogRide): { score: number; reason: BacklogReason } {
  const nudge = ride.hasRideProfile ? CURATED_NUDGE : 0;

  if (ride.statsRank !== null) {
    return {
      score: STATS_BASE - ride.statsRank + nudge,
      reason: { kind: 'stats-rank', value: ride.statsRank },
    };
  }

  if (ride.isHeadliner) {
    return {
      score: HEADLINER_SCORE + nudge,
      reason: { kind: 'headliner', value: ride.p90 },
    };
  }

  // `peakWaitToday` over the live figure, because the live one is a snapshot of
  // this minute and the peak is what the ride did when it mattered. Both may be
  // null before the park opens, and then every ride in the tail scores the same
  // and falls through to the name — which is honest, not a failure.
  const today = Math.max(ride.peakWaitToday ?? 0, ride.waitTime ?? 0);
  return {
    score: WAIT_BASE + today + nudge,
    reason: today > 0 ? { kind: 'wait', value: today } : { kind: 'none', value: null },
  };
}

/** Highest score first; equal scores fall back to the name so the order is stable. */
function byImportance(a: RankedRide, b: RankedRide): number {
  return b.score - a.score || a.name.localeCompare(b.name, 'de');
}

/**
 * Sort a park's rides into the three lists the capture screen renders.
 *
 * Partition order matters: a ride that HAS a photograph is covered whether or not
 * it is running this month, so `hasPhoto` is asked first. Only an unphotographed
 * ride can be filed as out of season, which is the group that gets collapsed.
 */
export function buildBacklog(rides: readonly BacklogRide[]): Backlog {
  const missing: RankedRide[] = [];
  const outOfSeason: RankedRide[] = [];
  const covered: RankedRide[] = [];

  for (const ride of rides) {
    const ranked: RankedRide = { ...ride, ...scoreRide(ride) };
    if (ride.hasPhoto) covered.push(ranked);
    // Through the shared predicate, not a local `=== false`: a seasonal ride whose
    // months are unknown must not be tucked into a collapsed group, and that rule
    // already has a home which explains why.
    else if (!isInSeason(ride)) outOfSeason.push(ranked);
    else missing.push(ranked);
  }

  return {
    missing: missing.sort(byImportance),
    outOfSeason: outOfSeason.sort(byImportance),
    covered: covered.sort(byImportance),
    coverage: { withPhoto: covered.length, total: rides.length },
  };
}
