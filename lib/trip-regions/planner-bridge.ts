import { readPlanQuery, writePlanQuery, type PlanRegionKeys, type TripPlanState } from './plan-query';
import { rememberTrip } from './remembered-trip';

/**
 * The trip planner on screen, as Parky reaches it: the mounted planner publishes its state here
 * (`connectPlannerBridge`, one effect in `use-plan-state.ts`), so a question carries the plan the
 * visitor sees, and a change Parky makes goes through the planner's own `update`, the path a press
 * takes: written to the address bar, re-planned on screen, kept for its undo. The planner also
 * remembers its query per region here (`remembered-trip.ts`).
 */

interface Connected {
  region: string;
  query: string;
  apply: (query: string) => void;
}

let connected: Connected | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** The planner on screen, and how Parky changes it. */
export const tripPlannerBridge = {
  /** The region and query of the planner on screen, or null without one. */
  current(): { region: string; query: string } | null {
    return connected ? { region: connected.region, query: connected.query } : null;
  },
  /**
   * Set the planner of `region` to `query` through its own state; false when that planner is not
   * on screen, so the caller opens the hub with the query instead.
   */
  apply(region: string, query: string): boolean {
    if (connected?.region !== region) return false;
    connected.apply(query);
    return true;
  },
  /** Told whenever the planner on screen changes or leaves. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Publish the planner's state and how to set it; returns the disconnect. Called on every change of
 * the state, which also remembers the trip once it holds dates or a search.
 */
export function connectPlannerBridge(
  region: string,
  state: TripPlanState,
  update: (recipe: (state: TripPlanState) => TripPlanState) => void,
  keys: PlanRegionKeys
): () => void {
  const query = writePlanQuery(state);
  rememberTrip(region, query);
  const own: Connected = {
    region,
    query,
    apply: (next) => update(() => readPlanQuery(new URLSearchParams(next), keys)),
  };
  connected = own;
  notify();
  return () => {
    if (connected !== own) return;
    connected = null;
    notify();
  };
}
