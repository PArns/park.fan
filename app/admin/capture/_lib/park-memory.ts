'use client';

/**
 * Which park this tab was photographing, kept across the reload a phone forces on a backgrounded
 * tab. `sessionStorage`, so it never outlives the tab. A hand-picked park outranks the coordinates,
 * since picking is how a wrong detection is corrected. A store for `useSyncExternalStore`, which
 * keeps the server render and the first browser render in agreement.
 */

const KEY = 'parkfan.capture.park';

/** Dispatched on this tab after every write, since `storage` never fires here. */
const CHANGED = 'parkfan:capture-park';

export interface RememberedPark {
  /** `continent/country/city/park`. */
  path: string;
  /** True when a person picked it, false when the coordinates resolved it. */
  manual: boolean;
}

/** Subscribes to changes of the remembered capture park in this tab; returns the unsubscribe. */
export function subscribeParkMemory(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  return () => window.removeEventListener(CHANGED, onChange);
}

/** The raw entry. A string is compared by value, so it is a stable snapshot. */
export function parkMemorySnapshot(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    // A private window has no `sessionStorage` and throws on the property.
    return null;
  }
}

/** Nothing is remembered on the server, and pretending otherwise would hydrate wrong. */
export function parkMemoryServerSnapshot(): null {
  return null;
}

/**
 * Parses the stored entry into its park path and `manual` flag. Returns `null` unless the path has
 * four segments.
 */
export function parseRememberedPark(raw: string | null): RememberedPark | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const { path, manual } = value as Record<string, unknown>;
    // Four segments or it is not a park path, and everything downstream builds
    // a request out of it.
    if (typeof path !== 'string' || path.split('/').filter(Boolean).length !== 4) return null;
    return { path, manual: manual === true };
  } catch {
    return null;
  }
}

/** Stores the capture park for this tab in sessionStorage and notifies subscribers. */
export function rememberPark(entry: RememberedPark): void {
  write(JSON.stringify(entry));
}

/** Clears the remembered capture park for this tab and notifies subscribers. */
export function forgetPark(): void {
  write(null);
}

function write(value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, value);
  } catch {
    // Nothing to do and nothing to report: the screen works without the memory,
    // it just asks for the park again after a reload.
    return;
  }
  window.dispatchEvent(new Event(CHANGED));
}
