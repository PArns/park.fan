'use client';

/**
 * Whether the drag gesture has been explained once.
 *
 * A store rather than component state, for the reason `panel-width.ts` gives
 * for being one: the answer lives in `localStorage`, and reading it during a
 * render would make the first client render disagree with the server's.
 * `useSyncExternalStore` has a server snapshot for exactly that — the server
 * says "already seen", so nothing is in the first HTML and the coach mark can
 * only ever appear after mount, where it belongs.
 *
 * It is a preference of this browser and not part of the plan: the plan is a
 * document somebody may keep for months, and whether a hint has been read is
 * not a fact about their day at Phantasialand.
 */

const KEY = 'parkfan_planner_dragcoach';

let dismissed: boolean | null = null;
const listeners = new Set<() => void>();

function load(): boolean {
  if (dismissed !== null) return dismissed;
  if (typeof window === 'undefined') return true;
  try {
    dismissed = window.localStorage.getItem(KEY) === '1';
  } catch {
    // Private mode, or storage disabled. Showing the hint once per session is
    // the friendlier failure than never showing it.
    dismissed = false;
  }
  return dismissed;
}

export const plannerDragCoach = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): boolean {
    return load();
  },
  /** `true` on the server: never in the first HTML. */
  getServerSnapshot(): boolean {
    return true;
  },
  dismiss(): void {
    if (dismissed === true) return;
    dismissed = true;
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // Held for this session, which is what the hint is for anyway.
    }
    for (const listener of listeners) listener();
  },
};
