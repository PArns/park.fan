import type { DayOfWeekWait, TypicalWaits } from '@/lib/api/types';

/**
 * The ride's quietest weekday (or two), or the reason there isn't one.
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
 *   panel is drawn for, 70 have one quiet day, 49 have two, 61 have a flat week and 3 stay silent.
 *
 * The vote runs on `typical` (P50) and never on `busy` (P90): the question is which day is calmer
 * to stand in, and a single bad Saturday moves the P90 of that weekday without moving the day a
 * visitor would actually pick.
 *
 * **The verdict is three-valued, because two of the refusals mean different things.** „No weekday
 * stands out" is a measurement and may be printed; „we cannot tell" is not, and the surface has to
 * stay silent instead of dressing missing data as a flat week.
 */

/** A day is dropped when it carries less than half the median day's operating days. */
export const THIN_DAY_SHARE = 0.5;

/** Fewer comparable weekdays than this and the ride gets no verdict at all. */
export const MIN_COMPARABLE_DAYS = 4;

/** Three or more days sharing the minimum is a flat week, not a quiet day. */
export const MAX_TIED_DAYS = 2;

export type QuietWeekdays =
  /** One or two days at the minimum, in API `dayOfWeek` numbering (0=Sun…6=Sat). */
  | { verdict: 'days'; days: number[]; typical: number }
  /**
   * Measured, and no SINGLE day is quieter than the rest — which is all this says. It also
   * covers three or more days sharing the minimum, so the string it renders may not claim that
   * the week is level: „15 Min. Mon–Mi, 60 Do–So" lands here, with the bar chart beside it
   * showing a fourfold spread.
   */
  | { verdict: 'flat' }
  /** Not enough comparable data, or an answer that the bars beside it would contradict. */
  | { verdict: 'unknown' };

const UNKNOWN: QuietWeekdays = { verdict: 'unknown' };
const FLAT: QuietWeekdays = { verdict: 'flat' };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * @param typicalWaits the ride's block, gated on the server's own `displayable` flag rather than
 *   on a threshold invented here — the same gate `AttractionTypicalWaits` renders under. Without
 *   it a ride whose sample the API declared too small to draw would still get a weekday named
 *   with a minute figure beside it, since the thin-day rule below is only ever *relative*.
 * @param round the caller's display rounding, so the named minutes are the drawn minutes — a
 *   panel saying „meist ca. 27 Min." beside a bar labelled 25 is a caption disagreeing with its
 *   picture, which is the trap `AttractionTypicalWaits` already rounds once against.
 */
export function quietestWeekdays(
  typicalWaits: TypicalWaits | null | undefined,
  round: (value: number) => number = (v) => v
): QuietWeekdays {
  if (!typicalWaits?.displayable) return UNKNOWN;

  const measured = (typicalWaits.byDayOfWeek ?? []).filter(
    (d): d is DayOfWeekWait & { typical: number } => d.typical != null
  );
  if (measured.length < MIN_COMPARABLE_DAYS) return UNKNOWN;

  const medianSample = median(measured.map((d) => d.sampleDays));
  const comparable = measured.filter((d) => d.sampleDays >= medianSample * THIN_DAY_SHARE);
  if (comparable.length < MIN_COMPARABLE_DAYS) return UNKNOWN;

  const waits = comparable.map((d) => round(d.typical));
  const lowest = Math.min(...waits);

  /*
   * A dropped day is dropped from the VOTE, not from the chart: the bars beside this sentence
   * draw every weekday the API measured at all. So where a thin day sits strictly lower, naming
   * the comparable winner points at a bar that is visibly not the shortest one, and no reader can
   * see why. That is a silence, not a flat week — 3 of the 122 rides that would otherwise name
   * a day.
   */
  if (Math.min(...measured.map((d) => round(d.typical))) < lowest) return UNKNOWN;

  // Strictly below the ride's own middle: a "quietest" day level with the median names nothing.
  if (!(lowest < median(waits))) return FLAT;

  const days = comparable.filter((d) => round(d.typical) === lowest);
  if (days.length > MAX_TIED_DAYS) return FLAT;

  /*
   * Mon→Sun, rather than whatever order the payload arrived in. A tie renders as „Am ruhigsten am
   * <a> und <b>", and the rest of this card already refuses to trust `byDayOfWeek`'s order — the
   * chart walks a fixed `DISPLAY_ORDER` through a `Map`. Left as it came, a re-ordered response
   * would read „am Mittwoch und Dienstag" beside bars that run Monday first.
   */
  const monFirst = (dayOfWeek: number) => (dayOfWeek + 6) % 7;

  return {
    verdict: 'days',
    days: days.map((d) => d.dayOfWeek).sort((a, b) => monFirst(a) - monFirst(b)),
    typical: lowest,
  };
}
