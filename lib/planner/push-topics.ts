'use client';

/**
 * Which kinds of notification this browser wants: a narrowing of the deploy's own topic ids from
 * `/api/push`, never an invented one. An external store, like `panel-width.ts`, so it survives the
 * panel closing and the first client render matches the server's. No stored narrowing means
 * everything the deploy offers, including topics it adds later.
 */

const KEY = 'parkfan_planner_push_topics';

let selection: readonly string[] | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      selection = parsed;
    }
  } catch {
    // Private mode, storage off, or an older shape: "everything" is right for all three.
  }
}

/** The visitor's topic narrowing as an external store. */
export const plannerPushTopics = {
  subscribe(listener: () => void): () => void {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The stored narrowing, or `null` for "everything this deploy offers". */
  getSnapshot(): readonly string[] | null {
    load();
    return selection;
  },
  getServerSnapshot(): readonly string[] | null {
    return null;
  },
  set(topics: readonly string[]): void {
    selection = topics;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(topics));
    } catch {
      // Holds for this session, which beats refusing the change.
    }
    for (const listener of listeners) listener();
  },
};

/**
 * The topics to subscribe with: the deploy's list, intersected with the visitor's narrowing, so a
 * stored id the API has retired cannot come back. With no narrowing, everything the deploy offers.
 */
export function resolvePushTopics(
  available: readonly string[],
  selected: readonly string[] | null
): string[] {
  if (selected === null) return [...available];
  const wanted = new Set(selected);
  const kept = available.filter((topic) => wanted.has(topic));
  // Never subscribe to nothing while the switch reads "on". The UI refuses to untick the last box;
  // this is the second fence.
  return kept.length > 0 ? kept : [...available];
}
