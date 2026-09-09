import type { CalendarDay } from '@/lib/api/types';
import { rankOf } from '@/lib/parks/calendar-month-summary';
import { CROWD_LEVEL_ORDER, type ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/**
 * Two calendar days, side by side, with a verdict — derived, not written.
 *
 * The calendar already holds everything somebody weighs when they are torn between two dates, and
 * until now it made them hold it in their head: open one day, read six figures, close it, open
 * the other, and remember. This module answers the question the grid was already carrying the
 * data for.
 *
 * **Pure, and no React** — the same reason `calendar-month-summary.ts` is: the refusals below are
 * what must not be wrong, and `pnpm test:day-comparison` pins them without a DOM.
 *
 * **No model, no sentence.** Every {@link DayComparisonReason} carries a key and the numbers
 * behind it and never any text; the wording is an ICU message the caller looks up, exactly as
 * `planner-fit-assistant.tsx` does with `fitLevers()`. That keeps the verdict deterministic,
 * testable, offline and free — and it keeps six locales honest, because a translated sentence is
 * a translated sentence and not a generated one.
 *
 * **The ranking is the calendar's own.** `rankOf` — crowd bucket plus the headliner wait scaled
 * over two hours — is what decides the „Empfohlen" star and the month summary's quietest day, so
 * a comparison that ranked differently would contradict the grid it was opened from. It is fed
 * `CROWD_LEVEL_ORDER.indexOf(...)`, the same bucket index `park-calendar-grid.tsx` feeds it.
 */

/** Which side a reason favours, or neither. */
export type DayComparisonSide = 'a' | 'b' | 'tie';

/** What a reason is about. The caller turns this into a sentence; this module never does. */
export type DayComparisonReasonKey = 'crowd' | 'wait' | 'hours' | 'weather' | 'holiday' | 'price';

/**
 * Why one day beats the other, with both measurements kept.
 *
 * `delta` is always `|a − b|` in the reason's own unit — minutes for `wait` and `hours`, crowd
 * buckets for `crowd`, millimetres for `weather`, days-of-holiday-pressure for `holiday`, and
 * the ticket currency's own unit for `price`. The sign lives in {@link better}, so a caller
 * never has to know which direction is good for which key.
 */
export interface DayComparisonReason {
  key: DayComparisonReasonKey;
  better: DayComparisonSide;
  /** The measurement for day A, in the reason's unit. */
  a: number;
  /** The measurement for day B. */
  b: number;
  /** `|a − b|`, so the caller prints a difference without recomputing it. */
  delta: number;
  /**
   * How much this reason moved the verdict, in `rankOf` units (1.0 = one crowd bucket).
   *
   * Only `crowd` and `wait` carry weight, because only those two are on `rankOf`'s scale. The
   * rest are context a reader weighs themselves — a rainy day is not automatically the worse day
   * for somebody who came for the indoor rides, and a module that scored it would be pretending
   * to know that.
   */
  weight: number;
  /**
   * The unit `a`, `b` and `delta` are in — so a caller formats without a lookup table of its own.
   *
   * `bucket` is the crowd scale's six steps, `minutes` is minutes, `mm` is millimetres of
   * precipitation, `days` counts holiday flags, and `currency` needs {@link DayComparison.currency}.
   */
  unit: 'bucket' | 'minutes' | 'mm' | 'days' | 'currency';
}

/** Why a day cannot win, whatever its numbers say. */
export type DayComparisonBlockerKey = 'closed' | 'past' | 'no-forecast';

export interface DayComparisonBlocker {
  key: DayComparisonBlockerKey;
  /** Which day it applies to. `'tie'` means both. */
  side: DayComparisonSide;
}

export interface DayComparison {
  better: DayComparisonSide;
  /**
   * How far apart the two days are, in the same `rankOf` units the grid's star uses.
   *
   * `clear` is at least {@link CLEAR_MARGIN} apart — half a crowd bucket, the same threshold
   * `park-calendar-grid.tsx` requires before it calls a day recommendable, and for the same
   * reason: below it the difference is five minutes of queue, which is not an answer.
   * `slight` is a real but small edge. `tie` is "these are the same day twice".
   */
  confidence: 'clear' | 'slight' | 'tie';
  /** Sorted, heaviest first; reasons with no weight keep their listed order after those. */
  reasons: DayComparisonReason[];
  blockers: DayComparisonBlocker[];
  /** ISO 4217 code, present only when a `price` reason is. */
  currency?: string;
}

/**
 * How far apart two days must rank before the verdict is stated as a clear one.
 *
 * Half a crowd bucket — deliberately the same `BEST_DAY_MARGIN` the grid uses to decide whether a
 * day earns its star. Two thresholds for "is this difference worth mentioning" on one page would
 * eventually disagree, and the reader would be looking at both at once.
 */
export const CLEAR_MARGIN = 0.5;

/**
 * Below this, the two days are called equal outright.
 *
 * A tenth of a bucket is twelve minutes of headliner wait. Under that, `rankOf`'s two inputs are
 * both saying "the same", and naming a winner would be reading noise aloud — the case the
 * acceptance criterion "sind beide Tage praktisch gleich, sagt die Ansicht genau das" is about.
 */
export const TIE_MARGIN = 0.1;

/** The bucket index `rankOf` wants, or `null` for a level that is not on the scale. */
function bucketOf(day: CalendarDay): number | null {
  const index = CROWD_LEVEL_ORDER.indexOf(day.crowdLevel as ColoredCrowdLevel);
  return index >= 0 ? index : null;
}

/**
 * The day's headliner wait, with the fallback the cell itself uses.
 *
 * `avgWaitTime` is declared on `CalendarDay` and, measured against production, never sent — 0 of
 * 30 days from `/calendar`. `headlinerForecast.avgWait` is the one continuous signal that
 * actually arrives, so it leads and the legacy field catches a park or a cached response that
 * does send one. Same order as `park-calendar-day.tsx`, on purpose: a comparison that read a
 * different number than the tile above it would be arguing with the grid.
 */
function waitOf(day: CalendarDay): number | null {
  const raw = day.headlinerForecast?.avgWait ?? day.avgWaitTime;
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** Minutes the park is scheduled to be open, or `null` where the hours are missing or nonsense. */
function openMinutesOf(day: CalendarDay): number | null {
  const hours = day.hours;
  if (!hours || hours.type !== 'OPERATING') return null;
  const open = minutesOfClock(hours.openingTime);
  const close = minutesOfClock(hours.closingTime);
  if (open === null || close === null) return null;
  // A closing time before the opening one is the day running past midnight, not a negative day.
  const span = close > open ? close - open : close + 24 * 60 - open;
  return span > 0 && span <= 24 * 60 ? span : null;
}

/**
 * `HH:mm` (or an ISO instant ending in one) to minutes past midnight.
 *
 * The API sends opening hours as `HH:mm` in the park's own zone in the payloads this module was
 * measured against, but `OperatingHours` is typed as a plain string and a full ISO timestamp has
 * appeared in neighbouring fields. Taking the FIRST `HH:mm` handles both without pulling in a
 * date library: a date carries no colon, so `2026-09-20T09:00:00+02:00` yields `09:00` — and NOT
 * the `02:00` a last-match rule would take out of the zone offset, which is how this read a
 * nine-hour day as a twenty-four-hour one until the test below caught it.
 *
 * Only the clock face is read, never the instant. That is right for what this measures — how long
 * the park is open is a question in park time, and both sides of the comparison are the same park
 * — and it is why no timezone is needed here at all.
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

/** Millimetres of rain forecast for the day, or `null`. `rainChance` is mm — the name lies. */
function rainOf(day: CalendarDay): number | null {
  const raw = day.weather?.precipitationMm ?? day.weather?.rainChance;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : null;
}

/**
 * How much holiday pressure a day is under, counted in flags rather than scored.
 *
 * A public holiday, a school vacation, a bridge day and the neighbouring regions' holidays each
 * add one. They are not weighted against each other because nothing here knows how: a German
 * public holiday empties the offices and fills Phantasialand, a school vacation in a region three
 * hours away does something smaller and unmeasured. Counting them keeps the row honest — it says
 * "this day has three of these and that one has none" and lets the reader decide.
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

/** A reason whose two sides are known, or `null` where either side has nothing to say. */
function reason(
  key: DayComparisonReasonKey,
  unit: DayComparisonReason['unit'],
  a: number | null,
  b: number | null,
  /** `'lower'` = the smaller number is the better day. */
  direction: 'lower' | 'higher',
  weight = 0
): DayComparisonReason | null {
  // Missing on either side means the row is dropped, not guessed at. Half a comparison — "day A
  // has 30 minutes, day B has nothing recorded" — reads as if B were the quieter one.
  if (a === null || b === null) return null;
  const delta = Math.abs(a - b);
  const better: DayComparisonSide =
    a === b ? 'tie' : direction === 'lower' ? (a < b ? 'a' : 'b') : a > b ? 'a' : 'b';
  return { key, better, a, b, delta, weight: better === 'tie' ? 0 : weight, unit };
}

/**
 * Everything that stops a day from being a candidate at all.
 *
 * A closed day, a day already gone, and a day with no rating are three different sentences and
 * all three mean the same thing for the verdict: this side does not win. They are reported rather
 * than silently losing, because "the 14th is better" about a day the park is shut is worse than
 * no answer.
 */
function blockersFor(day: CalendarDay, todayIso: string): DayComparisonBlockerKey[] {
  const keys: DayComparisonBlockerKey[] = [];
  if (day.status === 'CLOSED' || day.crowdLevel === 'closed') keys.push('closed');
  if (day.date < todayIso) keys.push('past');
  if (bucketOf(day) === null && waitOf(day) === null) keys.push('no-forecast');
  return keys;
}

/**
 * Compare two calendar days and say which one is the better visit.
 *
 * `todayIso` is `YYYY-MM-DD` in the **park's** timezone, not the browser's — a Florida park is
 * still on yesterday's date for six hours after midnight in Berlin, and "is this day in the past"
 * is exactly the question that gets wrong. The grid already computes that value for its HEUTE
 * badge; this takes the same one.
 *
 * The verdict is decided by `rankOf` alone, over the two reasons that are on its scale. The other
 * four rows are reported and never scored — see {@link DayComparisonReason.weight}.
 */
export function compareDays(a: CalendarDay, b: CalendarDay, todayIso: string): DayComparison {
  const blockedA = blockersFor(a, todayIso);
  const blockedB = blockersFor(b, todayIso);
  const blockers: DayComparisonBlocker[] = [];
  for (const key of blockedA) {
    // One entry for a fault both days share, rather than the same sentence twice.
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

  const rankA = bucketA === null ? null : rankOf(a, bucketA);
  const rankB = bucketB === null ? null : rankOf(b, bucketB);

  const reasons = [
    // The crowd bucket carries the whole bucket difference; the wait carries what `rankOf` scales
    // it to (a two-hour queue is worth 0.99 of a bucket, no more). Together they are exactly the
    // gap between the two ranks, which is what decides the verdict — the weights explain it
    // rather than forming a second, competing score.
    reason(
      'crowd',
      'bucket',
      bucketA,
      bucketB,
      'lower',
      bucketA !== null && bucketB !== null ? Math.abs(bucketA - bucketB) : 0
    ),
    reason(
      'wait',
      'minutes',
      waitA,
      waitB,
      'lower',
      waitA !== null && waitB !== null
        ? Math.abs(Math.min(0.99, waitA / 120) - Math.min(0.99, waitB / 120))
        : 0
    ),
    reason('hours', 'minutes', openMinutesOf(a), openMinutesOf(b), 'higher'),
    reason('weather', 'mm', rainOf(a), rainOf(b), 'lower'),
    reason('holiday', 'days', holidayPressureOf(a), holidayPressureOf(b), 'lower'),
    // Only where BOTH days carry a price and both quote it in the same currency: "40 € against
    // 45 $" is not a comparison, and converting would be inventing an exchange rate.
    a.ticket?.price && b.ticket?.price && a.ticket.price.currency === b.ticket.price.currency
      ? reason('price', 'currency', a.ticket.price.amount, b.ticket.price.amount, 'lower')
      : null,
  ].filter((entry): entry is DayComparisonReason => entry !== null);

  reasons.sort((x, y) => y.weight - x.weight);

  const currency = reasons.some((r) => r.key === 'price') ? a.ticket?.price?.currency : undefined;

  // A blocked day never wins. Where exactly one side is blocked the other takes it by default —
  // "the park is open on the 14th and shut on the 15th" is a clear answer and does not need a
  // rank. Where both are blocked there is nothing to choose between.
  const aBlocked = blockedA.length > 0;
  const bBlocked = blockedB.length > 0;
  if (aBlocked || bBlocked) {
    const better: DayComparisonSide = aBlocked && bBlocked ? 'tie' : aBlocked ? 'b' : 'a';
    return {
      better,
      confidence: better === 'tie' ? 'tie' : 'clear',
      reasons,
      blockers,
      ...(currency ? { currency } : {}),
    };
  }

  // Both days are candidates but neither carries a rank: nothing on `rankOf`'s scale arrived, so
  // there is no verdict to give. `blockersFor` has already said why.
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
