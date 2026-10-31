import { useSyncExternalStore } from 'react';

/**
 * Whether a search is open anywhere on the page right now: the palette, the hero's field, the
 * homepage's step card, a listing's field. Parky reads it to search along. Every surface's session
 * reports its openings and closings here (`useSearchSession`), so a new surface counts without
 * being wired up. Only a session still on the page counts, so a field that leaves the page while
 * open (a navigation) leaves no search behind.
 */
export interface SearchPresence {
  /** A session is on the page; strict mode reports a mount twice, which changes nothing. */
  mount(owner: object): void;
  /** A session left the page; its opening stays recorded for a remount. */
  unmount(owner: object): void;
  /** A session opened or closed. */
  setOpen(owner: object, open: boolean): void;
  subscribe(listener: () => void): () => void;
  /** Whether a session on the page is open. */
  getSnapshot(): boolean;
  /** `false`: the server renders no open search. */
  getServerSnapshot(): boolean;
}

/** A {@link SearchPresence} of its own, for the tests; the page shares {@link searchPresence}. */
export function createSearchPresence(): SearchPresence {
  const mounted = new Set<object>();
  // Weak, so a session that left the page while open is not held on to.
  const open = new WeakSet<object>();
  const listeners = new Set<() => void>();
  let any = false;
  const update = () => {
    const next = [...mounted].some((owner) => open.has(owner));
    if (next === any) return;
    any = next;
    for (const listener of listeners) listener();
  };
  return {
    mount(owner) {
      mounted.add(owner);
      update();
    },
    unmount(owner) {
      mounted.delete(owner);
      update();
    },
    setOpen(owner, isOpen) {
      if (isOpen) open.add(owner);
      else open.delete(owner);
      update();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => any,
    getServerSnapshot: () => false,
  };
}

/** The page's searches, which every `useSearchSession` reports to. */
export const searchPresence = createSearchPresence();

/** Whether a search is open anywhere on the page ({@link searchPresence}); `false` on the server. */
export function useSearchOpen(): boolean {
  return useSyncExternalStore(
    searchPresence.subscribe,
    searchPresence.getSnapshot,
    searchPresence.getServerSnapshot
  );
}
