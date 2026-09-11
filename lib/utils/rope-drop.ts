import type { RopeDropInfo } from '@/lib/api/types';

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
