import type { PlanEditChange } from './plan';
import { applyIdea, type PlanIdea } from './plan-ideas';
import {
  readPlanQuery,
  writePlanQuery,
  type PlanRegionKeys,
  type TripPlanState,
} from './plan-query';
import { rememberTrip } from './remembered-trip';

/**
 * The trip planner on screen, as Parky reaches it: the mounted planner publishes its state here
 * (`connectPlannerBridge`, one effect in `use-plan-state.ts`), so a question carries the plan the
 * visitor sees, and a change Parky makes goes through the planner's own `update`, the path a press
 * takes: written to the address bar, re-planned on screen, kept for its undo. The planner also
 * remembers its query per region here (`remembered-trip.ts`).
 *
 * One of Parky's ideas is applied here too, from the strip over the plan, a day's card and the chat
 * alike: as an edit the planner's status band names and its Undo takes back.
 */

/** Who applied an idea: the visitor's press on the planner, or the chat's card. */
type IdeaBy = 'visitor' | 'parky';

/** The planner's edit and undo, as `usePlanState` hands them out. */
export interface PlannerEdits {
  edit: (
    recipe: (state: TripPlanState) => TripPlanState,
    change: PlanEditChange,
    by?: IdeaBy
  ) => void;
  undo: () => boolean;
}

interface Connected {
  region: string;
  query: string;
  apply: (query: string) => void;
  applyIdea: (idea: PlanIdea, by: IdeaBy) => void;
  undo: () => boolean;
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
  /**
   * Apply one of Parky's ideas to the planner of `region` as an edit: its query part set over the
   * state, said in the status band, taken back by its Undo. False when that planner is not on
   * screen.
   */
  applyIdea(region: string, idea: PlanIdea, by: IdeaBy): boolean {
    if (connected?.region !== region) return false;
    connected.applyIdea(idea, by);
    return true;
  },
  /** Take back the last edit of the planner of `region`; false where there is none to take back. */
  undo(region: string): boolean {
    return connected?.region === region && connected.undo();
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
  keys: PlanRegionKeys,
  edits: PlannerEdits
): () => void {
  const query = writePlanQuery(state);
  rememberTrip(region, query);
  const own: Connected = {
    region,
    query,
    apply: (next) => update(() => readPlanQuery(new URLSearchParams(next), keys)),
    applyIdea: (idea, by) =>
      edits.edit((s) => applyIdea(s, idea, keys), { kind: 'idea', idea }, by),
    undo: edits.undo,
  };
  connected = own;
  notify();
  return () => {
    if (connected !== own) return;
    connected = null;
    notify();
  };
}
