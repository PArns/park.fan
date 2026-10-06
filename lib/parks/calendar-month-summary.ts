import { formatInTimeZone } from 'date-fns-tz';

import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

/**
 * What a month page can say about its month, in text, on the server. The month grid is a
 * client-only import, so without this every month page served nearly the same HTML; the findings
 * are derived from the same payload the grid fetches and rendered as sentences above it. Pure and
 * React-free, so `pnpm test:calendar-month` pins the refusals without a DOM.
 *
 * Every field may be `null` on purpose: a month with four open days has no quietest day worth
 * naming. Same shape of rules as the hub's quietest weekday: beat the month's own median, a tie
 * names both days, and too many days on the minimum means no quiet day at all.
 */

/** Ordering for the API's crowd vocabulary. `unknown` is not on the scale and never ranks. */
const CROWD_RANK: Record<Exclude<CrowdLevel, 'unknown'>, number> = {
  very_low: 0,
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
  extreme: 5,
};

/**
 * Fewest rated open days a month needs before any day of it is called quiet or busy; below eight
 * a „quietest day" is an artefact of a short season.
 */
const MIN_RATED_DAYS = 8;

/**
 * How many days may share the extreme before the month is declared to have none. Two equally quiet
 * Tuesdays are a finding; four days at the same minimum is a flat month and a list, not an answer.
 */
const MAX_NAMED_DAYS = 3;

/** A day the summary names, reduced to what the sentence needs. */
export interface NamedCalendarDay {
  /** `YYYY-MM-DD`, exactly as the API sent it; formatting is the caller's. */
  date: string;
  crowdLevel: CrowdLevel;
}

/** The most common opening hours in a month, in the park's zone. */
export interface MonthHoursPattern {
  /** `HH:mm` in the PARK's zone, already formatted — see {@link hoursPattern}. */
  openingTime: string;
  /** `HH:mm` in the park's zone. */
  closingTime: string;
}

/** The handful of facts a month page can state about its month. */
export interface CalendarMonthSummary {
  /** Days in the calendar month, as delivered, not `new Date` arithmetic over a DST boundary. */
  totalDays: number;
  /** Days the park is scheduled to operate. */
  openDays: number;
  /** `totalDays - openDays`, kept explicit so a caller cannot subtract wrongly. */
  closedDays: number;
  /**
   * The quietest days, or `null` when the month refuses to name one: fewer than
   * {@link MIN_RATED_DAYS} rated open days, no day strictly below the median, or more than
   * {@link MAX_NAMED_DAYS} sharing the minimum.
   */
  quietest: NamedCalendarDay[] | null;
  /** The busiest days, under the mirror-image rule (strictly above the median). */
  busiest: NamedCalendarDay[] | null;
  /**
   * The month's usual opening hours, or `null` when no single pair covers most of it: 11–18 for
   * two weeks and 11–20 for two is no „usual", and either is wrong on half the month.
   */
  hours: MonthHoursPattern | null;
  /** Days inside a school vacation for the park's own region. */
  schoolVacationDays: number;
  /**
   * Mean headliner wait across rated days, on the five-minute grid, or `null`. Rounded once at
   * the end: averaging pre-rounded values drags the mean toward the common multiple.
   */
  avgHeadlinerWait: number | null;
  /** True when the month is wholly in the past, so the prose can use the past tense. */
  isPast: boolean;
}

/**
 * The days a month's extremes may be picked from, shared by the summary sentence and the grid's
 * „Empfohlen" star so their medians are computed over the same population. Holidays stay in: a
 * quiet Whit Monday is still the month's quietest day. Today stays in too, since it carries the
 * same forecast as every other day.
 */
export function extremeCandidates(
  days: CalendarDay[],
  todayIso: string,
  monthIsPast: boolean
): CalendarDay[] {
  return days.filter((day) => {
    if (day.status !== 'OPERATING') return false;
    if (!monthIsPast && day.date < todayIso) return false;
    const level = day.crowdLevel;
    return level !== 'closed' && level !== 'unknown' && CROWD_RANK[level] !== undefined;
  });
}

/**
 * One comparable number per day: the crowd bucket, plus the headliner wait squeezed below 1 as the
 * tie-break, so a `moderate` day never sorts below a `low` one and an outlier cannot climb a whole
 * bucket. Exported so the grid's „Empfohlen" star ranks on the same definition.
 */
export function rankOf(day: CalendarDay, bucket: number): number {
  const wait = day.headlinerForecast?.avgWait;
  const within =
    typeof wait === 'number' && Number.isFinite(wait) ? Math.min(0.99, Math.max(0, wait) / 120) : 0;
  return bucket + within;
}

/**
 * A day that counts: scheduled to operate, rated, and comparable to the others, with its rank.
 * The rank breaks ties the six-value enum cannot: a weekday-quiet, weekend-busy park otherwise puts
 * twenty days on the minimum and {@link MAX_NAMED_DAYS} suppresses the clearest months.
 * `crowdScore` would be the natural tie-break but is never sent, so {@link rankOf} uses
 * `headlinerForecast.avgWait`.
 */
