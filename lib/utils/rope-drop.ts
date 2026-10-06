import type { RopeDropInfo } from '@/lib/api/types';
import { roundWaitTo5, roundWaitDeltaTo5 } from '@/lib/utils/wait-time';

/**
 * The inverse rope-drop recommendation: the line is already long at opening and the day's trough
 * sits much later, so ride late instead. Prefers the server verdict `endOfDayWorth`; cached
 * recommendations without it fall back to a local heuristic (opening ≥ 30 min, trough ≥ 2 h after
 * open). A ride that is neither this nor `worth` gets the `bestTime` panel, which makes no claim
 * about how busy it gets in between.
 */
export function isEveningBetter(ropeDrop: RopeDropInfo): boolean {
  if (ropeDrop.worth) return false;
  // Trust the verdict only when the trough wait is filled in: older recommendations carry DB
  // defaults (false/0) that look like a genuine negative verdict.
  if (typeof ropeDrop.endOfDayWorth === 'boolean' && troughWait(ropeDrop) !== null) {
    return ropeDrop.endOfDayWorth;
  }
  return ropeDrop.openWait >= 30 && ropeDrop.bestSlotMinutesAfterOpen >= 120;
}

/**
 * The expected wait at the day's trough, or null when unknown. `0` is the DB default of older
 * recommendations, and real waits come in 5-minute steps, so only a positive value is filled in.
 */
function troughWait(ropeDrop: RopeDropInfo): number | null {
  return ropeDrop.bestSlotWait != null && ropeDrop.bestSlotWait > 0 ? ropeDrop.bestSlotWait : null;
}

/** The figures the rope-drop card, badges and headliner strip print, on the five-minute grid. */
export interface RopeDropDisplayWaits {
  /** Typical wait at opening. */
  openWait: number;
  /** The day's peak wait. */
  busyPeak: number;
  /** Expected wait at the day's trough, or null when the recommendation does not carry one. */
  trough: number | null;
  /** Minutes saved by riding at opening; a difference, rounded as one. */
  savings: number;
}

/**
 * Every wait `RopeDropCard` displays, rounded once for the whole card so no panel disagrees with
 * its neighbours or with itself. A displayed wait is always a multiple of five, as parks post them.
 *
 * `savings` is a difference and goes through `roundWaitDeltaTo5`, which stays right if a stored
 * value is ever negative; it is the API's column, never recomputed as `busyPeak − openWait`. Round
 * only what is displayed: the gates (`openWait >= 30`, the `> 0` trough sentinel) read the raw
 * block. See docs/rules/the-guide-page-teaches-the-real-cards-with-the-rides-real.md.
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

/** Which of `RopeDropCard`'s three panels a recommendation resolves to. */
export type RopeDropCardVariant = 'worth' | 'evening' | 'bestTime';

/**
 * The panel a `ropeDrop` block gets. Total by construction: every recommendation resolves to one of
 * three and none is „nothing", because the ride page's cell is gated on `attraction.ropeDrop` alone
 * and a `null` here left a visibly empty half-card. Whether the park has other recommendations is
 * only a footer line on the `bestTime` panel, read by `RopeDropCard`.
 * See docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md.
 */
export function ropeDropCardVariant(ropeDrop: RopeDropInfo): RopeDropCardVariant {
  if (ropeDrop.worth) return 'worth';
  if (isEveningBetter(ropeDrop)) return 'evening';
  return 'bestTime';
}
