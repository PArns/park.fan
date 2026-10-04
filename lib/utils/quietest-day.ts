import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import { CROWD_LEVEL_ORDER, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/** How far ahead a favorite looks for its quietest day, today included. */
export const QUIETEST_DAY_WINDOW_DAYS = 14;

/** `YYYY-MM-DD` plus `n` days. UTC arithmetic on a plain date, so no zone and no DST is involved. */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * The open day with the lowest forecast crowd level in the window `today … today + 13`.
 *
 * `today` is the park's own date (`parkDayOf`), because `CalendarDay.date` is too, and both
 * compare as strings. The basis is `predictedCrowdLevel`: it is the forward prediction on every
 * day, where `crowdLevel` is a measurement on a past one. A day counts only when the park opens
 * (`status === 'OPERATING'`) and the level is one of the six that rate a day — a closed day, an
 * `unknown` and a missing prediction are not quiet, they are unrated. On a tie the earlier day
 * wins, which is the one the visitor can still plan for.
 *
 * `null` when no day in the window qualifies; the caller draws no line then.
 */
export function quietestOpenDay(
  days: readonly CalendarDay[],
  today: string
): { date: string; level: CrowdLevel } | null {
  const last = addDays(today, QUIETEST_DAY_WINDOW_DAYS - 1);
  let best: { date: string; level: CrowdLevel; rank: number } | null = null;
  for (const day of days) {
    if (day.date < today || day.date > last) continue;
    if (day.status !== 'OPERATING') continue;
    const level = day.predictedCrowdLevel;
    if (!level || !isColoredCrowdLevel(level)) continue;
    const rank = CROWD_LEVEL_ORDER.indexOf(level);
    if (best === null || rank < best.rank || (rank === best.rank && day.date < best.date)) {
      best = { date: day.date, level, rank };
    }
  }
  return best && { date: best.date, level: best.level };
}
