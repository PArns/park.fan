/** A JSON record under one localStorage key, as an external store for `useSyncExternalStore`. */
export interface LocalRecordStore<T> {
  subscribe(listener: () => void): () => void;
  /** The same object until the stored value changes. */
  getSnapshot(): T;
  /** The empty record: the server and hydration read no storage. */
  getServerSnapshot(): T;
  /** Stores `next`, or removes the key for a record without entries, and tells the listeners. */
  write(next: T): void;
  /** Empties the record and returns how to put it back. */
  forget(): () => void;
}

/**
 * The store behind a record a visitor keeps in this browser. The snapshot is parsed once per stored
 * string, so it keeps its identity between renders; a write that storage refuses (private mode, a
 * full store) still holds until the page is left; and another tab's write reaches the listeners
 * through the `storage` event. `onWrite` runs after every write of this tab.
 */
export function createLocalRecordStore<T extends object>({
  key,
  parse,
  empty,
  onWrite,
}: {
  key: string;
  parse: (raw: string | null) => T;
  empty: T;
  onWrite?: () => void;
}): LocalRecordStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: T = empty;

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const getSnapshot = (): T => {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parse(raw);
    }
    return cached;
  };
  const write = (next: T) => {
    try {
      if (Object.keys(next).length === 0) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Pinning the raw that is stored now keeps `next` as the snapshot until the stored value
      // changes under it.
      cachedRaw = readRaw();
      cached = next;
    }
    for (const listener of listeners) listener();
    onWrite?.();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => empty,
    write,
    forget() {
      const kept = getSnapshot();
      if (kept === empty) return () => undefined;
      write(empty);
      return () => write(kept);
    },
  };
}