function ratedOpenDays(
  days: CalendarDay[],
  todayIso: string,
  monthIsPast: boolean
): Array<CalendarDay & { rank: number }> {
  return extremeCandidates(days, todayIso, monthIsPast).map((day) => ({
    ...day,
    rank: rankOf(day, CROWD_RANK[day.crowdLevel as Exclude<CrowdLevel, 'unknown'>]),
  }));
}

/** The median rank of a set already known to be non-empty. */
function medianRank(ranks: number[]): number {
  const sorted = [...ranks].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * The days at one extreme of the month, or `null` if naming them would overstate the data.
 * `direction` is `-1` for the quiet end and `1` for the busy end; the median test is mirrored, so
 * both ends refuse on a flat month.
 */
function extremeDays(
  rated: Array<CalendarDay & { rank: number }>,
  direction: -1 | 1
): NamedCalendarDay[] | null {
  if (rated.length < MIN_RATED_DAYS) return null;

  const median = medianRank(rated.map((d) => d.rank));
  const best = rated.reduce(
    (acc, d) => (direction < 0 ? Math.min(acc, d.rank) : Math.max(acc, d.rank)),
    rated[0].rank
  );

  // Strictly beyond the median, so an all-`moderate` month names nothing at either end.
  if (direction < 0 ? !(best < median) : !(best > median)) return null;

  const winners = rated.filter((d) => d.rank === best);
  if (winners.length > MAX_NAMED_DAYS) return null;

  return winners
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ date: d.date, crowdLevel: d.crowdLevel as CrowdLevel }));
}

/**
 * The opening/closing pair most of the month's open days share, when most of them do.
 * `/calendar` sends full UTC instants, so the pair is formatted in the PARK's zone before grouping;
 * raw strings would print the wrong hour and split one local 09:00 into two patterns across a DST
 * change.
 */
function hoursPattern(
  days: CalendarDay[],
  timeZone: string,
  openDays: number
): MonthHoursPattern | null {
  const counts = new Map<string, number>();
  let openWithHours = 0;
  for (const day of days) {
    if (day.status !== 'OPERATING') continue;
    const h = day.hours;
    if (!h || h.type !== 'OPERATING' || !h.openingTime || !h.closingTime) continue;
    let open: string;
    let close: string;
    try {
      open = formatInTimeZone(new Date(h.openingTime), timeZone, 'HH:mm');
      close = formatInTimeZone(new Date(h.closingTime), timeZone, 'HH:mm');
    } catch {
      // An unparseable instant or an unknown zone is one day's loss, not the month's.
      continue;
    }
    openWithHours += 1;
    const key = `${open}|${close}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (openWithHours === 0 || openDays === 0) return null;

  let bestKey = '';
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  // Under 60 % of the month's OPEN days (not the days that published hours) the pair describes a
  // minority, and „meist 11–20 Uhr" is wrong more often than a reader would forgive.
  if (bestCount / openDays < 0.6) return null;

  const [openingTime, closingTime] = bestKey.split('|');
  return { openingTime, closingTime };
}

/**
 * Reduce one month of calendar days to the handful of facts a page can state in a sentence.
 * `todayIso` is the park's own date, not the server's, so „war" versus „wird" does not flip with
 * where the render happened.
 */
export function summarizeCalendarMonth(
  days: CalendarDay[],
  todayIso: string,
  timeZone: string
): CalendarMonthSummary | null {
  if (!days.length) return null;

  const openDays = days.filter((d) => d.status === 'OPERATING').length;
  const lastDate = days.reduce((acc, d) => (d.date > acc ? d.date : acc), days[0].date);
  const isPast = lastDate < todayIso;

  // No operating day says nothing: the payload cannot tell a park shut for the season from a month
  // too far back for the schedule to be retained, and „an 0 von 30 Tagen geöffnet" would be false
  // for the second. The grid still shows what the API returned.
  if (openDays === 0) return null;
  const rated = ratedOpenDays(days, todayIso, isPast);

  const waits = rated
    .map((d) => d.headlinerForecast?.avgWait)
    // `>= 0`: the API rounds headliner waits to five minutes, so 0 is a real quiet-day value, not
    // a sentinel for „absent".
    .filter((w): w is number => typeof w === 'number' && Number.isFinite(w) && w >= 0);

  return {
    totalDays: days.length,
    openDays,
    closedDays: days.length - openDays,
    quietest: extremeDays(rated, -1),
    busiest: extremeDays(rated, 1),
    hours: hoursPattern(days, timeZone, openDays),
    schoolVacationDays: days.filter((d) => d.isSchoolVacation || d.isSchoolHoliday).length,
    avgHeadlinerWait: waits.length
      ? roundWaitTo5(waits.reduce((a, b) => a + b, 0) / waits.length)
      : null,
    isPast,
  };
}
