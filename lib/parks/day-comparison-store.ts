'use client';

/**
 * Which two days of a park's calendar are being compared, across a change of month. The month is
 * a path segment, so stepping to the next month remounts `ParkCalendarGrid` and component state
 * cannot hold the picks.
 *
 * A module store rather than a query parameter: the picks are what the reader is doing, not what
 * the page is about, and every pick as a navigation would re-run the heaviest route in the app
 * (the client-only grid could not read the parameter on the server anyway). Same shape as
 * `lib/planner/page-park.ts`, with a server snapshot for hydration.
 *
 * Scoped to a park slug, so a selection never carries over to another park. Whole days are kept,
 * not just dates, because the grid's `calendarMap` holds only the month on screen.
 */

import type { CalendarDay } from '@/lib/api/types';

/** The calendar comparison state for one park. */
export interface DayComparisonSelection {
  /** The park the selection belongs to. */
  parkSlug: string;
  /** Whether the grid is in comparison mode, independent of {@link days}: the mode is on from
   *  the moment the switch is pressed, with nothing picked yet. */
  active: boolean;
  /** The picked days, in pick order, at most two. The first is the left column. */
  days: readonly CalendarDay[];
  /**
   * The pair whose comparison the reader already closed, as `date|date`, or `null`. Kept here
   * because the grid unmounts on a month change and a dismissal held there would reopen. Cleared
   * by every write that changes the picks.
   */
  dismissed: string | null;
}

/** The answer for a park with nothing going on; one frozen object, so identity is stable. */
const IDLE: DayComparisonSelection = Object.freeze({
  parkSlug: '',
  active: false,
  days: Object.freeze([]) as readonly CalendarDay[],
  dismissed: null,
});

let current: DayComparisonSelection = IDLE;
const listeners = new Set<() => void>();

function commit(next: DayComparisonSelection): void {
  current = next;
  for (const listener of listeners) listener();
}

/** The module store behind the calendar's day comparison, shaped for `useSyncExternalStore`. */
export const dayComparisonStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /**
   * The selection, or {@link IDLE} where it belongs to another park. Both branches return a value
   * whose identity changes only when something did, as `useSyncExternalStore` requires.
   */
  getSnapshot(parkSlug: string): DayComparisonSelection {
    return current.parkSlug === parkSlug ? current : IDLE;
  },
  /** Nothing is selected in the first HTML: the grid does not render on the server. */
  getServerSnapshot(): DayComparisonSelection {
    return IDLE;
  },
  /** Turn comparison mode on or off. Off drops the picks, so re-entering the mode does not light
   *  two cells for a comparison nobody is in the middle of. */
  setActive(parkSlug: string, active: boolean): void {
    commit(active ? { parkSlug, active: true, days: [], dismissed: null } : IDLE);
  },
  /**
   * Pick a day, or take it back. A picked day is unpicked, a first or second is appended, and a
   * third replaces the OLDER of the two, so swapping one day is one click.
   */
  toggle(parkSlug: string, day: CalendarDay): void {
    const base =
      current.parkSlug === parkSlug && current.active
        ? current
        : { parkSlug, active: true, days: [] as readonly CalendarDay[], dismissed: null };
    if (base.days.some((d) => d.date === day.date)) {
      commit({
        parkSlug,
        active: true,
        days: base.days.filter((d) => d.date !== day.date),
        dismissed: null,
      });
      return;
    }
    const kept = base.days.length >= 2 ? base.days.slice(1) : base.days;
    commit({ parkSlug, active: true, days: [...kept, day], dismissed: null });
  },
  /** Drop the picks and stay in comparison mode („Auswahl aufheben"). */
  clearDays(parkSlug: string): void {
    commit({ parkSlug, active: true, days: [], dismissed: null });
  },
  /**
   * Remember that this pair's comparison was closed, or forget it with `null`. A no-op for another
   * park's selection.
   */
  dismiss(parkSlug: string, pair: string | null): void {
    if (current.parkSlug !== parkSlug || current.dismissed === pair) return;
    commit({ ...current, dismissed: pair });
  },
};
