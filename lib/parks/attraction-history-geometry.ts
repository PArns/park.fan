/**
 * How tall the ride's 30-day history calendar will be, worked out before it exists: the grid
 * waits for a client-side fetch, and its placeholder decides how far the ride page moves when it
 * lands. The twin of `calendar-grid-geometry`; pure so `pnpm test:attraction-history-geometry` can
 * pin it. See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */

/** Today plus the thirty days behind it: the window `AttractionHistoryGrid` builds. */
export const HISTORY_WINDOW_DAYS = 30;

/** Columns the grid draws at a page width of 1024 px and up. Below that it is two. */
const LG_COLUMNS = 7;

/**
 * Rows the grid needs at a given column count. Constant per breakpoint, because the history is
 * laid out today-first with no leading blanks, so the weekday the window starts on cannot change
 * the reservation.
 */
export function historyRows(columns: number): number {
  return Math.ceil((HISTORY_WINDOW_DAYS + 1) / columns);
}

/** Rows the two-column list below that needs. */
export function historyListRows(): number {
  return historyRows(2);
}

/** Rows the seven-column grid needs above it. */
export function historyGridRows(): number {
  return historyRows(LG_COLUMNS);
}

/**
 * The gap between two rows (`gap-2`). A grid of n rows carries n − 1 of them; counting it into a
 * per-row height reserves a gap that is never drawn.
 */
const ROW_GAP = 8;

/**
 * Per-breakpoint pixel model, measured against the rendered grid. Every tile has a fixed `min-h`
 * and nothing inside wraps, so a row is exactly one tile; a cell that can grow brings back a fit.
 *
 * The tile numbers are measured, not read off the class list: below `lg` a tile with a curve
 * renders one pixel over its 118 px floor, so 119 is reserved (long is the safe side of a
 * reservation). At `lg` tiles measure exactly their 164 px.
 */
const MODEL = {
  /** Narrow page: two columns of `min-h-[118px]` tiles that measure 119 with a curve in them. */
  list: { tile: 119, base: 0 },
  /** Wide page: seven columns of 164 px tiles, no weekday header row. */
  lg: { tile: 164, base: 0 },
} as const;

/** `rows` tiles of `tile` px, separated (not followed) by a gap, over the layout's `base`. */
function stackHeight({ tile, base }: { tile: number; base: number }, rows: number): number {
  return base + rows * tile + Math.max(0, rows - 1) * ROW_GAP;
}

/** The placeholder heights for the history grid, per breakpoint. */
export interface HistoryGridReservation {
  /** Placeholder height below a page width of 1024 px, in px. */
  base: number;
  /** Placeholder height at 1024 px of PAGE and up, in px. */
  lg: number;
}

/**
 * The two heights the placeholder reserves, the same on every day of the year. Numbers rather than
 * a class string, because Tailwind cannot see a computed class name; the panel writes them into
 * CSS custom properties.
 */
export function historyGridReservation(): HistoryGridReservation {
  return {
    base: stackHeight(MODEL.list, historyListRows()),
    lg: stackHeight(MODEL.lg, historyGridRows()),
  };
}
