import { getListFormat, weekdayName, WEEKDAYS_MONDAY_FIRST } from '@/lib/utils/intl-format';

/** Three or more neighbours read as a span („Di.–Fr."), two as a pair. */
const MIN_RUN = 3;

export const MONDAY_TO_FRIDAY: readonly number[] = [1, 2, 3, 4, 5];
export const WEEKEND: readonly number[] = [0, 6];

/** Same members, any order. */
export const sameKeys = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((k) => b.includes(k));

/**
 * The keys grouped into runs of neighbours in `order`, where the last entry neighbours the first:
 * Saturday to Monday is one stretch of the week, December to February one winter.
 */
function cyclicRuns(keys: readonly number[], order: readonly number[]): number[][] {
  const positions = keys.map((k) => order.indexOf(k)).sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const p of positions) {
    const last = runs.at(-1);
    if (last && last.at(-1) === p - 1) last.push(p);
    else runs.push([p]);
  }
  if (runs.length > 1 && runs[0][0] === 0 && runs.at(-1)!.at(-1) === order.length - 1) {
    runs[0] = [...runs.pop()!, ...runs[0]];
  }
  return runs.map((run) => run.map((p) => order[p]));
}

/** „Do, Fr & So": a table cell's list, where the locale's „und" would cost the column its width. */
function joinCompact(parts: readonly string[]): string {
  return parts.length < 2 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} & ${parts.at(-1)}`;
}

/**
 * Keys of a cyclic order (weekdays, months) as one list: runs of three or more as a span, the rest
 * by name, joined the locale's way, or with `&` where `compact`.
 */
export function formatRuns(
  keys: readonly number[],
  order: readonly number[],
  locale: string,
  name: (key: number, inRange: boolean) => string,
  compact = false
): string {
  const parts = cyclicRuns(keys, order).flatMap((run) =>
    run.length >= MIN_RUN
      ? [`${name(run[0], true)}–${name(run.at(-1)!, true)}`]
      : run.map((k) => name(k, false))
  );
  return compact
    ? joinCompact(parts)
    : getListFormat(locale, { type: 'conjunction' }).format(parts);
}

/** The two day lists `Intl` has no word for, from the caller's translations. */
export interface WeekdayListLabels {
  /** Monday to Friday, „Mo–Fr". Not „Werktags": in German that includes Saturday. */
  weekdays: string;
  /** Saturday and Sunday, „Wochenende". */
  weekend: string;
}

/**
 * Weekdays (0 = Sunday) the way the park header names its quiet and busy ends: five days tied at
 * one end is the week against its weekend and reads as that, three or more neighbours as a span,
 * the rest by name. `compact` joins with `&`, for table cells. `null` for no days.
 */
export function formatWeekdayList(
  keys: readonly number[],
  locale: string,
  labels: WeekdayListLabels,
  compact = false
): string | null {
  if (!keys.length) return null;
  if (sameKeys(keys, MONDAY_TO_FRIDAY)) return labels.weekdays;
  if (sameKeys(keys, WEEKEND)) return labels.weekend;
  return formatRuns(
    keys,
    WEEKDAYS_MONDAY_FIRST,
    locale,
    (d, inRange) => weekdayName(d, locale, inRange || keys.length > 2 ? 'short' : 'long'),
    compact
  );
}
