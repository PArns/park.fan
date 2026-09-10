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

/**
 * How much of a crowd bucket a wait time is worth — `rankOf`'s own scaling, spelled out.
 *
 * Duplicated from `calendar-month-summary.ts` rather than exported from it, because what is
 * needed here is the SCALING and not the whole ranking: {@link rankWith} applies it to the
 * fallback wait `rankOf` does not read. Two hours is the ceiling there and here.
 */
function waitWithinBucket(wait: number): number {
  return Math.min(0.99, Math.max(0, wait) / 120);
}

/**
 * The bucket index `rankOf` wants, or `null` where the day has none.
 *
 * `status` is read as well as `crowdLevel`, because the two can disagree: a day the park has
 * since closed can still carry the crowd level it was forecast at. Reading only the level built a
 * crowd row for it and ticked it — „Geschlossen" printed as the winning value beside
 * „Unterschied: 3 Stufen", under a verdict naming the other day. A shut day is not quiet.
 */
function bucketOf(day: CalendarDay): number | null {
  if (day.status === 'CLOSED' || day.crowdLevel === 'closed') return null;
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

/**
 * The calendar's own rank for a day, over the SAME wait this module reports.
 *
 * `rankOf` reads `headlinerForecast.avgWait` and nothing else, which is right for the grid: that
 * is the field the API actually sends. This module also reports `avgWaitTime` where a payload
 * carries one — the fallback the tile itself uses — and a verdict computed without it contradicts
 * the row directly above it: two days 75 minutes apart on the legacy field came back as a tie,
 * with the wait row ticked for one of them.
 *
 * So: `rankOf` wherever it has something to read, and its own arithmetic over the fallback where
 * it has not. `rankOf` is not changed and not re-implemented — {@link waitWithinBucket} is the one
 * line of it this needs.
 */
function rankWith(day: CalendarDay, bucket: number, includeWait: boolean): number {
  // `includeWait` is false where the OTHER day has no wait — see the call site. A wait counted on
  // one side only is a missing figure read as „no queue": a day with no forecast at all beat a day
  // forecast at 60 minutes, on the strength of the number it did not have. The wait tips the
  // verdict exactly when the dialog can show both figures side by side, and never otherwise.
  if (!includeWait) return bucket;
  const wait = waitOf(day);
  const headliner = day.headlinerForecast?.avgWait;
  // Where `rankOf` has a wait of its own to read, it IS the ranking — the same function, called.
  // The condition is `waitOf`'s and not `rankOf`'s, because `rankOf` scores an `avgWait` of 0
  // while `waitOf` rejects it as no reading at all.
  if (wait !== null && typeof headliner === 'number' && Number.isFinite(headliner) && headliner > 0)
    return rankOf(day, bucket);
  // Otherwise the documented `avgWaitTime` fallback, under `rankOf`'s own scaling.
  return wait === null ? bucket : bucket + waitWithinBucket(wait);
}

/** Minutes the park is scheduled to be open, or `null` where the hours are missing or nonsense. */
function openMinutesOf(day: CalendarDay): number | null {
  const hours = day.hours;
  if (!hours || hours.type !== 'OPERATING') return null;
  const open = minutesOfClock(hours.openingTime);
  const close = minutesOfClock(hours.closingTime);
  if (open === null || close === null) return null;
  // A closing time BEFORE the opening one is the day running past midnight, not a negative day.
  // Equal is neither: `10:00–10:00` is as readable as a twenty-four-hour day as it is a zero-hour
  // one, and the overnight branch made it the former — a park „open 24 h" beating a normal day by
  // sixteen hours. Two readings and no way to choose means the row is dropped.
  if (close === open) return null;
  const span = close > open ? close - open : close + 24 * 60 - open;
  return span > 0 && span < 24 * 60 ? span : null;
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

/**
 * The wait row, in the terms the VERDICT reads it in.
 *
 * `rankOf` scales a wait over two hours and clamps there, so past 120 minutes every wait is the
 * same 0.99 of a bucket and two days at 130 and 210 minutes are, to the verdict, identical. The
 * row said otherwise: it ticked the shorter one under a headline reading „die beiden Tage nehmen
 * sich nichts". The ceiling is `rankOf`'s and is not moved — it decides the grid's own star — so
 * the ROW speaks in its terms instead: where the two waits scale to the same contribution, it
 * names no winner. Both figures stay on screen and the difference is still printed; what goes is
 * the claim that one of them is the better day.
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
 * The holiday row, or `null` where neither day is under any holiday pressure at all.
 *
 * „Feiertage und Ferien — keine / keine" is a row that reports nothing, and it appeared on the
 * ordinary comparison, which is most of them. It also made the dialog's „no comparable figures"
 * branch unreachable: something was always in the list, even for two closed days where every other
 * row is legitimately dropped.
 *
 * Zero against zero is not a tie — it is two blanks. One against zero is a real finding and stays.
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
  // Missing on either side means the row is dropped, not guessed at. Half a comparison — "day A
  // has 30 minutes, day B has nothing recorded" — reads as if B were the quieter one.
  //
  // Checked by VALUE and not against `null`, because not every caller hands this a number that
  // has been through a helper. The measurements do — `bucketOf`, `waitOf`, `openMinutesOf`,
  // `rainOf` all return `number | null` — but the ticket price is read straight off the payload,
  // where `amount` is a promise the wire makes and not one it keeps. An absent one subtracted to
  // `NaN`, and `NaN` is neither `<` nor `>`, so the row named a winner by falling through to the
  // `else` and then rendered its difference as „NaN €".
  if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b))
    return null;
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
  const closed = day.status === 'CLOSED' || day.crowdLevel === 'closed';
  if (closed) keys.push('closed');
  if (day.date < todayIso) keys.push('past');
  // The CROWD BUCKET is what the verdict is computed from, so a day without one cannot be ranked
  // — even when a wait time did arrive. That case used to fall through to „the two days are
  // equal" printed above a wait row showing a seventy-minute gap with one side ticked.
  //
  // Not reported for a closed day: a park that is shut has no forecast BY DEFINITION, and two
  // lines saying so is one fact told twice.
  // `UNKNOWN` counts too, and by exactly this name: the park has published no status for the day,
  // which is what „no forecast" says. Without it a day whose status is unknown but whose crowd
  // level survived could win outright — and then find no plan button under it, because the button
  // asks for `OPERATING`. The two questions are answered here, once.
  if (!closed && (day.status === 'UNKNOWN' || bucketOf(day) === null)) keys.push('no-forecast');
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

  // The wait enters the ranking only when BOTH days have one — the same condition that decides
  // whether the wait row is drawn, so the verdict can never rest on a figure the reader cannot see.
  const comparableWaits = waitA !== null && waitB !== null;
  const rankA = bucketA === null ? null : rankWith(a, bucketA, comparableWaits);
  const rankB = bucketB === null ? null : rankWith(b, bucketB, comparableWaits);

  /**
   * The currency both tickets are quoted in — and only if a formatter will accept it.
   *
   * ISO 4217 is three letters, and `Intl.NumberFormat` THROWS a `RangeError` on anything else,
   * inside the dialog's render. Validating here rather than at the call site keeps the malformed
   * value out of the type, and — the part that matters more — lets the price ROW go with it. A
   * row the caller cannot label is a number without a unit, and every fallback label it could
   * pick states a different price.
   */
  const sharedCurrency =
    a.ticket?.price && b.ticket?.price && a.ticket.price.currency === b.ticket.price.currency
      ? a.ticket.price.currency
      : undefined;
  const priceCurrency =
    sharedCurrency && /^[A-Za-z]{3}$/.test(sharedCurrency) ? sharedCurrency : undefined;

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
    waitReason(waitA, waitB),
    reason('hours', 'minutes', openMinutesOf(a), openMinutesOf(b), 'higher'),
    reason('weather', 'mm', rainOf(a), rainOf(b), 'lower'),
    holidayRow(a, b),
    // Only where BOTH days carry a price and both quote it in the same currency: "40 € against
    // 45 $" is not a comparison, and converting would be inventing an exchange rate.
    //
    // And only where that currency is one a formatter will NAME — see `priceCurrency`. A row
    // whose code cannot be rendered is worse than no row: the dialog has to fall back to
    // something, and „US$ 189" printed as „189 €" is not a formatting slip but a wrong price.
    // The house rule elsewhere (`fast-pass-badge.tsx`, `park-calendar-day-detail.tsx`) is to
    // withhold the price rather than assume a currency for it.
    priceCurrency
      ? reason('price', 'currency', a.ticket?.price?.amount, b.ticket?.price?.amount, 'lower')
      : null,
  ].filter((entry): entry is DayComparisonReason => entry !== null);

  // A blocked day never WINS a row either, not just the verdict.
  //
  // Without this the dialog contradicted itself in the most visible way it could: „1. Dezember ist
  // der deutlich bessere Tag" as the headline, and three ticks on the 1. September underneath it,
  // beside the line saying that day is in the past. The crowd and hours rows were already safe by
  // accident (`bucketOf` and `hours.type` both refuse a shut day); wait, weather, holiday and
  // price were not — a closed day keeps a stale `headlinerForecast` and a `ticket.price`.
  //
  // The row is kept and its two figures still shown, because they are still true and a reader
  // comparing „what would this day have been like" is entitled to them. What goes is the claim
  // that the blocked day is the better one.
  const aBlocked = blockedA.length > 0;
  const bBlocked = blockedB.length > 0;
  for (const entry of reasons) {
    if ((entry.better === 'a' && aBlocked) || (entry.better === 'b' && bBlocked)) {
      entry.better = 'tie';
      entry.weight = 0;
    }
  }

  reasons.sort((x, y) => y.weight - x.weight);

  // Only a code that `Intl.NumberFormat` will actually accept. It takes ISO 4217 — three letters,
  // nothing else — and THROWS a `RangeError` on anything it does not recognise, in the middle of
  // the dialog's render. Filtering here keeps the malformed value out of the type instead of
  // making every reader of `currency` defend against it; the price row itself is unaffected, its
  const currency = reasons.some((r) => r.key === 'price') ? priceCurrency : undefined;

  // A blocked day never wins. Where exactly one side is blocked the other takes it by default —
  // "the park is open on the 14th and shut on the 15th" is a clear answer and does not need a
  // rank. Where both are blocked there is nothing to choose FROM, which is not the same as
  // nothing to choose BETWEEN: `better: 'tie'` with every side blocked is the caller's cue to say
  // "neither of these can be compared" rather than "they are equally good" — see the dialog.
  if (aBlocked || bBlocked) {
    const better: DayComparisonSide = aBlocked && bBlocked ? 'tie' : aBlocked ? 'b' : 'a';
    // Not every blocker is the same kind of answer, and stating them all as CLEAR made the dialog
    // contradict its own table.
    //
    // `closed` and `past` are facts about the day: the park is shut, or the day is gone. There is
    // nothing on the other side of the scale, so the survivor takes it clearly and the reader has
    // no reason to argue. `no-forecast` is a fact about US — the day may well be the better one,
    // we simply cannot rank it. A day whose status is `UNKNOWN` keeps a usable `crowdLevel`, so
    // "der 15. ist der deutlich bessere Tag" appeared directly above a crowd row reading
    // `sehr niedrig` against `extrem`, pointing the other way, with the tick removed by the loop
    // above and the two figures left standing.
    //
    // The verdict itself does not move: an unrated day never wins, which is what the ticket asks
    // for. What moves is the claim about how sure we are, down to what the evidence carries.
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

  // Unreachable while `blockersFor` reports a missing bucket — which it does — and kept as the
  // structural guarantee that a verdict is never computed from a `null`. If the two ever drift
  // apart, this is a tie and not a crash.
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
