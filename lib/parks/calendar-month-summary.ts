import { formatInTimeZone } from 'date-fns-tz';

import type { CalendarDay, CrowdLevel } from '@/lib/api/types';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

/**
 * What a month page can say about its month, in text, on the server.
 *
 * The month grid is a `ssr: false` dynamic import — it formats every cell against the browser
 * clock and picks its layout from the live viewport, neither of which a server render can do. The
 * consequence was invisible until somebody diffed two of the pages: the served HTML of
 * `/wartezeiten-kalender/2026/11` and `/wartezeiten-kalender/2026/2` was **99.5 % the same text**,
 * 1.097 words each, and the five passages that differed were five occurrences of the word
 * „November". Everything a visitor came for arrived after a client fetch, behind 149 skeleton
 * elements. Multiply by the route's window and the catalogue and that is 212 parks × 25 months ×
 * 6 locales — 31.800 URLs distinguishable by one word.
 *
 * So the month's answer is derived here, from the same payload the grid fetches, and rendered as
 * sentences above it. This module is pure and holds no React: it takes the days and returns the
 * findings, which is what lets `pnpm test:calendar-month` pin the refusals below without
 * a DOM.
 *
 * **Every field may be `null`, and that is the point.** A month with four open days has no
 * quietest day worth naming, and inventing one puts a claim on 31.800 pages that the grid under
 * it contradicts. The rules that produce a `null` are the same shape as the ones the
 * best-travel-time hub uses for the quietest weekday: a candidate has to beat the month's own
 * median, a tie names both days, and too many days sharing the minimum means the month has no
 * quiet day rather than six of them.
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
 * Fewest rated open days a month needs before any day of it is called quiet or busy.
 *
 * Eight is where a "quietest day" stops being an artefact of a short season. A park open six days
 * in November has a minimum, but it is the minimum of six numbers and the next visitor's
 * experience is not governed by it.
 */
const MIN_RATED_DAYS = 8;

/**
 * How many days may share the honour before the month is declared to have no quiet day.
 *
 * Two is a real finding — a park genuinely has two equally quiet Tuesdays and both are worth
 * naming. Four days at the same minimum is a flat month, and „am ruhigsten wird es am 3., 10.,
 * 17. und 24." is a list, not an answer.
 */
const MAX_NAMED_DAYS = 3;

/** A day the summary names, reduced to what the sentence needs. */
export interface NamedCalendarDay {
  /** `YYYY-MM-DD`, exactly as the API sent it. Formatting is the caller's job and locale's. */
  date: string;
  crowdLevel: CrowdLevel;
}

/** The most common opening hours in a month, and how well they describe it. */
export interface MonthHoursPattern {
  /** `HH:mm` in the PARK's zone, already formatted — see {@link hoursPattern}. */
  openingTime: string;
  /** `HH:mm` in the park's zone. */
  closingTime: string;
}

export interface CalendarMonthSummary {
  /** Days in the calendar month, as delivered — not `new Date` arithmetic over a DST boundary. */
  totalDays: number;
  /** Days the park is scheduled to operate. */
  openDays: number;
  /** Days it is not. `totalDays - openDays`, kept explicit so a caller cannot subtract wrongly. */
  closedDays: number;
  /**
   * The quietest days, or `null` when the month refuses to name one.
   *
   * Non-null means: at least {@link MIN_RATED_DAYS} rated open days, the winner is strictly below
   * the month's own median, and at most {@link MAX_NAMED_DAYS} days share the minimum.
   */
  quietest: NamedCalendarDay[] | null;
  /** The busiest days, under the mirror-image rule (strictly above the median). */
  busiest: NamedCalendarDay[] | null;
  /**
   * The month's usual opening hours, or `null` when no single pair covers most of it.
   *
   * A park running 11–18 for two weeks and 11–20 for the other two has no "usual" hours, and
   * printing either one is wrong on half the month.
   */
  hours: MonthHoursPattern | null;
  /** Days inside a school vacation for the park's own region. */
  schoolVacationDays: number;
  /**
   * Mean headliner wait across rated days, on the five-minute grid, or `null`.
   *
   * `roundWaitTo5` at the end and never per day: averaging values that were each rounded first
   * drags the mean toward whichever multiple happened to be common.
   */
  avgHeadlinerWait: number | null;
  /** True when the month is wholly in the past, so the prose can use the past tense. */
  isPast: boolean;
}

/**
 * The days a month's extremes may be picked from — the one definition both surfaces use.
 *
 * The summary sentence and the grid's „Empfohlen" star each had their own list, and that is
 * enough to make them disagree even after they were given a shared `rankOf`: the grid dropped
 * school and public holidays and kept today, the summary kept the holidays and dropped today, and
 * their medians were therefore computed over different populations. A park whose calmest day
 * falls inside a school holiday — which the summary counts and the grid did not — got „am
 * ruhigsten wird es am Dienstag, 3." above a grid where the 3rd wore no star.
 *
 * `isToday` stays out for both: `crowdLevel` is overridden with a live spot reading on today
 * alone, so it is not on the same scale as the rest of the month. Holidays stay IN for both —
 * a quiet Whit Monday is still the month's quietest day, and hiding it is a different claim.
 */
export function extremeCandidates(
  days: CalendarDay[],
  todayIso: string,
  monthIsPast: boolean
): CalendarDay[] {
  return days.filter((day) => {
    if (day.status !== 'OPERATING') return false;
    if (day.isToday) return false;
    if (!monthIsPast && day.date < todayIso) return false;
    const level = day.crowdLevel;
    return level !== 'closed' && level !== 'unknown' && CROWD_RANK[level] !== undefined;
  });
}

