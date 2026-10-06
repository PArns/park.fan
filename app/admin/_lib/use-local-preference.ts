'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A UI preference that survives a reload, read through `useSyncExternalStore`: the server renders
 * the default and the client's first paint already has the stored value, where an effect would
 * render twice and flicker. See docs/rules/a-mount-gate-reads-a-store-never-a-timer.md.
 */

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // `storage` fires in OTHER tabs, which is exactly right for a preference:
  // collapsing the sidebar in one admin tab should collapse it in the rest.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Returns a string preference kept in localStorage and its setter. The server and a failed read
 * give `defaultValue`; a change in another admin tab updates this one too.
 */
export function useLocalPreference(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key) ?? defaultValue;
      } catch {
        // Private browsing, or a storage quota that is full. A preference is
        // not worth an exception.
        return defaultValue;
      }
    },
    () => defaultValue
  );

  const set = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Ignore — the in-memory value below still updates for this session.
      }
      emit();
    },
    [key]
  );

  return [value, set];
}
