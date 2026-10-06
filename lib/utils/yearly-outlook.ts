import type { ParkDailyPrediction } from '@/lib/api/parks';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { CROWD_LEVEL_ORDER, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/**
 * The park's long-range forecast, laid out as twelve calendar months.
 *
 * `/predictions/yearly` is not a dense list: it skips days it has nothing for and stops about
 * half a year out. So days are placed against the calendar (a skipped day stays an empty slot)
 * rather than rendered in order, and twelve months are always drawn, which keeps the chapter's
 * height constant for its `<Suspense>` placeholder and shows the reader where the forecast ends.
 * See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */

/** How many months the chapter draws, starting with the month the park is in today. */
export const OUTLOOK_MONTHS = 12;

/** One calendar month of the outlook, with its days and counts. */
export interface OutlookMonth {
  /** `YYYY-MM`, park-local. */
  key: string;
  year: number;
  /** 1–12. */
  month: number;
  /** Real length of this calendar month; the strip draws one slot per day. */
  daysInMonth: number;
  /**
   * One entry per day of the month, index 0 = the 1st. `null` is a day the forecast does not
   * cover; `'closed'` and `'unknown'` carry no colour and are kept apart from the six that do.
   */
  days: (ColoredCrowdLevel | 'closed' | 'unknown' | null)[];
  /** How many days of this month the response carries an entry for, whatever it says. */
  coveredDays: number;
  /**
   * Of those, how many carry one of the six coloured tiers. Every count and badge is gated on this,
   * not {@link coveredDays}: the backend sends `unknown` with a `recommendation` for parks it
   * cannot rate, which would print „no forecast" beside „181/181 recommended".
   */
  ratedDays: number;
  /** Of the RATED days, how many carry `recommended` or `highly_recommended`. */
  recommendedDays: number;
  /**
   * How many days the backend marks `closed`, counted apart because a month the park is shut for
   * is not a month without a forecast.
   */
  closedDays: number;
  /**
   * The month's headline crowd level: the most frequent coloured tier, a tie going to the BUSIER
   * one, since rounding a mixed month down is the error a trip planner cannot recover from. `null`
   * where no day carries a coloured tier.
   */
  dominant: ColoredCrowdLevel | null;
}

/** Days in a 1-based (year, month): `Date.UTC(y, m, 0)` is the last day of month `m`. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Build the twelve-month frame and drop the forecast into it.
 *
 * @param predictions the `/predictions/yearly` list, in any order and with any gaps.
 * @param todayIso the park's own calendar day, not the server's. Months are stepped as (year,
 *   month) integers rather than by adding to a `Date`, so a midnight DST jump cannot skip one.
 */
export function buildYearlyOutlook(
  predictions: ParkDailyPrediction[],
  todayIso: string,
  months: number = OUTLOOK_MONTHS
): OutlookMonth[] {
  const startYear = Number(todayIso.slice(0, 4));
  const startMonth = Number(todayIso.slice(5, 7));
  if (!Number.isFinite(startYear) || !Number.isFinite(startMonth) || months <= 0) return [];

  // A duplicate date loses to the last one written.
  const byMonth = new Map<string, ParkDailyPrediction[]>();
  for (const prediction of predictions) {
    const key = prediction.date.slice(0, 7);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(prediction);
    else byMonth.set(key, [prediction]);
  }

  const result: OutlookMonth[] = [];

  for (let offset = 0; offset < months; offset++) {
    const monthIndex = startMonth - 1 + offset;
    const year = startYear + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const length = daysInMonth(year, month);

    const days: OutlookMonth['days'] = new Array(length).fill(null);
    const recommended: boolean[] = new Array(length).fill(false);

    for (const prediction of byMonth.get(key) ?? []) {
      const dayOfMonth = Number(prediction.date.slice(8, 10));
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > length) continue;

      days[dayOfMonth - 1] = prediction.crowdLevel;
      recommended[dayOfMonth - 1] =
        prediction.recommendation === 'recommended' ||
        prediction.recommendation === 'highly_recommended';
    }

    // Counted off the filled calendar, not the response, so a duplicate date cannot read „32/31".
    const tierCounts = new Map<ColoredCrowdLevel, number>();
    let coveredDays = 0;
    let ratedDays = 0;
    let recommendedDays = 0;
    let closedDays = 0;

    for (let index = 0; index < length; index++) {
      const level = days[index];
      if (level === null) continue;
      coveredDays++;
      if (level === 'closed') closedDays++;
      if (!isColoredCrowdLevel(level)) continue;
      ratedDays++;
      tierCounts.set(level, (tierCounts.get(level) ?? 0) + 1);
      if (recommended[index]) recommendedDays++;
    }

    let dominant: ColoredCrowdLevel | null = null;
    let dominantCount = 0;
    // Low→high order with `>=`, so a tie lands on the busier tier.
    for (const level of CROWD_LEVEL_ORDER) {
      const count = tierCounts.get(level) ?? 0;
      if (count > 0 && count >= dominantCount) {
        dominant = level;
        dominantCount = count;
      }
    }

    result.push({
      key,
      year,
      month,
      daysInMonth: length,
      days,
      coveredDays,
      ratedDays,
      recommendedDays,
      closedDays,
      dominant,
    });
  }

  return result;
}

/**
 * The level a month's badge names: its dominant tier, else `closed` when every day the forecast
 * covers is a closed day, else `unknown` („no forecast").
 */
export function outlookBadgeLevel(month: OutlookMonth): ColoredCrowdLevel | 'closed' | 'unknown' {
  if (month.dominant) return month.dominant;
  if (month.closedDays > 0 && month.closedDays === month.coveredDays) return 'closed';
  return 'unknown';
}
