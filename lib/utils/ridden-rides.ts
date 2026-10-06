/*
 * The rides a visitor has marked as ridden, as an external store over `localStorage`.
 *
 * Local to the browser on purpose: no account, no sync. The server and hydration read the empty
 * set (`getServerRiddenSnapshot`), so every consumer renders the same markup on both sides and
 * flips in one batch once the real set is known (the mount-gate rule). The set is keyed on the
 * ride's `id`, which is stable across parks and seasons.
 */

/** Where the marked ride ids live, as a JSON array of strings. */
export const RIDDEN_RIDES_KEY = 'ridden-rides';

const EMPTY: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(RIDDEN_RIDES_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ReadonlySet<string> {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    return new Set(value.filter((id): id is string => typeof id === 'string'));
  } catch {
    return EMPTY;
  }
}

/**
 * The marked ids. The same object comes back until the stored value changes, which is what
 * `useSyncExternalStore` needs from a snapshot.
 */
export function getRiddenSnapshot(): ReadonlySet<string> {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSet = parse(raw);
  }
  return cachedSet;
}

/** The snapshot on the server and while hydrating: nothing marked yet. */
export function getServerRiddenSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/** Calls `listener` when a ride is marked here or in another tab; returns the unsubscribe. */
export function subscribeToRidden(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RIDDEN_RIDES_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Marks the ride as ridden, or takes the mark off; returns the new state. */
export function toggleRidden(id: string): boolean {
  const next = new Set(getRiddenSnapshot());
  const marked = !next.delete(id);
  if (marked) next.add(id);
  try {
    localStorage.setItem(RIDDEN_RIDES_KEY, JSON.stringify([...next]));
  } catch {
    // Private mode or a full quota: the mark lasts until the page is left.
    cachedRaw = null;
    cachedSet = next;
  }
  for (const listener of listeners) listener();
  return marked;
}
