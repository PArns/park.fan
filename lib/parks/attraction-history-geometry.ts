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
 * The gap between two rows — `gap-2` on the two-column list, `space-y-2` between week rows.
 *
 * It sits BETWEEN rows, so a grid of n rows carries n − 1 of them. Counting it into a per-row
 * height instead (the first version of this model did: 118 + 8, 164 + 8) reserves one gap that is
 * never drawn, which is where the desktop placeholder's 8 px of over-reservation came from.
 */
const ROW_GAP = 8;

/**
 * Per-breakpoint pixel model, measured against the rendered grid at both breakpoints.
 *
 * Every tile is a fixed `min-h` and nothing inside it wraps or repeats — the signals are a
 * three-pixel bar, the sparkline box holds its height on a day with no curve, and the min/max
 * line is one row whatever the numbers are. So a row is exactly one tile, the rows are separated
 * by {@link ROW_GAP}, and the only offset is the weekday header the desktop layout carries. Keep
 * it that way: a cell that can grow with its content brings back the ±75 px fit the park
 * calendar's model documents.
 *
 * The two tile numbers are NOT the two `min-h` values, and that difference is the point of
 * measuring rather than reading them off the class list. At `lg` the cell's content is smaller
 * than its floor, so every one of the 31 tiles measures exactly the 164 px it declares. Below
 * `lg` the content is 119 px — one pixel OVER the 118 px floor — so the floor never governs a day
 * that has a curve: measured on Taron and Talocan (Phantasialand) at 390 px in de and fr, 30 of
 * 31 tiles came out at 119.000 px and the one that did not was the lone day with no curve, alone
 * in the last row. Reserving the floor made the placeholder 7 px short of the grid it stands in
 * for; reserving 119 is 1 px long on that same grid, and long is the safe side of a reservation.
 */
const MODEL = {
  /** Below `lg` — two-column list of `min-h-[118px]` tiles that measure 119 with a curve in them. */
  list: { tile: 119, base: 0 },
  /** From `lg` — seven-column week grid of 164 px tiles under a 20 px header with `mb-2`. */
  lg: { tile: 164, base: 28 },
} as const;

/** `rows` tiles of `tile` px, separated (not followed) by a gap, over whatever `base` the layout carries. */
function stackHeight({ tile, base }: { tile: number; base: number }, rows: number): number {
  return base + rows * tile + Math.max(0, rows - 1) * ROW_GAP;
}

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
    base: stackHeight(MODEL.list, historyListRows()),
    lg: stackHeight(MODEL.lg, historyWeekRows(todayIso)),
  };
}
