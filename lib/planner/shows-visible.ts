'use client';

/**
 * Whether the day's showtimes are drawn: useful, and a lot of ink over a plan on a park with a full
 * programme, so they can be switched off. A store in `localStorage` like the drag coach's, as a
 * preference of this browser. The server snapshot is `true`, so the first HTML draws them and the
 * switch only ever takes something away.
 */

const KEY = 'parkfan_planner_shows';

let hidden: boolean | null = null;
const listeners = new Set<() => void>();

function load(): boolean {
  if (hidden !== null) return hidden;
  if (typeof window === 'undefined') return false;
  try {
    hidden = window.localStorage.getItem(KEY) === '1';
  } catch {
    // Private mode, or storage disabled: shown, and the switch still works for this session.
    hidden = false;
  }
  return hidden;
}

/** The show switch's state as an external store. */
export const plannerShowsVisible = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** `true` while the shows are drawn. */
  getSnapshot(): boolean {
    return !load();
  },
  /** `true` on the server: the first HTML draws them. */
  getServerSnapshot(): boolean {
    return true;
  },
  toggle(): void {
    hidden = !load();
    try {
      if (hidden) window.localStorage.setItem(KEY, '1');
      else window.localStorage.removeItem(KEY);
    } catch {
      // Held for this session.
    }
    for (const listener of listeners) listener();
  },
};
