/**
 * Crash protection for the curated-fields editor: a draft in localStorage survives every way out
 * of the form (a tab, a link, a reload, the back button, a crash), which no navigation guard can
 * cover. Best effort throughout, since a safety net that throws is worse than none.
 */

const KEY_PREFIX = 'parkfan-admin-curated-draft:';
const VERSION = 1;

/** `park:<id>` or `attraction:<id>` — two entities never share a slot. */
export type DraftScope = string;

interface StoredDraft {
  v: number;
  savedAt: number;
  values: Record<string, unknown>;
}

export interface CuratedDraft {
  savedAt: number;
  values: Record<string, unknown>;
}

function keyFor(scope: DraftScope): string {
  return KEY_PREFIX + scope;
}

/**
 * Reads the unsaved curated-field corrections stored for a park or ride from localStorage. Returns
 * `null` when there are none, the version differs or storage fails.
 */
export function loadCuratedDraft(scope: DraftScope): CuratedDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed.v !== VERSION) return null;
    if (!parsed.values || Object.keys(parsed.values).length === 0) return null;
    return { savedAt: parsed.savedAt, values: parsed.values };
  } catch {
    return null;
  }
}

/** Stores the editor's current corrections for a park or ride in localStorage, with a timestamp. */
export function saveCuratedDraft(scope: DraftScope, values: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      keyFor(scope),
      JSON.stringify({ v: VERSION, savedAt: Date.now(), values } satisfies StoredDraft)
    );
  } catch {
    /* quota, private mode — best effort by design */
  }
}

/** Removes the stored curated-fields draft for a park or ride. */
export function clearCuratedDraft(scope: DraftScope): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(scope));
  } catch {
    /* see above */
  }
}
