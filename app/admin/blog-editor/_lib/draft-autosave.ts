import type { Locale } from '@/i18n/config';
import type { LocaleDraft } from './types';

/**
 * Crash protection for the blog editor: the working state is snapshotted into localStorage on a
 * debounce, and cleared after a successful save or an explicit discard.
 */

const KEY = 'parkfan-blog-editor-draft';
const VERSION = 1;

export interface DraftSnapshot {
  v: number;
  savedAt: number;
  drafts: Partial<Record<Locale, LocaleDraft>>;
  editing: { key: string; originalSlugs: Partial<Record<Locale, string>> } | null;
  sourceLocale: Locale;
  activeLocale: Locale;
}

/** Does the snapshot contain anything worth restoring? */
export function isMeaningfulSnapshot(s: DraftSnapshot): boolean {
  return Object.values(s.drafts).some((d) => !!d && (!!d.fm.title.trim() || !!d.body.trim()));
}

/**
 * Reads the blog editor's autosaved working state (per-locale drafts, the post being edited, active
 * locales) from localStorage. Returns `null` when there is none, the version differs or it fails.
 */
export function loadDraftSnapshot(): DraftSnapshot | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftSnapshot;
    if (parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Writes the blog editor's working state to localStorage with a version and timestamp. */
export function saveDraftSnapshot(s: Omit<DraftSnapshot, 'v' | 'savedAt'>): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...s, v: VERSION, savedAt: Date.now() } satisfies DraftSnapshot)
    );
  } catch {
    /* quota / private mode — autosave is best-effort */
  }
}

/** Removes the blog editor's autosaved snapshot, after a save or an explicit discard. */
export function clearDraftSnapshot(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
