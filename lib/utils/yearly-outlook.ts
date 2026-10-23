import type { ParkDailyPrediction, ParkYearlyHoliday } from '@/lib/api/parks';
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

/**
 * What the outlook knows about one forecast day. Only what is set is written: the days ride to the
 * client in the page payload, and a false flag on 180 days is bytes for nothing.
 */
export interface OutlookDay {
  /** `'closed'` and `'unknown'` carry no colour and are kept apart from the six that do. */
  level: ColoredCrowdLevel | 'closed' | 'unknown';
  /** Predicted average headliner wait in minutes, as the API sends it; absent on a closed day. */
  avgWait?: number;
  /**
   * `'go'` for a day the forecast recommends, `'avoid'` for one it advises against. Absent on a
   * neutral day and on any day without a coloured tier, whatever the endpoint says about it.
   */
  advice?: 'go' | 'avoid';
}

/**
 * A day's holidays in the park's own region. Kept apart from {@link OutlookDay}: the forecast skips
 * days and stops about six months out, the holiday list does neither. Only what is set is written.
 */
export interface OutlookHoliday {
  isHoliday?: true;
  isSchoolVacation?: true;
  isBridgeDay?: true;
  /** English, as the API sends it; the caller translates it. */
  holidayName?: string;
  /** English, as the API sends it; the caller translates it. */
  schoolVacationName?: string;
}

/** One calendar month of the outlook, with its days and counts. */
export interface OutlookMonth {
  /** `YYYY-MM`, park-local. */
  key: string;
  year: number;
  /** 1–12. */
  month: number;
  /** Real length of this calendar month; the strip draws one slot per day. */
  daysInMonth: number;
  /** Weekday of the 1st, `0` = Sunday, so the strip can mark where each week starts. */
  firstWeekday: number;
  /**
   * How many days at the start of this month lie before the park's today: the first month's,
   * which the forecast cannot cover and nobody can still visit. `0` for every later month.
   */
  pastDays: number;
  /** One entry per day of the month, index 0 = the 1st. `null` is a day the forecast does not cover. */
  days: (OutlookDay | null)[];
  /** One entry per day of the month, index 0 = the 1st. `null` is a day without a holiday. */
  holidays: (OutlookHoliday | null)[];
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

/** One prediction as the outlook keeps it. A recommendation counts only beside a coloured tier. */
function outlookDay(prediction: ParkDailyPrediction): OutlookDay {
  const day: OutlookDay = { level: prediction.crowdLevel };
  if (prediction.avgWaitTime != null) day.avgWait = prediction.avgWaitTime;
  if (isColoredCrowdLevel(prediction.crowdLevel)) {
    const recommendation = prediction.recommendation;
    if (recommendation === 'recommended' || recommendation === 'highly_recommended') {
      day.advice = 'go';
    } else if (recommendation === 'avoid' || recommendation === 'strongly_avoid') {
      day.advice = 'avoid';
    }
  }
  return day;
}

/** One holiday entry as the outlook keeps it, or `null` for an entry that flags nothing. */
function outlookHoliday(entry: ParkYearlyHoliday): OutlookHoliday | null {
  if (!entry.isHoliday && !entry.isSchoolVacation && !entry.isBridgeDay) return null;
  const holiday: OutlookHoliday = {};
  if (entry.isHoliday) holiday.isHoliday = true;
  if (entry.isSchoolVacation) holiday.isSchoolVacation = true;
  if (entry.isBridgeDay) holiday.isBridgeDay = true;
  if (entry.isHoliday && entry.holidayName) holiday.holidayName = entry.holidayName;
  if (entry.isSchoolVacation && entry.schoolVacationName) {
    holiday.schoolVacationName = entry.schoolVacationName;
  }
  return holiday;
}

/** Group dated entries by `YYYY-MM`. */
function byMonthKey<T extends { date: string }>(entries: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const bucket = map.get(key);
    if (bucket) bucket.push(entry);
    else map.set(key, [entry]);
  }
  return map;
}

/** The 0-based slot of a dated entry inside a month of `length` days, or `null` for a bad date. */
function slotOf(date: string, length: number): number | null {
  const dayOfMonth = Number(date.slice(8, 10));
  return Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= length
    ? dayOfMonth - 1
    : null;
}

/**
 * Build the twelve-month frame and drop the forecast into it.
 *
 * @param predictions the `/predictions/yearly` list, in any order and with any gaps.
 * @param todayIso the park's own calendar day, not the server's. Months are stepped as (year,
 *   month) integers rather than by adding to a `Date`, so a midnight DST jump cannot skip one.
 * @param holidays the response's `holidays`, placed the same way; empty where the API sent none.
 */
export function buildYearlyOutlook(
  predictions: ParkDailyPrediction[],
  todayIso: string,
  holidays: ParkYearlyHoliday[] = [],
  months: number = OUTLOOK_MONTHS
): OutlookMonth[] {
  const startYear = Number(todayIso.slice(0, 4));
  const startMonth = Number(todayIso.slice(5, 7));
  const startDay = Number(todayIso.slice(8, 10));
  if (!Number.isFinite(startYear) || !Number.isFinite(startMonth) || months <= 0) return [];

  // A duplicate date loses to the last one written.
  const predictionsByMonth = byMonthKey(predictions);
  const holidaysByMonth = byMonthKey(holidays);

  const result: OutlookMonth[] = [];

  for (let offset = 0; offset < months; offset++) {
    const monthIndex = startMonth - 1 + offset;
    const year = startYear + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const length = daysInMonth(year, month);

    const days: OutlookMonth['days'] = new Array(length).fill(null);
    for (const prediction of predictionsByMonth.get(key) ?? []) {
      const slot = slotOf(prediction.date, length);
      if (slot !== null) days[slot] = outlookDay(prediction);
    }

    const monthHolidays: OutlookMonth['holidays'] = new Array(length).fill(null);
    for (const entry of holidaysByMonth.get(key) ?? []) {
      const slot = slotOf(entry.date, length);
      if (slot !== null) monthHolidays[slot] = outlookHoliday(entry);
    }

    // Counted off the filled calendar, not the response, so a duplicate date cannot read „32/31".
    const tierCounts = new Map<ColoredCrowdLevel, number>();
    let coveredDays = 0;
    let ratedDays = 0;
    let recommendedDays = 0;
    let closedDays = 0;

    for (const day of days) {
      if (day === null) continue;
      coveredDays++;
      if (day.level === 'closed') closedDays++;
      if (!isColoredCrowdLevel(day.level)) continue;
      ratedDays++;
      tierCounts.set(day.level, (tierCounts.get(day.level) ?? 0) + 1);
      if (day.advice === 'go') recommendedDays++;
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
      firstWeekday: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
      pastDays: offset === 0 && Number.isInteger(startDay) ? Math.max(0, startDay - 1) : 0,
      days,
      holidays: monthHolidays,
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
