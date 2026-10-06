import type { DayOfWeekWait, TypicalWaits } from '@/lib/api/types';

/**
 * The ride's quietest weekday (or two), or the reason there isn't one: the hub's quietest-weekday
 * rules one grain finer. A thinly measured day drops out of the vote instead of ending it, a
 * two-way tie names both days, and three or more at the minimum (or a minimum not below the
 * median) is a flat week. The vote runs on `typical` (P50), never `busy` (P90), since one bad
 * Saturday moves the P90 without changing which day a visitor would pick.
 *
 * Three-valued because „no weekday stands out" is a measurement that may be printed, while „we
 * cannot tell" must stay silent.
 * See docs/rules/the-quietest-weekday-may-be-two-days-and-a-thin-day-drops-out.md.
 */

/** A day is dropped when it carries less than half the median day's operating days. */
export const THIN_DAY_SHARE = 0.5;

/** Fewer comparable weekdays than this and the ride gets no verdict at all. */
export const MIN_COMPARABLE_DAYS = 4;

/** Three or more days sharing the minimum is a flat week, not a quiet day. */
export const MAX_TIED_DAYS = 2;

/** The weekday verdict for a ride. */
export type QuietWeekdays =
  /** One or two days at the minimum, in API `dayOfWeek` numbering (0=Sun…6=Sat). */
  | { verdict: 'days'; days: number[]; typical: number }
  /**
   * Measured, and no single day is quieter than the rest; also covers three or more tied days, so
   * the string it renders may not claim the week is level.
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
 * The ride's quietest weekday verdict.
 *
 * @param typicalWaits the ride's block, gated on the server's `displayable` flag (the gate
 *   `AttractionTypicalWaits` renders under), since the thin-day rule here is only relative.
 * @param round the caller's display rounding, so the named minutes match the drawn bars.
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
   * A thin day drops out of the vote but not out of the chart. Where it sits strictly lower, the
   * winner would point at a bar that is visibly not the shortest, so this stays silent.
   */
  if (Math.min(...measured.map((d) => round(d.typical))) < lowest) return UNKNOWN;

  // Strictly below the ride's own median: a „quietest" day level with it names nothing.
  if (!(lowest < median(waits))) return FLAT;

  const days = comparable.filter((d) => round(d.typical) === lowest);
  if (days.length > MAX_TIED_DAYS) return FLAT;

  /*
   * Mon→Sun regardless of payload order, matching the chart's fixed `DISPLAY_ORDER`, so a tie never
   * reads „Mittwoch und Dienstag" beside bars that run Monday first.
   */
  const monFirst = (dayOfWeek: number) => (dayOfWeek + 6) % 7;

  return {
    verdict: 'days',
    days: days.map((d) => d.dayOfWeek).sort((a, b) => monFirst(a) - monFirst(b)),
    typical: lowest,
  };
}
