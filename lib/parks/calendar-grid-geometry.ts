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
 * **The fix is not a bigger constant.** The grid's height moves with the month: below `md` it is
 * a two-column list of every day, so it scales with the DAY COUNT; at `md` and up it is a
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
 * The residual after the row model is content, not structure: a month carrying more holiday and
 * event badges builds taller cells than an empty one, and no formula reaches that without the
 * data. Two six-row months measured 829 px and 973 px at `lg`, so no single number is right for
 * both — the constants are fitted to the **worst** case rather than the average, because an
 * over-reservation pulls the page up when the grid lands and an under-reservation pushes it down,
 * and both are charged. `pnpm measure:cls` read −101 px on November 2026 against the first fit
 * and is how these were tuned; expect roughly ±75 px at `lg`, which is the part that would need
 * the payload to predict — the trade the `ssr: false` import already made.
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

/** Rows the below-`md` two-column day list needs. */
export function listRowsInMonth({ year, month }: ParkCalendarMonth): number {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.ceil(daysInMonth / 2);
}

/**
 * Per-breakpoint pixel model, fitted to the measurements above.
 *
 * Three bands because the grid has three: the two-column list below `md`, the week grid at `md`
 * where the cells are still tall because seven columns in 768 px are narrow, and the week grid
 * from `lg` up where it settles — 1024, 1280 and 1440 all measured the same height, so there is
 * no fourth band to add.
 */
const MODEL = {
  /** < 768 px — two-column list, one row per two days. */
  base: { perRow: 145, base: 0 },
  /** 768–1023 px — seven-column week grid, narrow cells. */
  md: { perRow: 165, base: 60 },
  /** ≥ 1024 px — seven-column week grid, settled. */
  lg: { perRow: 133, base: 100 },
} as const;

export interface CalendarGridReservation {
  /** Placeholder height below `md`, in px. */
  base: number;
  /** Placeholder height from `md` to `lg`, in px. */
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
    md: Math.round(MODEL.md.base + weeks * MODEL.md.perRow),
    lg: Math.round(MODEL.lg.base + weeks * MODEL.lg.perRow),
  };
}
