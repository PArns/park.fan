'use client';

import type { PlannerGeo } from './types';

/**
 * The park the page behind the panel is about, which the layout-mounted planner cannot otherwise
 * know. The page's park, never the plan's. A module store rather than a context around the layout;
 * the server snapshot is `null`. Published by {@link PlannerPageParkBeacon} on every park-scoped
 * route.
 */
export interface PlannerPagePark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  timezone?: string;
  /**
   * The park's photo for the wash behind the panel, resolved by the route because `@/lib/media` is
   * server-only. For a panel with nothing planned yet; a planned day gets it from `/plan/day`.
   */
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

let current: PlannerPagePark | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** The page's park as an external store, set by the beacon and read by the panel. */
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
   * Announce the route's park. Idempotent by value, not identity: the beacon re-runs on every
   * render, and a new object each time would notify every subscriber.
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
