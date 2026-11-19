import type { TripChangeKind } from '@/lib/assistant/actions';
import type { AssistantTripIdea } from '@/lib/assistant/trip-idea';
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
 * alike: as an edit the planner's status band names and its Undo takes back. So is a change Parky
 * makes with `change_trip` while the planner is on screen, and the chat's idea card opens the
 * result's swap mode for its park here (`openSwap`, which the result connects). An idea Parky
 * offers on his own gets its card's words from the planner here (`ideaCard`): the chat carries
 * none of the planner's messages.
 */

/** Who applied an idea: the visitor's press on the planner, or the chat's card. */
type IdeaBy = 'visitor' | 'parky';

/** The planner's edit, undo and clear, as `usePlanState` hands them out. */
export interface PlannerEdits {
  edit: (
    recipe: (state: TripPlanState) => TripPlanState,
    change: PlanEditChange,
    by?: IdeaBy
  ) => void;
  undo: () => boolean;
  /**
   * Empty the planner, its edits and their undo with it, as no change of an option (nothing is
   * counted); returns how to put the plan and its edits back.
   */
  clear: () => () => void;
}

interface Connected {
  region: string;
  query: string;
  apply: (query: string) => void;
  applyChange: (query: string, changes: readonly TripChangeKind[]) => void;
  applyIdea: (idea: PlanIdea, by: IdeaBy) => void;
  undo: () => boolean;
  clear: () => () => void;
}

/** The result's swap mode: opens it for a park's day, false where the plan has none for it. */
type OpenSwap = (park: string, from?: string) => boolean;

/** An idea as the chat's card shows it, in the planner's words. */
type IdeaCardOf = (idea: PlanIdea) => AssistantTripIdea;

let connected: Connected | null = null;
let swap: { region: string; open: OpenSwap } | null = null;
let ideaCards: { region: string; of: IdeaCardOf } | null = null;
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
   * Set the planner of `region` to `query` as Parky's edit (`change_trip`, by the kinds the API
   * names for it): said in the status band and taken back by its Undo, like a press of its own.
   * False when that planner is not on screen.
   */
  applyChange(region: string, query: string, changes: readonly TripChangeKind[]): boolean {
    if (connected?.region !== region) return false;
    connected.applyChange(query, changes);
    return true;
  },
  /**
   * Open the swap mode of the planner of `region` for `park`: on its day `from` where the plan has
   * the park there, else on its first day. False when that planner's result is not on screen or
   * the plan has no day for the park.
   */
  openSwap(region: string, park: string, from?: string): boolean {
    return swap?.region === region && swap.open(park, from);
  },
  /**
   * The chat's card for an idea Parky offers on his own, in the words of the planner of `region`
   * (`AssistantTripIdeaCard`); null when that planner is not on screen.
   */
  ideaCard(region: string, idea: PlanIdea): AssistantTripIdea | null {
    return ideaCards?.region === region ? ideaCards.of(idea) : null;
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
  /**
   * Empty the planner of `region` (`clearTrip`): its query, its pins and its edits' undo, counted as
   * no option changed. Returns how to put them back, or null when that planner is not on screen.
   */
  clear(region: string): (() => void) | null {
    return connected?.region === region ? connected.clear() : null;
  },
  /** Told whenever the planner on screen changes or leaves. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Publish the planner's state and how to set it; returns the disconnect. Called on every change of
 * the state, which also remembers the trip once it holds dates or a search. `published` is the
 * state as the plan on screen was asked for: Parky plans from it, the remembered trip keeps
 * `state`'s spelling.
 */
export function connectPlannerBridge(
  region: string,
  state: TripPlanState,
  published: TripPlanState,
  update: (recipe: (state: TripPlanState) => TripPlanState) => void,
  keys: PlanRegionKeys,
  edits: PlannerEdits
): () => void {
  rememberTrip(region, writePlanQuery(state));
  const own: Connected = {
    region,
    query: writePlanQuery(published),
    apply: (next) => update(() => readPlanQuery(new URLSearchParams(next), keys)),
    applyChange: (next, changes) =>
      edits.edit(
        () => readPlanQuery(new URLSearchParams(next), keys),
        { kind: 'parky', changes },
        'parky'
      ),
    applyIdea: (idea, by) =>
      edits.edit((s) => applyIdea(s, idea, keys), { kind: 'idea', idea }, by),
    undo: edits.undo,
    clear: edits.clear,
  };
  connected = own;
  notify();
  return () => {
    if (connected !== own) return;
    connected = null;
    notify();
  };
}

/**
 * Connect the result's swap mode for `region`, which the chat's idea card opens through
 * `tripPlannerBridge.openSwap`; returns the disconnect.
 */
export function connectPlannerSwap(region: string, open: OpenSwap): () => void {
  const own = { region, open };
  swap = own;
  return () => {
    if (swap === own) swap = null;
  };
}

/**
 * Connect the planner's words for the chat's idea cards for `region`, which
 * `tripPlannerBridge.ideaCard` reads; returns the disconnect.
 */
export function connectIdeaCards(region: string, of: IdeaCardOf): () => void {
  const own = { region, of };
  ideaCards = own;
  return () => {
    if (ideaCards === own) ideaCards = null;
  };
}
