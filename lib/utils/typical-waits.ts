import type { DayOfWeekWait, TypicalWaits } from '@/lib/api/types';

/**
 * The ride's quietest weekday (or two), or `null` where the data does not name one.
 *
 * Same three refusals the best-travel-time hub makes one grain coarser, for the same reasons —
 * a park-level version of this is what turned 12/18 filled cells into 17/18 there:
 *
 * * **A thinly measured day drops out rather than ending the vote.** A weekday with far fewer
 *   operating days behind it than its neighbours is noise, not a finding; dropping it leaves the
 *   other five saying something. Refusing the whole ride over it throws that away.
 * * **A tie is two quiet days, not none.** A ride measuring 30 minutes on Tuesday *and* Wednesday
 *   has two quiet days; an em dash there is a worse answer than naming both.
 * * **Three or more days at the minimum is a flat week**, and so is a minimum that is not below
 *   the ride's own median. Both are refusals, and both fire on real rides: of the 183 rides this
 *   panel is drawn for, 71 have one quiet day, 51 have two, and 61 have a flat week.
 *
 * The vote runs on `typical` (P50) and never on `busy` (P90): the question is which day is calmer
 * to stand in, and a single bad Saturday moves the P90 of that weekday without moving the day a
 * visitor would actually pick.
 */

/** A day is dropped when it carries less than half the median day's operating days. */
export const THIN_DAY_SHARE = 0.5;

/** Fewer comparable weekdays than this and the ride gets no verdict at all. */
export const MIN_COMPARABLE_DAYS = 4;

/** Three or more days sharing the minimum is a flat week, not a quiet day. */
export const MAX_TIED_DAYS = 2;

export interface QuietWeekdays {
  /** The one or two days at the minimum, in API `dayOfWeek` numbering (0=Sun…6=Sat). */
  days: number[];
  /** The typical (P50) wait those days share, in minutes. */
  typical: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * @param byDayOfWeek the ride's per-weekday buckets, as the API orders them
 * @param round the caller's display rounding, so the named minutes are the drawn minutes — a
 *   panel saying „meist ca. 27 Min." beside a bar labelled 25 is a caption disagreeing with its
 *   picture, which is the trap {@link AttractionTypicalWaits} already rounds once against.
 */
export function quietestWeekdays(
  byDayOfWeek: TypicalWaits['byDayOfWeek'] | null | undefined,
  round: (value: number) => number = (v) => v
): QuietWeekdays | null {
  const measured = (byDayOfWeek ?? []).filter(
    (d): d is DayOfWeekWait & { typical: number } => d.typical != null
  );
  if (measured.length < MIN_COMPARABLE_DAYS) return null;

  const medianSample = median(measured.map((d) => d.sampleDays));
  const comparable = measured.filter((d) => d.sampleDays >= medianSample * THIN_DAY_SHARE);
  if (comparable.length < MIN_COMPARABLE_DAYS) return null;

  const waits = comparable.map((d) => round(d.typical));
  const lowest = Math.min(...waits);
  // Strictly below the ride's own middle: a "quietest" day level with the median names nothing.
  if (!(lowest < median(waits))) return null;

  const days = comparable.filter((d) => round(d.typical) === lowest);
  if (days.length > MAX_TIED_DAYS) return null;

  return { days: days.map((d) => d.dayOfWeek), typical: lowest };
}
