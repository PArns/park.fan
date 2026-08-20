/**
 * Crash protection for the curated-fields editor.
 *
 * The form lived entirely in component state, and there are five ordinary ways
 * to leave it: the tab strip on the entity page (which unmounts the editor to
 * show the photos), a sidebar link, the command palette, the account menu, and
 * a reload. Only the `g`-chord was guarded, which is the one an operator is
 * least likely to hit by accident. So somebody who typed six corrections, then
 * clicked "Bilder" to check whether the park had a photo, lost all six with no
 * prompt and no way back.
 *
 * A saved draft covers all five plus the browser's back button and a crash,
 * which no navigation-interception can. Modelled on the blog editor's
 * autosave, down to the version guard and the best-effort try/catch: this is
 * a safety net, and a safety net that throws is worse than none.
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

export function clearCuratedDraft(scope: DraftScope): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(scope));
  } catch {
    /* see above */
  }
}
