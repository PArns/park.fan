'use client';

/**
 * "Start the planner", as a signal from outside the planner: the hub's hero action asks, the mounted
 * `TripRegionPlanner` answers. A phone opens the walk's first sheet (Tickets while that question is
 * open in this browser, else Dates), a desk scrolls to that panel and focuses it. A counter rather
 * than state, like the day planner's `plannerUi`, so two presses are two requests; one made before
 * the planner is on screen waits for it.
 */
type Listener = () => void;

let requests = 0;
let handled = 0;
const listeners = new Set<Listener>();

/** The trip planner's open signal. */
export const tripPlannerUi = {
  /** Ask the planner to open its first step: a sheet on a phone, the panel at a desk. */
  openStart(): void {
    requests += 1;
    for (const listener of listeners) listener();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Whether a request is waiting for the planner, consumed by the planner when it answers. */
  take(): boolean {
    if (handled === requests) return false;
    handled = requests;
    return true;
  },
};
