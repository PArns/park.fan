import type { ParkCalendarMonth } from '@/lib/parks/calendar-segments';

/**
 * How tall the month grid will be, worked out before it exists. `ParkCalendarGrid` is a client-only
 * import, so its loading placeholder must reserve the real height or everything below jumps.
 *
 * The height moves with the month: below `lg` it is a two-column day list (scales with the day
 * count), from `lg` up a seven-column week grid (scales with week rows). Both are arithmetic on
 * the month in the URL, so the server can compute them. The cells are fixed-height and nothing in
 * them wraps, which is what makes the model exact; if a cell can grow with its content again, the
 * reservation turns back into a fit. Pure, so `pnpm test:calendar-month` pins the row counts.
 * See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */

/** Week rows a month spans on a Monday-first seven-column grid. */
export function weekRowsInMonth({ year, month }: ParkCalendarMonth): number {
  // `Date.UTC` throughout: a local `new Date(y, m, 1)` in a zone with a DST jump at midnight can
  // land on the previous day and shift the first weekday.
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Monday-first: Monday → 0, Sunday → 6.
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  return Math.ceil((leadingBlanks + daysInMonth) / 7);
}

/** Rows the below-`lg` two-column day list needs. */
export function listRowsInMonth({ year, month }: ParkCalendarMonth): number {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.ceil(daysInMonth / 2);
}

/**
 * Per-breakpoint pixel model, read off the layout. The two-column list runs everywhere below `lg`
 * (so `base` and `md` match and count list rows); the week grid takes over from `lg`, counting week
 * rows. Wider screens measure the same, so there is no fourth band.
 */
const MODEL = {
  /** < 768 px — two-column list: 92 px tile + 8 px gap, over the grid's 12 px `pt-3`. */
  base: { perRow: 100, base: 4 },
  /**
   * 768–1023 px: still the two-column list, because seven columns in a 768 px card are too narrow
   * for the cell header. Kept as a band because the placeholder reads three custom properties.
   */
  md: { perRow: 100, base: 4 },
  /** ≥ 1024 px: seven-column week grid, 150 px tile + 8 px gap, over the 28 px weekday header
   *  and the 12 px `pt-3`. */
  lg: { perRow: 158, base: 32 },
} as const;

/** The placeholder heights for one month, per breakpoint band. */
export interface CalendarGridReservation {
  /** Placeholder height below `md`, in px. */
  base: number;
  /** Placeholder height from `md` to `lg`, in px. */
  md: number;
  /** Placeholder height from `lg` up, in px. */
  lg: number;
}

/**
 * The three heights the placeholder should reserve for one month. Numbers rather than a class
 * string, because Tailwind cannot see a computed class name; the component writes them into CSS
 * custom properties that arbitrary-value utilities read.
 */
export function calendarGridReservation(month: ParkCalendarMonth): CalendarGridReservation {
  const weeks = weekRowsInMonth(month);
  const listRows = listRowsInMonth(month);
  return {
    base: Math.round(MODEL.base.base + listRows * MODEL.base.perRow),
    // `listRows`, not `weeks`: 768–1023 px shows the two-column list.
    md: Math.round(MODEL.md.base + listRows * MODEL.md.perRow),
    lg: Math.round(MODEL.lg.base + weeks * MODEL.lg.perRow),
  };
}
