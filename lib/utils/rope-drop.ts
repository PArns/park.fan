import type { RopeDropInfo } from '@/lib/api/types';
import { roundWaitTo5, roundWaitDeltaTo5 } from '@/lib/utils/wait-time';

/**
 * The inverse rope-drop recommendation: the line is already long right at
 * opening and the day's trough sits much later (usually the evening), so
 * arriving at rope drop buys nothing — ride late instead.
 *
 * Prefers the server verdict (`endOfDayWorth`, backend PR #69, computed with a
 * pre-closing line-drain guard). Cached recommendations predating that field
 * fall back to a local heuristic: opening must be genuinely costly (≥30 min)
 * and the trough clearly past the opening window (≥2 h after open). Rides that
 * are simply never busy (low openWait) keep the plain "no need to rush" note.
 */
export function isEveningBetter(ropeDrop: RopeDropInfo): boolean {
  if (ropeDrop.worth) return false;
  // Only trust the verdict when the trough wait is filled in — recommendations
  // stored before the backend recompute carry DB defaults (false/0), which are
  // indistinguishable from a genuine negative verdict.
  if (typeof ropeDrop.endOfDayWorth === 'boolean' && troughWait(ropeDrop) !== null) {
    return ropeDrop.endOfDayWorth;
  }
  return ropeDrop.openWait >= 30 && ropeDrop.bestSlotMinutesAfterOpen >= 120;
}

/**
 * The expected wait at the day's trough, or null when unknown. `0` is the DB
 * default of recommendations stored before the field existed — real waits are
 * recorded in 5-minute steps, so a positive value is the "filled in" signal.
 */
export function troughWait(ropeDrop: RopeDropInfo): number | null {
  return ropeDrop.bestSlotWait != null && ropeDrop.bestSlotWait > 0 ? ropeDrop.bestSlotWait : null;
}

/** The figures `RopeDropCard` prints, on the grid a park posts its wait times on. */
export interface RopeDropDisplayWaits {
  /** Typical wait at opening. */
  openWait: number;
  /** The day's peak wait. */
  busyPeak: number;
  /** Expected wait at the day's trough, or null when the recommendation does not carry one. */
  trough: number | null;
  /** Minutes saved by riding at opening — a DIFFERENCE, see below. */
  savings: number;
}

/**
 * Every wait `RopeDropCard` displays, rounded once for the whole card.
 *
 * A displayed wait time is always a multiple of five, because that is how parks post them; what
 * breaks it is the maths on top, and the API's own rounding is one build away from a surface that
 * has to be right whichever build answers. Three of the card's four panels printed what the payload
 * held, beside a `bestTime` panel and an `AttractionTypicalWaits` chart in the neighbouring cell
 * that both round. Measured against the production API over all 213 parks on 2026-09-14: of 1,196
 * rides carrying a recommendation, **117 on 57 parks printed at least one figure off the grid** —
 * Cedar Point's Millennium Force at 73 minutes peak and 63 saved, Alton Towers' Postman Pat at 43.
 *
 * Rounding here rather than at each tile is what keeps one panel from disagreeing with itself: the
 * `worth` panel prints `openWait` in a tile and again inside the explainer sentence, and the trough
 * it labels „best slot" is the same number the `bestTime` panel already draws rounded.
 *
 * `savings` goes through `roundWaitDeltaTo5` because it is a difference, and that is the rule for
 * one. It is not a fix for anything visible today: the two functions agree on every non-negative
 * input, and measured over production the 345 recommendations that print this tile carry savings
 * of 45 to 225 minutes, none negative and none near the 2.5 floor — the backend's own gate is what
 * keeps them there. The delta rule is right for the same reason the tile is a difference at all,
 * and it is the half of the pair that stays right if a stored column ever comes back negative,
 * where the wait rule would floor it to „you save 0 min".
 *
 * It is NOT recomputed as `busyPeak − openWait` either, which would make the tile agree with its
 * neighbours by arithmetic; the API stores that column and substituting a local subtraction for it
 * is explicitly out of scope here.
 *
 * Round only what is displayed. The gates keep reading the raw block — `ropeDropCardVariant` tests
 * `openWait >= 30`, `troughWait` uses `> 0` as the sentinel for a field the row never filled in,
 * and both would change which panel a ride gets if they read the rounded figures instead.
 */
export function ropeDropDisplayWaits(ropeDrop: RopeDropInfo): RopeDropDisplayWaits {
  const rawTrough = troughWait(ropeDrop);
  return {
    openWait: roundWaitTo5(ropeDrop.openWait),
    busyPeak: roundWaitTo5(ropeDrop.busyPeak),
    trough: rawTrough == null ? null : roundWaitTo5(rawTrough),
    savings: roundWaitDeltaTo5(ropeDrop.savings),
  };
}

/** Which of `RopeDropCard`'s four panels a recommendation resolves to. */
export type RopeDropCardVariant = 'worth' | 'evening' | 'bestTime' | 'note';

/**
 * The panel a `ropeDrop` block gets. Total by construction — every recommendation resolves to
 * one of four, and none of them is "nothing".
 *
 * That totality is the point rather than a detail of the switch. The card used to answer `null`
 * for the fourth case (not worth, not an evening ride, and no neighbour in the park carrying a
 * recommendation either — the "no need to rush" note has nothing to contrast against there),
 * while its cell on the ride page hangs on `attraction.ropeDrop` being present, one level up and
 * out of reach of that `null`. So the chapter drew a `PANEL_CELL`, its hairline and a second grid
 * column around a component that rendered nothing: **183 ride pages across 60 parks with a
 * visibly empty half**, measured over all 213 parks, plus 159 more where the single column was an
 * empty box under a heading. Every Efteling ride carrying a recommendation is one of them, which
 * is how it was reported.
 */
export function ropeDropCardVariant(
  ropeDrop: RopeDropInfo,
  { parkHasRecommendations = true }: { parkHasRecommendations?: boolean } = {}
): RopeDropCardVariant {
  if (ropeDrop.worth) return 'worth';
  if (isEveningBetter(ropeDrop)) return 'evening';
  return parkHasRecommendations ? 'note' : 'bestTime';
}
