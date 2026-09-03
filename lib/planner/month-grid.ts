/**
 * The month grid the planner picks a day on.
 *
 * Pure, and reckoned in UTC at NOON throughout — the same rule the rest of the
 * planner's date maths follows. A plan's dates are park-local strings, so there
 * is no instant here to convert and nothing for a well-meaning local-time `Date`
 * to convert wrongly: `new Date('2026-09-01')` is midnight UTC, which is August
 * for every reader west of Greenwich, and a grid built on that draws the wrong
 * month for a third of the planet.
 *
 * Monday first in all six locales, which is what the park calendar already does
 * (`park-calendar-grid.tsx` passes `weekStartsOn: 1`). Not because Monday is
 * universal — it is not, `en-US` starts on Sunday — but because a visitor
 * comparing the planner's grid with the park's calendar grid must not have to
 * notice that the columns moved.
 */

/** A month, as `YYYY-MM`. */
export type PlannerMonth = string;

/** One cell of the grid. `inMonth` is false for the days either side. */
export interface MonthCell {
  /** `YYYY-MM-DD`. Always a real date, including in the padding. */
  date: string;
  /** The day of the month, 1–31. */
  day: number;
  /** False for the leading and trailing days that belong to a neighbour. */
  inMonth: boolean;
}

function parse(month: PlannerMonth): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return { year, month: monthNumber };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The month one date belongs to. */
export function monthOf(date: string): PlannerMonth {
  return date.slice(0, 7);
}

/** The first of a month, as a date. What a month's own header points at. */
export function firstOfMonth(month: PlannerMonth): string {
  return `${month}-01`;
}

/** `delta` months on, calendar-safe across a year boundary. */
export function shiftMonth(month: PlannerMonth, delta: number): PlannerMonth {
  const parsed = parse(month);
  if (!parsed) return month;
  // Month arithmetic in a plain integer, never through `setUTCMonth` on the
  // 31st: adding a month to January 31 there lands in March.
  const total = parsed.year * 12 + (parsed.month - 1) + delta;
  const year = Math.floor(total / 12);
  const monthNumber = (total % 12) + 1;
  return `${year}-${pad(monthNumber)}`;
}

/** How many days the month has, leap years included. */
export function daysInMonth(month: PlannerMonth): number {
  const parsed = parse(month);
  if (!parsed) return 0;
  // Day 0 of the NEXT month is the last day of this one.
  return new Date(Date.UTC(parsed.year, parsed.month, 0, 12)).getUTCDate();
}

/**
 * Monday = 0 … Sunday = 6, for the first of the month.
 *
 * `getUTCDay` on a noon-UTC instant, so the answer cannot depend on where the
 * reader is.
 */
function mondayIndexOfFirst(month: PlannerMonth): number {
  const parsed = parse(month);
  if (!parsed) return 0;
  const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 12)).getUTCDay();
  return (weekday + 6) % 7;
}

/**
 * The whole grid: complete weeks, Monday first, padded with the real dates
 * either side rather than with holes.
 *
 * Real dates in the padding because they are still selectable — a trip that
 * starts on the 31st and ends on the 2nd is one trip, and a visitor who can see
 * the 1st in the corner of the grid will click it.
 */
export function monthMatrix(month: PlannerMonth): MonthCell[] {
  const parsed = parse(month);
  if (!parsed) return [];

  const lead = mondayIndexOfFirst(month);
  const length = daysInMonth(month);
  // Whole weeks, so every row has seven cells and the grid never reflows.
  const total = Math.ceil((lead + length) / 7) * 7;

  const cells: MonthCell[] = [];
  for (let index = 0; index < total; index++) {
    const dayOffset = index - lead;
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, 1 + dayOffset, 12));
    cells.push({
      date: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: dayOffset >= 0 && dayOffset < length,
    });
  }
  return cells;
}

/** `September 2026`, in the reader's language. */
export function monthLabel(month: PlannerMonth, locale: string): string {
  const parsed = parse(month);
  if (!parsed) return month;
  return new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 12)).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The seven column headers, Monday first, in the reader's language.
 *
 * Anchored on a date that IS a Monday (2024-01-01) rather than on today, so the
 * order cannot depend on when the page is rendered.
 */
export function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    new Date(Date.UTC(2024, 0, 1 + index, 12)).toLocaleDateString(locale, { weekday: 'short' })
  );
}
