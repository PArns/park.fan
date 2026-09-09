'use client';

/**
 * Which two days of a park's calendar are being compared, across a change of month.
 *
 * The month is a PATH SEGMENT (`…/wait-time-calendar/2026/11`), so stepping from October to
 * November is a real navigation and `ParkCalendarGrid` — the component that holds the picks —
 * unmounts and mounts again. Two days from two different months is the case the whole comparison
 * exists for, and component state cannot survive it.
 *
 * **A module store rather than a query parameter, and the decision went the other way first.**
 * The argument for the URL is the one this route already won with the month: a hash could not be
 * crawled, could not be a search result and did not answer the back button. It does not carry
 * over, for two reasons that are specific to this selection —
 *
 * 1. **The picks are not the page's identity.** The month is what the page is ABOUT; which two of
 *    its days somebody is weighing is what they are DOING. The grid's own `selectedDate` — the
 *    day whose detail dialog is open — has always been state for the same reason.
 * 2. **Every pick would be a route navigation, on the heaviest route in the app.** A park's
 *    calendar page renders a month of tiles, a summary and a park header; `router.replace` re-runs
 *    that tree. Turning three clicks (pick, pick, unpick) into three navigations to move a ring
 *    around two cells is a cost the reader pays in latency for a link nobody asked to share. And
 *    the grid is a `dynamic(..., { ssr: false })` import, so a query parameter could not be read
 *    on the server anyway — the shareable-link benefit is smaller here than it looks.
 *
 * Same shape as `lib/planner/page-park.ts`: a module store, `useSyncExternalStore`-ready, with a
 * server snapshot so the first paint cannot disagree across hydration.
 *
 * **Scoped to a park slug.** Walking from Phantasialand's calendar to Europa-Park's must not
 * carry two dates over — they would name days at a park whose grid never showed them. Every read
 * asks for a slug and gets nothing back if the selection belongs to another one.
 *
 * **The whole day is kept, not just its date**, and that is what makes two months work rather
 * than merely two clicks. The grid's `calendarMap` holds ONE month; a day picked in October is
 * not in it once November is on screen, and a comparison that only remembered `2026-10-14` would
 * have nothing to compare by the time the second pick happened. The payload is captured at the
 * moment of the press, off the month that was on screen — a forecast that moves afterwards is
 * therefore as fresh as the tile the reader clicked, which is the honest answer for a screen that
 * is about what they just saw.
 */

import type { CalendarDay } from '@/lib/api/types';

export interface DayComparisonSelection {
  /** The park the selection belongs to. */
  parkSlug: string;
  /** Whether the grid is in comparison mode at all. Independent of {@link days} — the mode is on
   *  the moment the switch is pressed, with nothing picked yet. */
  active: boolean;
  /** The picked days, in pick order, at most two. The first is the comparison's left column. */
  days: readonly CalendarDay[];
}

/** The answer for a park with nothing going on. One frozen object, so identity is stable. */
const IDLE: DayComparisonSelection = Object.freeze({
  parkSlug: '',
  active: false,
  days: Object.freeze([]) as readonly CalendarDay[],
});

let current: DayComparisonSelection = IDLE;
const listeners = new Set<() => void>();

function commit(next: DayComparisonSelection): void {
  current = next;
  for (const listener of listeners) listener();
}

export const dayComparisonStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /**
   * The selection, or {@link IDLE} where it belongs to another park.
   *
   * The identity of the returned object is what `useSyncExternalStore` compares, so both branches
   * hand back a value that only changes when something did: `current` is replaced wholesale by
   * {@link commit}, and the miss returns the one frozen `IDLE`.
   */
  getSnapshot(parkSlug: string): DayComparisonSelection {
    return current.parkSlug === parkSlug ? current : IDLE;
  },
  /** Nothing is selected in the first HTML — the grid does not render on the server at all. */
  getServerSnapshot(): DayComparisonSelection {
    return IDLE;
  },
  /** Turn comparison mode on or off. Switching it OFF drops the picks: leaving them would light
   *  two cells the next time the mode is entered, for a comparison nobody is in the middle of. */
  setActive(parkSlug: string, active: boolean): void {
    commit(active ? { parkSlug, active: true, days: [] } : IDLE);
  },
  /**
   * Pick a day, or take it back.
   *
   * Three rules, and the third is the one that needs stating: a day already picked is unpicked, a
   * first or second day is appended, and a THIRD day replaces the OLDER of the two. Replacing the
   * older is what makes „ich vergleiche jetzt doch den 20. mit dem 27." one click instead of
   * three — the day just chosen is the one being kept, which is the one the reader is thinking
   * about.
   */
  toggle(parkSlug: string, day: CalendarDay): void {
    const base =
      current.parkSlug === parkSlug && current.active
        ? current
        : { parkSlug, active: true, days: [] as readonly CalendarDay[] };
    if (base.days.some((d) => d.date === day.date)) {
      commit({ parkSlug, active: true, days: base.days.filter((d) => d.date !== day.date) });
      return;
    }
    const kept = base.days.length >= 2 ? base.days.slice(1) : base.days;
    commit({ parkSlug, active: true, days: [...kept, day] });
  },
  /** Drop the picks and stay in comparison mode — what „Auswahl aufheben" does. */
  clearDays(parkSlug: string): void {
    commit({ parkSlug, active: true, days: [] });
  },
};
