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
  if (typeof ropeDrop.endOfDayWorth === 'boolean') return ropeDrop.endOfDayWorth;
  return ropeDrop.openWait >= 30 && ropeDrop.bestSlotMinutesAfterOpen >= 120;
}
