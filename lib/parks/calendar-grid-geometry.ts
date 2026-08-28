import type { ParkCalendarMonth } from '@/lib/parks/calendar-segments';

/**
 * How tall the month grid will be, worked out before it exists.
 *
 * `ParkCalendarGrid` is a `ssr: false` dynamic import, so its `loading` placeholder is the only
 * thing standing where it will land. That placeholder was `h-[36rem]` — one number, 576 px, for
 * two structurally different layouts across every month of the year. Measured against production
 * on Phantasialand, November 2026:
 *
 * ```
 *   390 px   placeholder 576 → real grid 1992   under-reserved by 1416 px
 *   768 px   placeholder 576 → real grid  937   under-reserved by  361 px
 *  1280 px   placeholder 576 → real grid  829   under-reserved by  253 px
 * ```
 *
 * A phone got 29 % of the box it needed, and everything below the calendar — the best-days
 * section, the statistics, the FAQ, the footer — was shoved down 1416 px when the chunk landed.
 * That is the single largest reservation gap on the site, on the device the field data is
 * weighted by.
 *
 * **The fix is not a bigger constant.** The grid's height moves with the month: below `lg` it is
 * a two-column list of every day, so it scales with the DAY COUNT; at `lg` and up it is a
 * seven-column week grid, so it scales with the number of WEEK ROWS the month spans. Both are
 * arithmetic on the month in the URL, which the server already has — no clock and no viewport
 * needed, which is exactly why they can be computed here while the grid itself cannot render.
 * Measured across five months (Feb/May/Aug/Nov 2026, Feb 2027 — 28, 31, 31, 30 and 28 days,
 * spanning four to six week rows):
 *
 * ```
 *   390 px   1961 … 2494   spread 533
 *   768 px    600 … 1168   spread 568
 *  1280 px    600 …  973   spread 373
 * ```
 *
 * The residual used to be content: a month carrying more holiday and event badges built taller
 * cells than an empty one, two six-row months measured 829 px and 973 px at `lg`, and the
 * constants were fitted to the worst case with roughly ±75 px left over.
 *
 * **The redesigned cell removed that residual.** Every day tile is now a fixed `min-h-[92px]`
 * below `lg` and `min-h-[150px]` from `lg` up, and nothing inside it wraps or repeats: the
 * signals became a three-pixel bar rather than a stack of badges, the „Empfohlen" pill moved
 * inline next to the crowd word, and the ticket price moved into the day dialog. So a row is
 * exactly one tile tall whatever the day holds, and the numbers below are arithmetic on the
 * layout rather than a fit — `perRow` is the tile plus its `gap-2`, `base` is the weekday header
 * row plus the grid's `pt-3`. Keep them that way: if a future cell can grow with its content, the
 * fit and its ±75 px come back with it.
 *
 * Kept pure and away from the component for the same reason `weather-chart-axis` is:
 * `pnpm test:calendar-month` can pin the row counts over a DST boundary and a leap
 * February without a DOM.
 */

/** Week rows a month spans on a Monday-first seven-column grid. */
export function weekRowsInMonth({ year, month }: ParkCalendarMonth): number {
  // `Date.UTC` throughout: a local `new Date(y, m, 1)` in a zone with a DST jump at midnight can
  // land on the previous day, which silently shifts the first weekday and drops a row.
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // getUTCDay: 0 = Sunday. Monday-first means Monday → 0 and Sunday → 6.
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  return Math.ceil((leadingBlanks + daysInMonth) / 7);
}

/** Rows the below-`lg` two-column day list needs. */
export function listRowsInMonth({ year, month }: ParkCalendarMonth): number {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.ceil(daysInMonth / 2);
}

/**
 * Per-breakpoint pixel model, read off the layout.
 *
 * Two layouts, three bands: the two-column day list runs everywhere below `lg` (so `base` and
 * `md` carry the same numbers and both count LIST rows), and the seven-column week grid takes
 * over from `lg` up, counting WEEK rows. 1024, 1280 and 1440 all measure the same height, so
 * there is no fourth band to add.
 *
 * The offsets each dropped by the legend row when it moved up into the panel's control row: it
 * measured 60 px on a 390 px phone (two wrapped lines) and 26 px from `md` up, plus a 16 px gap in
 * both cases, and the figures above were fitted against a grid that still contained it.
 */
const MODEL = {
  /** < 768 px — two-column list: 92 px tile + 8 px gap, over the grid's 12 px `pt-3`. */
  base: { perRow: 100, base: 4 },
  /**
   * 768–1023 px — still the two-column list, so the same numbers.
   *
   * The week grid used to start at `md`, and it was too early: seven columns inside a 768 px
   * card leave 98 px per cell, and the redesigned header row („28", the „Heute" pill and the
   * wait) needs about 115. The band stays in the model because the placeholder reads three
   * custom properties; it no longer describes a different layout.
   */
  md: { perRow: 100, base: 4 },
  /** ≥ 1024 px — seven-column week grid: 150 px tile + 8 px gap, over the 28 px weekday header
   *  row and the 12 px `pt-3`. */
  lg: { perRow: 158, base: 32 },
} as const;

export interface CalendarGridReservation {
  /** Placeholder height below `md`, in px — two-column list. */
  base: number;
  /** Placeholder height from `md` to `lg`, in px — still the two-column list. */
  md: number;
  /** Placeholder height from `lg` up, in px. */
  lg: number;
}

/**
 * The three heights the placeholder should reserve for one month.
 *
 * Returned as numbers rather than a class string because Tailwind cannot see a computed class
 * name — the component writes them into CSS custom properties and the arbitrary-value utilities
 * read those, which keeps one source for the arithmetic and lets the JIT keep working.
 */
export function calendarGridReservation(month: ParkCalendarMonth): CalendarGridReservation {
  const weeks = weekRowsInMonth(month);
  const listRows = listRowsInMonth(month);
  return {
    base: Math.round(MODEL.base.base + listRows * MODEL.base.perRow),
    // `listRows`, not `weeks`: 768–1023 px shows the two-column list now, and reserving a week
    // grid's height for it under-reserved a 31-day month by roughly 700 px.
    md: Math.round(MODEL.md.base + listRows * MODEL.md.perRow),
    lg: Math.round(MODEL.lg.base + weeks * MODEL.lg.perRow),
  };
}
