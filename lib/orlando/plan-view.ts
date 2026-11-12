'use client';

/**
 * Which view of the trip result this browser chose last: the day cards (Agenda), the Outlook-style
 * week, or the month grid. A preference of the browser and not of the plan, so it stays out of the
 * URL and out of the planner's state, in a store over `localStorage` like the planner's show switch
 * (`lib/planner/shows-visible.ts`). `null` until somebody chooses: the result then picks by the
 * width of the window.
 */

/** The result's three views. */
export const PLAN_VIEWS = ['agenda', 'week', 'month'] as const;
/** One of {@link PLAN_VIEWS}. */
export type PlanView = (typeof PLAN_VIEWS)[number];

const KEY = 'parkfan_orlando_view';

let chosen: PlanView | null | undefined;
const listeners = new Set<() => void>();

function load(): PlanView | null {
  if (chosen !== undefined) return chosen;
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(KEY);
    chosen = (PLAN_VIEWS as readonly string[]).includes(stored ?? '') ? (stored as PlanView) : null;
  } catch {
    // Private mode, or storage disabled: nothing chosen, and a choice still holds for the session.
    chosen = null;
  }
  return chosen;
}

/** The chosen view as an external store. */
export const orlandoPlanView = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The view chosen in this browser, `null` for none yet. */
  getSnapshot(): PlanView | null {
    return load();
  },
  /** `null` on the server: the result is never in the first HTML. */
  getServerSnapshot(): PlanView | null {
    return null;
  },
  set(view: PlanView): void {
    if (load() === view) return;
    chosen = view;
    try {
      window.localStorage.setItem(KEY, view);
    } catch {
      // Held for this session.
    }
    for (const listener of listeners) listener();
  },
};
