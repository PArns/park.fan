'use client';

/**
 * A choice this browser remembers, as an external store over `localStorage` for
 * `useSyncExternalStore`: the result's view, whether the ticket question was answered. A
 * preference of the browser and not of the plan, so it stays out of the URL. Every read and write
 * is wrapped: private mode or blocked storage keeps the choice for the session only.
 */
export interface LocalChoice<T extends string> {
  subscribe(listener: () => void): () => void;
  /** The value chosen in this browser, `null` for none yet. */
  getSnapshot(): T | null;
  /** `null` on the server, which never renders what depends on it. */
  getServerSnapshot(): T | null;
  set(value: T): void;
}

/** A {@link LocalChoice} under `key`, holding one of `values`. */
export function localChoice<T extends string>(key: string, values: readonly T[]): LocalChoice<T> {
  let chosen: T | null | undefined;
  const listeners = new Set<() => void>();

  const load = (): T | null => {
    if (chosen !== undefined) return chosen;
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(key);
      chosen = (values as readonly string[]).includes(stored ?? '') ? (stored as T) : null;
    } catch {
      chosen = null;
    }
    return chosen;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: load,
    getServerSnapshot: () => null,
    set(value) {
      if (load() === value) return;
      chosen = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Held for this session.
      }
      for (const listener of listeners) listener();
    },
  };
}
