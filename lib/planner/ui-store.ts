'use client';

/**
 * "Open the planner", as a signal rather than as state.
 *
 * The plan itself lives in `store.ts` and is persisted; whether the panel is on
 * screen is neither persisted nor owned by any one component. The launcher holds
 * the `open` boolean, and something else entirely — a day in the park calendar —
 * needs to be able to ask for it. A context would mean wrapping the layout for a
 * boolean; a field on the plan would write UI state into localStorage and hand a
 * visitor a panel that opens by itself the next time they arrive.
 *
 * So: a counter. Every request increments it, subscribers see it change, and two
 * requests in a row are two events rather than one no-op — which is what a plain
 * boolean would collapse them into once the panel had been closed in between.
 */

type Listener = () => void;

let requests = 0;
const listeners = new Set<Listener>();

export const plannerUi = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): number {
    return requests;
  },
  /** Zero on the server, so the panel is never in the first HTML. */
  getServerSnapshot(): number {
    return 0;
  },
  /** Ask for the panel. The caller has usually just set the active park and day. */
  requestOpen(): void {
    requests += 1;
    for (const listener of listeners) listener();
  },
};
