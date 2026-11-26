/**
 * The first year the measured history can rank. Most parks' history starts in the last days of
 * 2025, so 2025 holds a handful of days and no ride reaches the ranking's floor.
 */
export const FIRST_RANKING_YEAR = 2026;

/**
 * Through which month a new year is still too thin to rank, so links point at the previous year:
 * the API ranks a ride from 60 measured days in the year, and before March only the few rides open
 * all winter could reach that.
 */
const LAST_MONTH_OF_PREVIOUS_YEAR = 2;

/**
 * The year the site links and quotes the ranking of: the running year from March on, the previous
 * one before. Never before {@link FIRST_RANKING_YEAR}. UTC is precise enough here: the switch is a
 * month boundary, and a ranking page for either year exists on the day in question.
 */
export function currentRankingYear(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const shown = now.getUTCMonth() + 1 <= LAST_MONTH_OF_PREVIOUS_YEAR ? year - 1 : year;
  return Math.max(FIRST_RANKING_YEAR, shown);
}
