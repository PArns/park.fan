/**
 * Which rides in a park still have no photograph, and which of them to shoot first.
 *
 * The question sounds like a sort and is mostly a question about what the API can
 * answer for EVERY ride rather than for ten of them. Three sources disagree about
 * how far they reach:
 *
 *  - `/stats` returns `topAttractions` with **exactly ten rows** (measured against
 *    Phantasialand), each carrying a rank and a P90. That is the best ordering
 *    there is, and it covers a quarter of a mid-sized park.
 *  - The park payload flags `isHeadliner` per ride, derived upstream from
 *    historical wait times. Ten per park at Phantasialand and Movie Park, largely
 *    the same ten, but it costs nothing extra and survives a cold `/stats`.
 *  - Everything else has only today: `statistics.peakWaitToday` and the current
 *    queue. At 09:00 that is near zero for the whole park, which is exactly why it
 *    ranks LAST and never first — a list that reshuffles itself between two coffee
 *    breaks is not a backlog.
 *
 * So the score is layered rather than blended, and each layer degrades into the
 * next: no `/stats` (cold compute, timeout) drops layer one and the headliners
 * still float; no headliner flag and today's numbers still separate Taron from a
 * carousel. Nothing here throws, and nothing here fetches — the route hands it
 * rows, this decides the order, and `pnpm test:photo-backlog` pins the rules.
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
   * `false` only when the ride is definitively out of its season. `null` means
   * "seasonal, nothing else known" and behaves exactly like in-season, per the
   * project's `!== false` rule — most rides sit there, because the detector needs
   * 330 observation days before it will name a month.
   */
  isCurrentlyInSeason: boolean | null;
  /** The media database already has at least one picture answering for this ride. */
  hasPhoto: boolean;
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
