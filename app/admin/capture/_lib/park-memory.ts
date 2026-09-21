'use client';

/**
 * Which park this tab was photographing, kept across a reload.
 *
 * The screen is used for hours with the phone going into a pocket between two
 * rides, and both iOS and Android reclaim a backgrounded tab: coming back to it
 * reloads the page. Everything this screen knows lived in React state, so the
 * reload threw the park away and asked for it again — the picker, in sunlight,
 * with half the queue still waiting.
 *
 * `sessionStorage` and not `localStorage`: the memory is meant to survive a
 * reload of this tab and nothing beyond it. Opening the admin at home next week
 * must not seed a park nobody is standing in.
 *
 * What was remembered matters as much as the path. A park somebody picked by
 * hand outranks the coordinates, because picking one is how a wrong detection
 * gets corrected; a park the coordinates resolved is only a head start until
 * they answer again.
 *
 * It is exposed as a store rather than as two functions because the value is
 * read during render and written from an event: the page subscribes with
 * `useSyncExternalStore`, which is also what keeps the server's render (no
 * storage, no park) and the browser's first one from disagreeing.
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

export function rememberPark(entry: RememberedPark): void {
  write(JSON.stringify(entry));
}

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
