'use client';

/**
 * "Open the planner's dates", as a signal from outside the planner: the hub's hero action asks, the
 * mounted `OrlandoPlanner` answers (a phone opens the Dates sheet, a desk scrolls to the dates panel
 * and focuses it). A counter rather than state, like the day planner's `plannerUi`, so two presses
 * are two requests; one made before the planner is on screen waits for it.
 */
type Listener = () => void;

let requests = 0;
let handled = 0;
const listeners = new Set<Listener>();

/** The Orlando planner's open signal. */
export const orlandoPlannerUi = {
  /** Ask the planner to open its dates step: the Dates sheet on a phone, the panel at a desk. */
  openDates(): void {
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
