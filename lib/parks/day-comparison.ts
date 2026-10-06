import type { CalendarDay } from '@/lib/api/types';
import { rankOf } from '@/lib/parks/calendar-month-summary';
import { CROWD_LEVEL_ORDER, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/**
 * Two calendar days side by side, with a derived verdict. Pure and React-free so
 * `pnpm test:day-comparison` can pin the refusals without a DOM.
 *
 * Reasons carry a key and numbers, never text; the caller looks up an ICU message, as
 * `planner-fit-assistant.tsx` does with `fitLevers()`. The ranking is the calendar's own `rankOf`,
 * fed the same `CROWD_LEVEL_ORDER` index as `park-calendar-grid.tsx`, so the comparison cannot
 * contradict the grid it was opened from.
 */

/** Which side a reason favours, or neither. */
export type DayComparisonSide = 'a' | 'b' | 'tie';

/** What a reason is about. The caller turns this into a sentence; this module never does. */
export type DayComparisonReasonKey = 'crowd' | 'wait' | 'hours' | 'weather' | 'holiday' | 'price';

/**
 * Why one day beats the other, with both measurements kept. `delta` is `|a − b|` in the reason's
 * own unit; the direction lives in `better`, so a caller never needs to know which way is good.
 */
export interface DayComparisonReason {
  key: DayComparisonReasonKey;
  better: DayComparisonSide;
  a: number;
  b: number;
  delta: number;
  /**
   * How much this reason moved the verdict, in `rankOf` units (1.0 = one crowd bucket).
   * Only `crowd` and `wait` are on that scale; the rest are context the reader weighs, since a
   * rainy day is not automatically worse for somebody who came for the indoor rides.
   */
  weight: number;
  /** The unit of `a`, `b` and `delta`; `currency` needs {@link DayComparison.currency}. */
  unit: 'bucket' | 'minutes' | 'mm' | 'days' | 'currency';
}

/** Why a day cannot win, whatever its numbers say. */
export type DayComparisonBlockerKey = 'closed' | 'past' | 'no-forecast';

/** A reason one or both days cannot win, whatever their numbers say. */
export interface DayComparisonBlocker {
  key: DayComparisonBlockerKey;
  /** Which day it applies to. `'tie'` means both. */
  side: DayComparisonSide;
}

/** The verdict for two days, with the reasons and blockers behind it. */
export interface DayComparison {
  better: DayComparisonSide;
  /**
   * How far apart the two days rank: `clear` is at least {@link CLEAR_MARGIN}, `slight` a real
   * but small edge, `tie` below {@link TIE_MARGIN}.
   */
  confidence: 'clear' | 'slight' | 'tie';
  /** Sorted, heaviest first; reasons with no weight keep their listed order after those. */
  reasons: DayComparisonReason[];
  blockers: DayComparisonBlocker[];
  /** ISO 4217 code, present only when a `price` reason is. */
  currency?: string;
}

/**
 * How far apart two days must rank for a clear verdict: half a crowd bucket, the same margin the
 * grid uses for its star, so the two thresholds on one page cannot disagree.
 */
export const CLEAR_MARGIN = 0.5;

/**
 * Below this the two days are called equal. A tenth of a bucket is twelve minutes of headliner
 * wait, and naming a winner under that would be reading noise aloud.
 */
export const TIE_MARGIN = 0.1;

/**
 * How much of a crowd bucket a wait is worth: `rankOf`'s own scaling (two hours = 0.99), repeated
 * here so {@link rankWith} can apply it to the fallback wait `rankOf` does not read.
 */
function waitWithinBucket(wait: number): number {
  return Math.min(0.99, Math.max(0, wait) / 120);
}

/**
 * The bucket index `rankOf` wants, or `null` where the day has none. `status` is read too, because
 * a day the park has since closed can still carry its forecast crowd level, and a shut day is not
 * quiet.
 */
function bucketOf(day: CalendarDay): number | null {
  if (day.status === 'CLOSED' || day.crowdLevel === 'closed') return null;
  const index = CROWD_LEVEL_ORDER.indexOf(day.crowdLevel as ColoredCrowdLevel);
  return index >= 0 ? index : null;
}

/**
 * The day's headliner wait, with the fallback the cell uses. `avgWaitTime` is declared but in
 * practice never sent, so `headlinerForecast.avgWait` leads; same order as `park-calendar-day.tsx`
 * so the comparison reads the number the tile shows.
 */
function waitOf(day: CalendarDay): number | null {
  const raw = day.headlinerForecast?.avgWait ?? day.avgWaitTime;
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

/**
 * The calendar's rank for a day over the same wait this module reports. `rankOf` reads only
 * `headlinerForecast.avgWait`; where only the `avgWaitTime` fallback exists, the same scaling is
 * applied here so the verdict does not contradict the wait row.
 */
function rankWith(day: CalendarDay, bucket: number, includeWait: boolean): number {
  // False where the OTHER day has no wait: a wait counted on one side only reads a missing figure
  // as „no queue". The wait tips the verdict only when both figures are on screen.
  if (!includeWait) return bucket;
  const wait = waitOf(day);
  const headliner = day.headlinerForecast?.avgWait;
  // Where `rankOf` has a wait to read, it IS the ranking. The condition is `waitOf`'s, because
  // `rankOf` scores an `avgWait` of 0 that `waitOf` rejects.
  if (wait !== null && typeof headliner === 'number' && Number.isFinite(headliner) && headliner > 0)
    return rankOf(day, bucket);
  return wait === null ? bucket : bucket + waitWithinBucket(wait);
}

/** Minutes the park is scheduled to be open, or `null` where the hours are missing or nonsense. */
function openMinutesOf(day: CalendarDay): number | null {
  const hours = day.hours;
  if (!hours || hours.type !== 'OPERATING') return null;
  const open = minutesOfClock(hours.openingTime);
  const close = minutesOfClock(hours.closingTime);
  if (open === null || close === null) return null;
  // A close before the open runs past midnight. Equal is ambiguous (zero hours or twenty-four), so
  // the row is dropped.
  if (close === open) return null;
  const span = close > open ? close - open : close + 24 * 60 - open;
  return span > 0 && span < 24 * 60 ? span : null;
}

/**
 * `HH:mm` (or an ISO instant containing one) to minutes past midnight. Takes the FIRST match, so
 * `2026-09-20T09:00:00+02:00` yields `09:00` and not the zone offset. Only the clock face is read:
 * both days are the same park, so no timezone is needed.
 */
function minutesOfClock(value: string | undefined): number | null {
  if (typeof value !== 'string') return null;
  const matches = value.match(/(\d{1,2}):(\d{2})/g);
  if (!matches || matches.length === 0) return null;
  const [h, m] = matches[0].split(':');
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Millimetres of rain forecast for the day, or `null`. `rainChance` is mm despite its name. */
function rainOf(day: CalendarDay): number | null {
  const raw = day.weather?.precipitationMm ?? day.weather?.rainChance;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null;
}

/**
 * Holiday pressure on a day, counted in flags rather than scored: nothing here knows how a public
 * holiday weighs against a school vacation three hours away, so the row reports the count and
 * lets the reader decide.
 */
function holidayPressureOf(day: CalendarDay): number {
  let count = 0;
  if (day.isPublicHoliday || day.isHoliday) count += 1;
  if (day.isSchoolVacation || day.isSchoolHoliday) count += 1;
  if (day.isBridgeDay) count += 1;
  if ((day.influencingHolidays?.length ?? 0) > 0 || (day.neighborHolidays?.length ?? 0) > 0)
    count += 1;
  return count;
}

/**
 * The wait row, in the terms the verdict reads it. `rankOf` clamps at two hours, so 130 and 210
 * minutes are identical to the verdict; where both waits scale to the same contribution the row
 * names no winner, though both figures and the difference still print.
 */
function waitReason(waitA: number | null, waitB: number | null): DayComparisonReason | null {
  const entry = reason('wait', 'minutes', waitA, waitB, 'lower');
  if (!entry || waitA === null || waitB === null) return entry;
  const withinA = waitWithinBucket(waitA);
  const withinB = waitWithinBucket(waitB);
  if (withinA === withinB) return { ...entry, better: 'tie', weight: 0 };
  return { ...entry, weight: Math.abs(withinA - withinB) };
}

/**
 * The holiday row, or `null` where neither day has any holiday pressure. Zero against zero is two
 * blanks, not a tie, and a row that is always present would make the dialog's „no comparable
 * figures" branch unreachable.
 */
function holidayRow(a: CalendarDay, b: CalendarDay): DayComparisonReason | null {
  const pressureA = holidayPressureOf(a);
  const pressureB = holidayPressureOf(b);
  if (pressureA === 0 && pressureB === 0) return null;
  return reason('holiday', 'days', pressureA, pressureB, 'lower');
}

/** A reason whose two sides are known, or `null` where either side has nothing to say. */
function reason(
  key: DayComparisonReasonKey,
  unit: DayComparisonReason['unit'],
  a: number | null | undefined,
  b: number | null | undefined,
  /** `'lower'` = the smaller number is the better day. */
  direction: 'lower' | 'higher',
  weight = 0
): DayComparisonReason | null {
  // Missing on either side drops the row; half a comparison reads as if the blank side were
  // quieter. Checked by value because the ticket price comes straight off the payload, and an
  // absent `amount` would turn into a `NaN` winner and „NaN €".
  if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b))
    return null;
  const delta = Math.abs(a - b);
  const better: DayComparisonSide =
    a === b ? 'tie' : direction === 'lower' ? (a < b ? 'a' : 'b') : a > b ? 'a' : 'b';
  return { key, better, a, b, delta, weight: better === 'tie' ? 0 : weight, unit };
}

/**
 * Everything that stops a day from being a candidate: closed, past, or unrated. Reported rather
 * than silently losing, because „the 14th is better" about a day the park is shut is worse than
 * no answer.
 */
function blockersFor(day: CalendarDay, todayIso: string): DayComparisonBlockerKey[] {
  const keys: DayComparisonBlockerKey[] = [];
  const closed = day.status === 'CLOSED' || day.crowdLevel === 'closed';
  if (closed) keys.push('closed');
  if (day.date < todayIso) keys.push('past');
  // The crowd bucket is what the verdict ranks, so a day without one cannot win even when a wait
  // arrived. Not reported for a closed day (one fact told twice). `UNKNOWN` status counts too, so
  // an unrated day cannot win and then lack the plan button, which asks for `OPERATING`.
  if (!closed && (day.status === 'UNKNOWN' || bucketOf(day) === null)) keys.push('no-forecast');
  return keys;
}

/**
 * Compare two calendar days and say which one is the better visit.
 * `todayIso` is `YYYY-MM-DD` in the **park's** timezone (the grid's HEUTE value): a Florida park is
 * still on yesterday for six hours after midnight in Berlin. Only `crowd` and `wait` decide the
 * verdict; the other rows are reported, never scored.
 */
export function compareDays(a: CalendarDay, b: CalendarDay, todayIso: string): DayComparison {
  const blockedA = blockersFor(a, todayIso);
  const blockedB = blockersFor(b, todayIso);
  const blockers: DayComparisonBlocker[] = [];
  for (const key of blockedA) {
    if (blockedB.includes(key)) blockers.push({ key, side: 'tie' });
    else blockers.push({ key, side: 'a' });
  }
  for (const key of blockedB) {
    if (!blockedA.includes(key)) blockers.push({ key, side: 'b' });
  }

  const bucketA = bucketOf(a);
  const bucketB = bucketOf(b);
  const waitA = waitOf(a);
  const waitB = waitOf(b);

  // The wait enters the ranking only when BOTH days have one, the same condition that draws the
  // wait row, so the verdict never rests on a figure the reader cannot see.
  const comparableWaits = waitA !== null && waitB !== null;
  const rankA = bucketA === null ? null : rankWith(a, bucketA, comparableWaits);
  const rankB = bucketB === null ? null : rankWith(b, bucketB, comparableWaits);

  // ISO 4217 codes only: `Intl.NumberFormat` throws a `RangeError` on anything else during render,
  // and a price row that cannot be labelled goes with it rather than borrowing another currency.
  const sharedCurrency =
    a.ticket?.price && b.ticket?.price && a.ticket.price.currency === b.ticket.price.currency
      ? a.ticket.price.currency
      : undefined;
  const priceCurrency =
    sharedCurrency && /^[A-Za-z]{3}$/.test(sharedCurrency) ? sharedCurrency : undefined;

  const reasons = [
    // Crowd carries the bucket difference and wait what `rankOf` scales it to; together they are
    // the gap between the two ranks, explaining the verdict rather than forming a second score.
    reason(
      'crowd',
      'bucket',
      bucketA,
      bucketB,
      'lower',
      bucketA !== null && bucketB !== null ? Math.abs(bucketA - bucketB) : 0
    ),
    waitReason(waitA, waitB),
    reason('hours', 'minutes', openMinutesOf(a), openMinutesOf(b), 'higher'),
    reason('weather', 'mm', rainOf(a), rainOf(b), 'lower'),
    holidayRow(a, b),
    // Only where both days quote a price in the same, formattable currency: converting would
    // invent an exchange rate, and the house rule is to withhold a price rather than assume its
    // currency.
    priceCurrency
      ? reason('price', 'currency', a.ticket?.price?.amount, b.ticket?.price?.amount, 'lower')
      : null,
  ].filter((entry): entry is DayComparisonReason => entry !== null);

  // A blocked day never wins a row either: a closed day keeps a stale `headlinerForecast` and a
  // `ticket.price`, and ticks under it would contradict the headline. Both figures stay visible.
  const aBlocked = blockedA.length > 0;
  const bBlocked = blockedB.length > 0;
  for (const entry of reasons) {
    if ((entry.better === 'a' && aBlocked) || (entry.better === 'b' && bBlocked)) {
      entry.better = 'tie';
      entry.weight = 0;
    }
  }

  reasons.sort((x, y) => y.weight - x.weight);

  const currency = reasons.some((r) => r.key === 'price') ? priceCurrency : undefined;

  // A blocked day never wins. With one side blocked the other takes it; with both blocked,
  // `better: 'tie'` tells the caller to say „neither can be compared" rather than „equally good".
  if (aBlocked || bBlocked) {
    const better: DayComparisonSide = aBlocked && bBlocked ? 'tie' : aBlocked ? 'b' : 'a';
    // `closed` and `past` are facts about the day, so the survivor wins clearly. `no-forecast` is
    // a fact about us: the unrated day may be better, so the verdict stands but only as `slight`.
    const losing = aBlocked ? blockedA : blockedB;
    const unratedOnly = losing.every((key) => key === 'no-forecast');
    return {
      better,
      confidence: better === 'tie' ? 'tie' : unratedOnly ? 'slight' : 'clear',
      reasons,
      blockers,
      ...(currency ? { currency } : {}),
    };
  }

  // Unreachable while `blockersFor` reports a missing bucket; kept so a drift between the two is a
  // tie and not a crash.
  if (rankA === null || rankB === null) {
    return {
      better: 'tie',
      confidence: 'tie',
      reasons,
      blockers,
      ...(currency ? { currency } : {}),
    };
  }

  const gap = Math.abs(rankA - rankB);
  const better: DayComparisonSide = gap < TIE_MARGIN ? 'tie' : rankA < rankB ? 'a' : 'b';
  const confidence: DayComparison['confidence'] =
    better === 'tie' ? 'tie' : gap >= CLEAR_MARGIN ? 'clear' : 'slight';

  return { better, confidence, reasons, blockers, ...(currency ? { currency } : {}) };
}
