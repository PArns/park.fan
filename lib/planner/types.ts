/**
 * The trip planner's own data. Everything here lives in the visitor's browser —
 * there is no account system, and the plan is theirs.
 */

/** Where a park lives, so a stored plan can rebuild its API path and its links. */
export interface PlannerGeo {
  continent: string;
  country: string;
  city: string;
}

export interface PlannerEntry {
  /**
   * Stable across reorders and re-renders. Drag needs an identity that survives
   * the list being rewritten under it, and a ride can legitimately appear twice
   * in one day, so the slug cannot serve as the key.
   */
  id: string;
  attractionSlug: string;
  attractionName: string;
  /** Park-local hour the visit is planned for. */
  hour: number;
  /**
   * Ticked off. Once set, the estimate stops being the point: `actualWait` is
   * what happened, and the entry is a record rather than a plan.
   */
  done?: boolean;
  /** The wait actually queued, in minutes, recorded when it was ticked off. */
  actualWait?: number;
}

/** One park's plan for one date. */
export interface PlannerDay {
  /** YYYY-MM-DD, in the park's own timezone. */
  date: string;
  entries: PlannerEntry[];
}

export interface PlannerPark {
  slug: string;
  name: string;
  geo: PlannerGeo;
  /** Keyed by date, so several days of the same park sit side by side. */
  days: Record<string, PlannerDay>;
}

export interface PlannerState {
  /** Keyed by park slug — the visitor plans more than one park. */
  parks: Record<string, PlannerPark>;
  /** Which park and day the flyout shows when it opens. */
  activeParkSlug: string | null;
  activeDate: string | null;
  /** Bumped on every write, so a stale copy from another tab is detectable. */
  version: number;
}

export const EMPTY_PLANNER_STATE: PlannerState = {
  parks: {},
  activeParkSlug: null,
  activeDate: null,
  version: 1,
};

/** True when there is anything at all worth opening the flyout for. */
export function hasAnyPlan(state: PlannerState): boolean {
  return Object.values(state.parks).some((park) =>
    Object.values(park.days).some((day) => day.entries.length > 0)
  );
}

/** Entries for one park and date, in plan order. Never `undefined`. */
export function entriesFor(
  state: PlannerState,
  parkSlug: string | null,
  date: string | null
): PlannerEntry[] {
  if (!parkSlug || !date) return [];
  return state.parks[parkSlug]?.days[date]?.entries ?? [];
}

/** How many entries a park has across every planned day. */
export function countForPark(state: PlannerState, parkSlug: string): number {
  const park = state.parks[parkSlug];
  if (!park) return 0;
  return Object.values(park.days).reduce((sum, day) => sum + day.entries.length, 0);
}

/** Total across all parks — what the trigger badge shows. */
export function countAll(state: PlannerState): number {
  return Object.keys(state.parks).reduce((sum, slug) => sum + countForPark(state, slug), 0);
}
