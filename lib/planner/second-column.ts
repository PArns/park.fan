'use client';

import { PAGE_MIN_PX, PANEL_WIDTH_MIN } from './panel-width';

/**
 * The second day column, when the panel is wide enough to hold one. The first column is always the
 * plan's active day, so this holds only the other; one nullable field cannot disagree with it.
 *
 * Two columns at most: at `PANEL_WIDTH_MAX` each gets about the canvas a default panel has, and a
 * third would need a shared gutter, which would cost a park its weather and showtimes. Stored
 * outside `PlannerState`, which `trip-sync.ts` sends to the server whole, because an open column is
 * a property of this browser; stored at all because the panel unmounts on close.
 */

const KEY = 'parkfan_planner_column2';

/**
 * The panel a second column needs: two columns of `PANEL_WIDTH_MIN` plus the divider. Below it an
 * open second column is not drawn but remembered, so widening the panel brings it back.
 */
export const TWO_COLUMN_MIN_WIDTH = PANEL_WIDTH_MIN * 2 + 1;

/**
 * The window a two-column panel needs, which is what the switch is offered on (the switch widens
 * the panel). Derived from both floors, because `fitToViewport` caps the panel at
 * `innerWidth - PAGE_MIN_PX`, so below this a promise of two columns would be undone at once.
 */
export const TWO_COLUMN_MIN_VIEWPORT = TWO_COLUMN_MIN_WIDTH + PAGE_MIN_PX;

/** The same threshold as a media query, a module-level string for `useMediaQuery`. */
export const TWO_COLUMN_VIEWPORT_QUERY = `(min-width: ${TWO_COLUMN_MIN_VIEWPORT}px)`;

/** One (park, date) pair shown as a column. */
export interface PlannerColumn {
  parkSlug: string;
  date: string;
}

let column: PlannerColumn | null | undefined;
const listeners = new Set<() => void>();

function load(): PlannerColumn | null {
  if (column !== undefined) return column;
  column = null;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const value = parsed as Record<string, unknown>;
      // Read defensively: storage is input from other builds and anything else on the origin.
      if (typeof value?.parkSlug === 'string' && typeof value?.date === 'string') {
        column = { parkSlug: value.parkSlug, date: value.date };
      }
    }
  } catch {
    // Private mode, disabled storage, or not JSON: one column.
    column = null;
  }
  return column;
}

function write(next: PlannerColumn | null): void {
  column = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // The arrangement holds for this session and is not remembered.
  }
  for (const listener of listeners) listener();
}

/** The second column as an external store. */
export const plannerSecondColumn = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): PlannerColumn | null {
    return load();
  },
  /** `null` on the server: the first HTML is always one column. */
  getServerSnapshot(): PlannerColumn | null {
    return null;
  },
  open(next: PlannerColumn): void {
    write({ parkSlug: next.parkSlug, date: next.date });
  },
  close(): void {
    write(null);
  },
  /** Move the second column to another day of its own park, or to another park. */
  setDate(date: string): void {
    const current = load();
    if (current) write({ ...current, date });
  },
};

/**
 * How many columns the panel can hold at this width: the live width, since the stored one can be
 * larger than what the window allows.
 */
export function maxColumnsFor(widthPx: number): 1 | 2 {
  return widthPx >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
}
