import type { SeriesInterval } from '@/lib/api/admin-site-analytics';

/**
 * The window and the series step of the traffic dashboards: the presets, a custom range, which
 * intervals suit a window, and how the three live in the address. All dates are UTC days as
 * `YYYY-MM-DD`, which is what the API counts in, and "today" is handed in, so the arithmetic
 * is testable and the pages agree on one clock.
 */

/** The longest window the API answers: a year and a day, so a leap year fits. */
export const MAX_RANGE_DAYS = 366;

/** A window of the last `days` UTC days with today included, or an explicit first and last day. */
export type TrafficRange =
  { kind: 'days'; days: number } | { kind: 'dates'; from: string; to: string };

/** The window as the API echoes it: its first and last day and how many days that is. */
export interface RangeWindow {
  from: string;
  to: string;
  days: number;
}

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The UTC day of a moment, `YYYY-MM-DD`. */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** Whether a string is a real calendar day, so `2026-02-30` is not one. */
export function isUtcDay(value: string): boolean {
  return DATE_PATTERN.test(value) && utcDay(new Date(parseDay(value))) === value;
}

/** A day moved by whole days, in either direction. */
export function addDays(day: string, days: number): string {
  return utcDay(new Date(parseDay(day) + days * DAY_MS));
}

/** How many days the window `from` to `to` holds, both ends included. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS) + 1;
}

/** The Monday of the ISO week a day is in. */
export function weekStart(day: string): string {
  const weekday = (new Date(parseDay(day)).getUTCDay() + 6) % 7;
  return addDays(day, -weekday);
}

function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** The last day of the month before the one a day is in. */
function previousMonthEnd(day: string): string {
  return addDays(monthStart(day), -1);
}

/** The window a range stands for, given today. */
export function rangeWindow(range: TrafficRange, today: string): RangeWindow {
  if (range.kind === 'dates') {
    return { from: range.from, to: range.to, days: daysBetween(range.from, range.to) };
  }
  return { from: addDays(today, 1 - range.days), to: today, days: range.days };
}

/** A preset of the range picker. */
export interface RangePreset {
  id: string;
  label: string;
  /** The range the preset stands for today. */
  resolve: (today: string) => TrafficRange;
}

const rolling = (id: string, label: string, days: number): RangePreset => ({
  id,
  label,
  resolve: () => ({ kind: 'days', days }),
});

const between = (
  id: string,
  label: string,
  window: (today: string) => { from: string; to: string }
): RangePreset => ({
  id,
  label,
  resolve: (today) => ({ kind: 'dates', ...window(today) }),
});

/**
 * The presets, in the order the picker lists them. The rolling ones end today and are `days` in
 * the address; the calendar ones (a week, a month, yesterday) are dates, so a link keeps meaning
 * the week it was copied in.
 */
export const RANGE_PRESETS: readonly RangePreset[] = [
  rolling('today', 'Heute', 1),
  between('yesterday', 'Gestern', (today) => ({
    from: addDays(today, -1),
    to: addDays(today, -1),
  })),
  rolling('7d', '7 Tage', 7),
  rolling('30d', '30 Tage', 30),
  rolling('90d', '90 Tage', 90),
  between('this_week', 'Diese Woche', (today) => ({ from: weekStart(today), to: today })),
  between('last_week', 'Letzte Woche', (today) => {
    const monday = addDays(weekStart(today), -7);
    return { from: monday, to: addDays(monday, 6) };
  }),
  between('this_month', 'Dieser Monat', (today) => ({ from: monthStart(today), to: today })),
  between('last_month', 'Letzter Monat', (today) => {
    const to = previousMonthEnd(today);
    return { from: monthStart(to), to };
  }),
  rolling('12m', '12 Monate', 365),
];

/** The window shown when the address names none. */
export const DEFAULT_RANGE: TrafficRange = { kind: 'days', days: 30 };

/** The `days` values an address may carry: the rolling presets. */
const ROLLING_DAYS = new Set([1, 7, 30, 90, 365]);

/**
 * The range an address names. `from` and `to` win when both are valid days, in order, not in the
 * future and at most a year long; otherwise `days` when it is one of the rolling presets; otherwise
 * 30 days.
 */
export function parseTrafficRange(
  params: { days?: string | null; from?: string | null; to?: string | null },
  today: string
): TrafficRange {
  const { from, to } = params;
  if (from && to && customRangeError(from, to, today) === null) return { kind: 'dates', from, to };
  const days = Number(params.days);
  return ROLLING_DAYS.has(days) ? { kind: 'days', days } : DEFAULT_RANGE;
}

/**
 * Why a custom range cannot be asked for, in German for the picker; `null` when it can. The API
 * refuses the same: an order that runs backwards, a future day, more than 366 days.
 */
export function customRangeError(from: string, to: string, today: string): string | null {
  if (!isUtcDay(from) || !isUtcDay(to)) return 'Bitte beide Tage angeben.';
  if (from > to) return 'Der erste Tag liegt nach dem letzten.';
  if (to > today) return 'Der letzte Tag liegt in der Zukunft.';
  if (daysBetween(from, to) > MAX_RANGE_DAYS) return 'Höchstens 366 Tage.';
  return null;
}

