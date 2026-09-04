'use client';

import { PANEL_WIDTH_MIN } from './panel-width';

/**
 * The SECOND day column, when the panel is wide enough to hold one.
 *
 * A column is one (park, date) pair. The first is always the plan's active one
 * — `activeParkSlug` / `activeDate` in the store — so this holds the other, and
 * "two columns" is exactly "the active day plus this". A list would have to be
 * reconciled against the active pair on every write; a single nullable field
 * cannot disagree with it.
 *
 * **Two, and the number is measured rather than chosen.** Measured off the
 * rendered panel, canvas being the block area right of the hour gutter: a
 * default 448 px panel gives one column 395 px of it, and at the existing
 * `PANEL_WIDTH_MAX` of 900 each of TWO columns gets 397 — so at the top of the
 * range two columns are two whole planners rather than two compromises. A third
 * would need the hour gutter to be shared, and the gutter carries the weather
 * rail, the showtime chips and the now pill, all three of which are per (park,
 * date): a shared one costs the second park its weather and its showtimes.
 *
 * **It is NOT part of `PlannerState`.** `trip-sync.ts` casts the whole plan onto
 * the wire (`payloadOf`), so a field added there ships to `PUT /api/trips`
 * unasked — and whether somebody has a second column open is a property of this
 * browser rather than of their day at Phantasialand. Same reasoning, and the
 * same shape, as `panel-width.ts` and `shows-visible.ts`.
 *
 * Which is also why it is stored at all rather than held in component state: the
 * panel unmounts whenever it closes, and an arrangement that vanished every time
 * somebody looked at the page behind it would not be an arrangement.
 */

const KEY = 'parkfan_planner_column2';

/**
 * The panel a second column needs before it is worth drawing.
 *
 * Two columns of `PANEL_WIDTH_MIN` plus the divider — the same floor a single
 * column has, applied twice, so a second column is never narrower than a first
 * is allowed to be. Below it the switch is not offered and an already-open
 * second column is not drawn; it is remembered, so widening the panel brings it
 * back rather than making somebody arrange it again.
 */
export const TWO_COLUMN_MIN_WIDTH = PANEL_WIDTH_MIN * 2 + 1;

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
      // Read defensively: this is storage, so it is an input from another build
      // of this app and from anything else that can write to the origin.
      if (typeof value?.parkSlug === 'string' && typeof value?.date === 'string') {
        column = { parkSlug: value.parkSlug, date: value.date };
      }
    }
  } catch {
    // Private mode, disabled storage, or a value that is not JSON. One column.
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
    // The arrangement holds for this session and is not remembered. Nothing
    // else about the panel depends on it.
  }
  for (const listener of listeners) listener();
}

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
 * How many columns the panel can hold at this width.
 *
 * Read from the LIVE width rather than the stored one, because the panel is
 * capped against the window (`fitToViewport`) and the stored number can be
 * larger than what is on screen — a plan arranged on a desktop, opened on a
 * laptop.
 */
export function maxColumnsFor(widthPx: number): 1 | 2 {
  return widthPx >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
}
