'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A UI preference that survives a reload, read without a render cascade.
 *
 * The obvious version — `useState(false)` plus an effect that reads
 * localStorage on mount — is a synchronous setState inside an effect, which
 * React 19 flags because it renders the wrong value first and then immediately
 * renders again. For a collapsed sidebar that is a visible flicker on every
 * page load.
 *
 * `useSyncExternalStore` reads the stored value during render on the client and
 * the server snapshot on the server, so there is one render and no mismatch:
 * the server always renders the default, and the client's first paint already
 * has the stored one.
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
