import type { ParkDailyPrediction } from '@/lib/api/parks';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { CROWD_LEVEL_ORDER, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/**
 * The park's long-range forecast, laid out as twelve calendar months.
 *
 * Two things make this a module rather than a few lines in the component.
 *
 * The first is that the forecast is NOT a dense list. `/predictions/yearly` leaves out every day
 * it has nothing for, and it stops well short of a year — measured on 2026-09-22 against four
 * parks, all four ended on today + 182, and Europa-Park answered with 124 entries across that
 * span where Efteling answered with 182. A component that renders the list in order would draw a
 * different number of cells per park and silently close a gap in November by pulling December
 * leftwards. So the days are laid out AGAINST the calendar: every month gets its own real number
 * of days, and a day the forecast skipped stays an empty slot in the strip.
 *
 * The second is the frame. Twelve months are drawn whether or not the forecast reaches them,
 * which is what makes this chapter's height a constant instead of a function of the park — the
 * `<Suspense>` placeholder can then reserve it exactly (docs/rules/a-streamed-section-owes-the-
 * page-its-height.md). It also tells the reader where the forecast ends, rather than ending the
 * list and leaving them to work out whether April is quiet or merely unknown.
 */

/** How many months the chapter draws, starting with the month the park is in today. */
export const OUTLOOK_MONTHS = 12;

export interface OutlookMonth {
  /** `YYYY-MM`, park-local. */
  key: string;
  year: number;
  /** 1–12. */
  month: number;
  /** Real length of this calendar month — the strip draws one slot per day. */
  daysInMonth: number;
  /**
   * One entry per day of the month, index 0 = the 1st.
   *
   * `null` is a day the forecast does not cover: before today, past the horizon, or simply
   * absent from the response. `'closed'` and `'unknown'` are levels the endpoint can send and
   * that carry no colour, so they are kept apart from the six that do.
   */
  days: (ColoredCrowdLevel | 'closed' | 'unknown' | null)[];
  /** How many days of this month the response carries an entry for, whatever it says. */
  coveredDays: number;
  /**
   * Of those, how many carry one of the six coloured tiers — the ones the page can draw and name.
   *
   * It is not the same number as {@link coveredDays}, and the gap is a whole class of park.
   * `rateOrUnknown` in the backend returns `unknown` where there is no typical-day peak to rate
   * against (a park with fewer than 30 operating days on file), and it keeps sending a
   * `recommendation` anyway: Aquatica Orlando answered on 2026-09-22 with 181 days that were
   * `unknown` and `recommended` at once. A row gated on `coveredDays` would have put „no
   * forecast" next to „181/181 recommended" on that park, so every count and every badge here
   * is gated on this one instead.
   */
  ratedDays: number;
  /** Of the RATED days, how many carry `recommended` or `highly_recommended`. */
  recommendedDays: number;
  /**
   * The month's headline crowd level: the most frequent of the six coloured tiers.
   *
   * A tie goes to the BUSIER tier. A month that is half quiet and half busy is a month worth
   * checking day by day, and rounding it down to the quiet half would be the one direction of
   * error a trip planner cannot recover from. `null` where no day of the month carries a
   * coloured tier, which is every month past the horizon and any month of a park the backend
   * cannot rate.
   */
  dominant: ColoredCrowdLevel | null;
}

/** Days in a 1-based (year, month) — `Date.UTC(y, m, 0)` is the last day of month `m`. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Build the twelve-month frame and drop the forecast into it.
 *
 * @param predictions the `/predictions/yearly` list, in any order and with any gaps.
 * @param todayIso the park's own calendar day, `YYYY-MM-DD` — NOT the server's. The months are
 *   stepped as plain (year, month) integers rather than by adding to a `Date`, so no park in a
 *   zone with a midnight DST jump can lose or repeat a month.
 * @param months how many months to draw; defaults to {@link OUTLOOK_MONTHS}.
 */
export function buildYearlyOutlook(
  predictions: ParkDailyPrediction[],
  todayIso: string,
  months: number = OUTLOOK_MONTHS
): OutlookMonth[] {
  const startYear = Number(todayIso.slice(0, 4));
  const startMonth = Number(todayIso.slice(5, 7));
  if (!Number.isFinite(startYear) || !Number.isFinite(startMonth) || months <= 0) return [];

  // `YYYY-MM` → the month's entries. One pass, so a 182-entry response is not re-scanned twelve
  // times, and a duplicate date simply loses to the last one written.
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

    // Counted off the filled calendar, not off the response: two entries for one date would
    // otherwise both be counted and the row could read „32/31 recommended".
    const tierCounts = new Map<ColoredCrowdLevel, number>();
    let coveredDays = 0;
    let ratedDays = 0;
    let recommendedDays = 0;

    for (let index = 0; index < length; index++) {
      const level = days[index];
      if (level === null) continue;
      coveredDays++;
      if (!isColoredCrowdLevel(level)) continue;
      ratedDays++;
      tierCounts.set(level, (tierCounts.get(level) ?? 0) + 1);
      if (recommended[index]) recommendedDays++;
    }

    let dominant: ColoredCrowdLevel | null = null;
    let dominantCount = 0;
    // Walked in the palette's own low→high order, taking `>=`, so a tie lands on the busier tier.
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
      dominant,
    });
  }

  return result;
}
