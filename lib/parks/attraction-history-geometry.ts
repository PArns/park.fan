/**
 * How tall the ride's 30-day history calendar will be, worked out before it exists.
 *
 * The twin of `calendar-grid-geometry`, and it exists for the same reason: the grid cannot draw
 * itself until the client-side detail fetch lands, and whatever stands in its place until then
 * decides how far the rest of the ride page moves when it does. The placeholder it replaces was
 * four hand-measured pixel heights on a `grid-cols-2 md:grid-cols-7` of fixed cells, with a
 * comment saying they were measured and would have to be re-measured — which is what happens to
 * a number that has no formula behind it.
 *
 * The window is fixed (today plus the thirty days behind it), so unlike a month there is no day
 * count to vary. What varies is the number of WEEK ROWS those 31 days span once they are aligned
 * to weekdays, and that depends only on which weekday the window starts on: 31 days plus up to
 * six leading blanks is five rows or six. Two weekdays in seven give six.
 *
 * Pure and away from the component, so `pnpm test:attraction-history-geometry` can pin the row
 * count across all seven weekdays without a DOM.
 */

/** Today plus the thirty days behind it — the window `AttractionHistoryGrid` builds. */
export const HISTORY_WINDOW_DAYS = 30;

const DAY_MS = 86_400_000;

/**
 * Week rows the window ending on `todayIso` spans on a Monday-first seven-column grid.
 *
 * `todayIso` is `yyyy-MM-dd` in the PARK's timezone, resolved by the server: a Florida park is
 * still on yesterday's date for six hours after midnight in Berlin, and getting that wrong here
 * reserves the wrong number of rows for exactly the visitors furthest from the park.
 */
export function historyWeekRows(todayIso: string): number {
  const [y, m, d] = todayIso.split('-').map(Number);
  // `Date.UTC` throughout: a local date in a zone with a DST jump at midnight can land on the
  // previous day, which shifts the first weekday and silently drops a row.
  const start = new Date(Date.UTC(y, m - 1, d) - HISTORY_WINDOW_DAYS * DAY_MS);
  // getUTCDay: 0 = Sunday. Monday-first means Monday → 0 and Sunday → 6.
  const leadingBlanks = (start.getUTCDay() + 6) % 7;
  return Math.ceil((leadingBlanks + HISTORY_WINDOW_DAYS + 1) / 7);
}

/** Rows the below-`lg` two-column day list needs. Constant, since the window is. */
export function historyListRows(): number {
  return Math.ceil((HISTORY_WINDOW_DAYS + 1) / 2);
}

/**
 * Per-breakpoint pixel model, read off the layout rather than fitted to a screenshot.
 *
 * Every tile is a fixed `min-h` and nothing inside it wraps or repeats — the signals are a
 * three-pixel bar, the sparkline box holds its height on a day with no curve, and the min/max
 * line is one row whatever the numbers are. So a row is exactly one tile plus the grid's `gap-2`,
 * and the only offset is the weekday header the desktop layout carries. Keep it that way: a cell
 * that can grow with its content brings back the ±75 px fit the park calendar's model documents.
 */
const MODEL = {
  /** Below `lg` — two-column list: 118 px tile + 8 px gap. */
  list: { perRow: 126, base: 0 },
  /** From `lg` — seven-column week grid: 164 px tile + 8 px gap, over the 28 px weekday header. */
  lg: { perRow: 172, base: 28 },
} as const;

export interface HistoryGridReservation {
  /** Placeholder height below `lg`, in px. */
  base: number;
  /** Placeholder height from `lg` up, in px. */
  lg: number;
}

/**
 * The two heights the placeholder reserves.
 *
 * Numbers rather than a class string because Tailwind cannot see a computed class name — the
 * panel writes them into CSS custom properties and the placeholder's arbitrary-value utilities
 * read those, which keeps one home for the arithmetic and lets the JIT keep working.
 */
export function historyGridReservation(todayIso: string): HistoryGridReservation {
  return {
    base: MODEL.list.base + historyListRows() * MODEL.list.perRow,
    lg: MODEL.lg.base + historyWeekRows(todayIso) * MODEL.lg.perRow,
  };
}
