'use client';

/**
 * Whether the drag gesture has been explained once: a store over `localStorage`, like
 * `panel-width.ts`. The server snapshot says "already seen", so the coach mark only ever appears
 * after mount. A preference of this browser, not part of the plan.
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
    // Private mode, or storage disabled: shown once per session rather than never.
    dismissed = false;
  }
  return dismissed;
}

/** Whether the drag coach was dismissed, as an external store. */
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
      // Held for this session.
    }
    for (const listener of listeners) listener();
  },
};