/** The preset whose window is the range's, if any: a custom range that equals one lights it up. */
export function presetOf(range: TrafficRange, today: string): RangePreset | null {
  const window = rangeWindow(range, today);
  return (
    RANGE_PRESETS.find((preset) => {
      const candidate = rangeWindow(preset.resolve(today), today);
      return candidate.from === window.from && candidate.to === window.to;
    }) ?? null
  );
}

/** A `YYYY-MM-DD` day as `28.10.2026`. */
export function germanDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}.${month}.${year}`;
}

/** The window written out: `28.10.2026` for one day, `29.09.2026 bis 28.10.2026` for more. */
export function formatRangeSpan(window: Pick<RangeWindow, 'from' | 'to'>): string {
  return window.from === window.to
    ? germanDay(window.from)
    : `${germanDay(window.from)} bis ${germanDay(window.to)}`;
}

/** What to call the range: the preset's name, or its dates. */
export function rangeLabel(range: TrafficRange, today: string): string {
  return presetOf(range, today)?.label ?? formatRangeSpan(rangeWindow(range, today));
}

/** The query parameters that name a range: `days`, or `from` and `to`, never both. */
export function rangeParams(range: TrafficRange): Record<string, string> {
  return range.kind === 'days' ? { days: String(range.days) } : { from: range.from, to: range.to };
}

// ---------------------------------------------------------------------------------------------
// Interval

/** The steps of a series, finest first, and what the toggle calls them. */
export const INTERVAL_LABEL: Record<SeriesInterval, string> = {
  hour: 'Stunde',
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
};

/** What one point of a series stands for, in a sentence. */
export const INTERVAL_SENTENCE: Record<SeriesInterval, string> = {
  hour: 'Ein Punkt je Stunde, UTC.',
  day: 'Ein Punkt je Tag, UTC.',
  week: 'Ein Punkt je Woche, von Montag bis Sonntag, UTC.',
  month: 'Ein Punkt je Monat, UTC.',
};

/**
 * The step the API uses when none is asked for: hours for a single day, days up to 92, weeks up to
 * 183, months beyond. The toggle shows this one as chosen until somebody picks another.
 */
export function defaultInterval(days: number): SeriesInterval {
  if (days <= 1) return 'hour';
  if (days <= 92) return 'day';
  return days <= 183 ? 'week' : 'month';
}

/**
 * The steps that make a chart of a window of `days`: hours only for two days at most (the API
 * refuses more), days always, weeks from two of them and months from two, so a chart is never a
 * single point.
 */
export function intervalsFor(days: number): SeriesInterval[] {
  const list: SeriesInterval[] = [];
  if (days <= 2) list.push('hour');
  list.push('day');
  if (days >= 14) list.push('week');
  if (days >= 60) list.push('month');
  return list;
}

/** Whether an address value names an interval. */
export function isInterval(value: string | null | undefined): value is SeriesInterval {
  return value === 'hour' || value === 'day' || value === 'week' || value === 'month';
}

/**
 * The interval of a window: the one the address asks for when it suits the window, otherwise the
 * default. `asked` is `null` when the address names none.
 */
export function effectiveInterval(asked: string | null | undefined, days: number): SeriesInterval {
  return isInterval(asked) && intervalsFor(days).includes(asked) ? asked : defaultInterval(days);
}

// ---------------------------------------------------------------------------------------------
// Periods

/** The ISO week number and its year of a day: the week with the year's first Thursday is week 1. */
export function isoWeek(day: string): { year: number; week: number } {
  const date = new Date(parseDay(day));
  const thursday = new Date(date.getTime() + (3 - ((date.getUTCDay() + 6) % 7)) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / DAY_MS -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return { year, week };
}

const monthShort = new Intl.DateTimeFormat('de-DE', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const monthLong = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayLong = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A period start for an axis: an hour `14:00`, a day or a week's Monday `28.10.`, a month `Okt. 26`. */
export function formatPeriodAxis(day: string, interval: SeriesInterval): string {
  if (interval === 'hour' || day.includes('T')) return `${day.slice(11, 13)}:00`;
  if (interval === 'month') return monthShort.format(new Date(parseDay(day)));
  const [, month, date] = day.split('-');
  return `${date}.${month}.`;
}

/**
 * A period for a tooltip or a table row: `28.10. 14:00 UTC`, `Mi 28.10.2026`, `KW 44, ab 26.10.2026`,
 * `Oktober 2026`.
 */
export function formatPeriodLong(day: string, interval: SeriesInterval): string {
  if (interval === 'hour' || day.includes('T')) {
    const [date] = day.split('T');
    const [, month, dd] = date.split('-');
    return `${dd}.${month}. ${day.slice(11, 13)}:00 UTC`;
  }
  const parsed = new Date(parseDay(day));
  if (Number.isNaN(parsed.getTime())) return day;
  if (interval === 'month') return monthLong.format(parsed);
  if (interval === 'week') return `KW ${isoWeek(day).week}, ab ${germanDay(day)}`;
  return dayLong.format(parsed);
}
