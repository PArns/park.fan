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
 * The open day with the lowest forecast crowd level in the window `today … today + 13`, or `null`.
 * `today` is the park's own date, like `CalendarDay.date`. Rated on `predictedCrowdLevel`, the
 * forward prediction; a closed, `unknown` or unpredicted day is unrated, not quiet. A tie goes to
 * the earlier day.
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
