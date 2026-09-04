'use client';

import type { PlannerGeo } from './types';

/**
 * The park the page behind the panel is about.
 *
 * The planner is mounted in the layout and knows nothing about the route under
 * it, which produced the confusion this exists to end: standing on Toverland's
 * calendar with a Phantasialand plan open, the panel's header read
 * "Phantasialand" and there was no way to plan the park actually on screen
 * without leaving for the planner's own page.
 *
 * A module store rather than a context, for the reason `ui-store.ts` gives for
 * being one: a context for this would mean wrapping the whole layout to carry a
 * value that four routes publish and one component reads. `useSyncExternalStore`
 * has a server snapshot, so the server renders `null` and nothing here can
 * disagree across hydration.
 *
 * Published by {@link PlannerPageParkBeacon}, which every park-scoped route
 * mounts. It is the PAGE's park, never the plan's — the two are different
 * questions and conflating them is what the header got wrong.
 */
export interface PlannerPagePark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone?: string;
  /**
   * The park's photo, for the wash behind the panel.
   *
   * Resolved by the ROUTE and carried here, because it comes out of
   * `@/lib/media` — a 107 KB catalogue and server-only, which the panel (a
   * Client Component in the layout) may not import. `/plan/day` answers with the
   * same picture from the same place for a park that is being planned; this is
   * for the panel that has nothing planned yet, which used to open as a black
   * rectangle on top of a park page.
   */
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

let current: PlannerPagePark | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export const plannerPagePark = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): PlannerPagePark | null {
    return current;
  },
  /** `null` on the server: no route is "behind" a panel that is not open yet. */
  getServerSnapshot(): PlannerPagePark | null {
    return null;
  },
  /**
   * Announce the route's park. Idempotent by VALUE rather than by identity: the
   * beacon re-runs on every render of its page, and a new object each time
   * would notify every subscriber for a park that has not changed.
   */
  set(park: PlannerPagePark | null): void {
    const same =
      current === park ||
      (current !== null &&
        park !== null &&
        current.slug === park.slug &&
        current.geo.continent === park.geo.continent &&
        current.geo.country === park.geo.country &&
        current.geo.city === park.geo.city);
    if (same) return;
    current = park;
    emit();
  },
  /** Called when a park route unmounts, so a plain page reports no park. */
  clear(slug: string): void {
    if (current?.slug !== slug) return;
    current = null;
    emit();
  },
};
