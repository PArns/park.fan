'use client';

/**
 * Whether the day's showtimes are drawn.
 *
 * The shows are lines across the whole grid plus a band above it, and on a park
 * with a full programme that is a lot of ink over a plan: Phantasialand answers
 * eight shows with six times each, so twenty-odd dotted rules cross the axis a
 * visitor is trying to read three blocks on. They are useful and they are not
 * always wanted, which is what a switch is for.
 *
 * A store rather than component state, and in `localStorage` rather than in the
 * plan, for the two reasons the drag coach gives: a render may not read storage
 * (`useSyncExternalStore` has a server snapshot for exactly that), and whether
 * somebody likes seeing showtimes is a preference of this browser rather than a
 * fact about their day at Phantasialand.
 *
 * The server snapshot is `true`, which is the opposite of the coach's: shows are
 * on by default, so the first HTML draws them and the switch only ever takes
 * something away. A `false` server snapshot would blink them in after mount for
 * every visitor who never touched the switch.
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
    // Private mode, or storage disabled. Showing them is the friendlier
    // failure: the switch still works for this session.
    hidden = false;
  }
  return hidden;
}

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
      // Held for this session, which is what a preference this small is worth.
    }
    for (const listener of listeners) listener();
  },
};