/**
 * One comparable number per day: the crowd bucket first, the headliner wait as the tie-break.
 *
 * The bucket dominates (a `moderate` day never sorts below a `low` one however short its queues),
 * and within a bucket the wait separates days the six-value scale cannot. The wait is squeezed
 * into the gap below 1 so an outlier can never climb a whole bucket.
 *
 * Exported because the calendar grid's „Empfohlen" badges rank on it too. The two used to
 * disagree on the same page: the grid marked every day at the lowest bucket — 23 of 30 in one
 * measured month — while this module, applying a median test, said the month had no quiet day at
 * all. One definition, both surfaces.
 */
export function rankOf(day: CalendarDay, bucket: number): number {
  const wait = day.headlinerForecast?.avgWait;
  const within =
    typeof wait === 'number' && Number.isFinite(wait) ? Math.min(0.99, Math.max(0, wait) / 120) : 0;
  return bucket + within;
}

/**
 * A day that counts: scheduled to operate, carrying a rating, and comparable to the others.
 *
 * Two things here are not obvious and both were wrong first.
 *
 * **Today is excluded.** `CalendarDay.crowdLevel` is documented as being overridden on TODAY with
 * the live occupancy, while every other day carries a day aggregate — two different statistics
 * under one field name. A hub rendered at 09:30 on a Saturday reads today as `very_low` because
 * nobody has queued yet, and today would be named the month's quietest day on its busiest
 * weekday, with the grid underneath saying the opposite. One day out of thirty is a cheap price
 * for every remaining day being on the same scale.
 *
 * **The ordering breaks ties, because the six-value enum cannot.** `CrowdLevel` has six buckets
 * and a month has thirty days, so ties are the rule rather than the exception: a park whose
 * weekdays forecast `very_low` and weekends `high` — the archetypal quiet-day shape this whole
 * block exists to surface — puts twenty days on the minimum, and {@link MAX_NAMED_DAYS} then
 * suppresses the sentence on exactly the months that had the clearest answer.
 *
 * The obvious tie-breaker is `crowdScore`, the continuous value the bucket came from, and it is
 * declared on `CalendarDay`. It is also never sent: measured against production, 0 of 30 days
 * from `/calendar` and 0 of 91 from `/best-days` carry one, and `avgWaitTime` is empty on the
 * same payloads. What does arrive is `headlinerForecast.avgWait` — see {@link rankOf}.
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
 *
 * `direction` is `-1` for the quiet end and `1` for the busy end; the median test is the same
 * comparison mirrored, so both ends refuse on a flat month rather than one of them inventing a
 * winner out of rounding.
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

  // A "quietest" day that is not actually below the month's own middle is a label, not a finding.
  // Strictly, so an all-`moderate` month names nothing at either end.
  if (direction < 0 ? !(best < median) : !(best > median)) return null;

  const winners = rated.filter((d) => d.rank === best);
  if (winners.length > MAX_NAMED_DAYS) return null;

  return winners
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ date: d.date, crowdLevel: d.crowdLevel as CrowdLevel }));
}

/**
 * The opening/closing pair most of the month's open days share, when most of them do.
 *
 * Grouped on the pair as the PARK reads it, not as the payload sends it. `/calendar` answers with
 * full UTC instants — Phantasialand's 09:00 opening arrives as `2026-11-01T08:00:00.000Z` — so
 * slicing `HH:mm` out of the string prints an hour that is wrong for most of the catalogue and
 * wrong twice a year for the rest. It also has to happen BEFORE the grouping: a park keeping 09:00
 * local across a DST change sends two different UTC instants for it, which as raw strings are two
 * patterns and would drop the month below the 60 % floor for no reason a reader could see.
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
  // Under 60 % the pair describes a minority of the month and „meist 11–20 Uhr" becomes a claim
  // that is wrong more often than a reader would forgive.
  //
  // Measured against the month's OPEN days, not against the days that happened to publish hours.
  // With the latter as the denominator a park that published hours on 3 of its 30 open days
  // scored 3/3 = 100 % and printed „meist von 09:00 bis 19:00 Uhr" off a tenth of the month —
  // the exact claim this floor exists to refuse.
  if (bestCount / openDays < 0.6) return null;

  const [openingTime, closingTime] = bestKey.split('|');
  return { openingTime, closingTime };
}

/**
 * Reduce one month of calendar days to the handful of facts a page can state in a sentence.
 *
 * `todayIso` is the park's own date (`YYYY-MM-DD`), not the server's: a park in Florida is still
 * on yesterday for six hours after midnight in Berlin, and „im November war es" versus „wird es"
 * must not flip based on where the render happened.
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

  // A month with no operating day at all says nothing, and saying it anyway would be a lie on a
  // large scale. Two very different situations produce this and the payload cannot tell them
  // apart: a park genuinely shut for the season (Europa-Park answers 0 of 28 for February 2026,
  // which is correct — it is closed), and a month too far back for the schedule to be retained
  // (Phantasialand answers 0 of 30 for September 2025, which is not — it was open every day).
  // „Im September 2025 war das Phantasialand an 0 von 30 Tagen geöffnet" would be false, and it
  // would be false on roughly half the past months of the catalogue at once. Both cases get no
  // summary; the grid below still shows what the API actually returned.
  if (openDays === 0) return null;
  const rated = ratedOpenDays(days, todayIso, isPast);

  const waits = rated
    .map((d) => d.headlinerForecast?.avgWait)
    // `>= 0`, not `> 0`: the API rounds headliner waits to five minutes, so 0 is a value it
    // really emits on a quiet day, not a sentinel for „absent". Dropping those days computed the
    // month's average over its busy half and printed a number the grid underneath contradicts.
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
