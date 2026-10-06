/**
 * The month grid the planner picks a day on. Pure, and reckoned at noon UTC throughout, since a
 * plan's dates are park-local strings and midnight UTC is the previous day west of Greenwich.
 * Monday first in all six locales, matching the park calendar (`park-calendar-grid.tsx`), so the
 * columns do not move between the two.
 */

import { getDateTimeFormat, weekdayName } from '@/lib/utils/intl-format';

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
  // Integer month arithmetic, never `setUTCMonth` on the 31st, which lands in March from January.
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

/** Monday = 0 … Sunday = 6, for the first of the month, from a noon-UTC instant. */
function mondayIndexOfFirst(month: PlannerMonth): number {
  const parsed = parse(month);
  if (!parsed) return 0;
  const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 12)).getUTCDay();
  return (weekday + 6) % 7;
}

/**
 * The whole grid: complete weeks, Monday first, padded with the real dates either side, which stay
 * selectable since a trip can cross a month boundary.
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
  return getDateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    Date.UTC(parsed.year, parsed.month - 1, 1, 12)
  );
}

/** The seven column headers, Monday first, in the reader's language. */
export function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) => weekdayName((index + 1) % 7, locale, 'short'));
}
