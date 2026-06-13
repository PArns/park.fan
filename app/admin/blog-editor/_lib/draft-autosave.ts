import type { Locale } from '@/i18n/config';
import type { LocaleDraft } from './types';

/**
 * Crash protection for the editor. The whole working state (per-locale
 * drafts + which post is being edited) is snapshotted into localStorage on a
 * debounce; closing the tab, a crash or an accidental navigation no longer
 * eats an hour of writing. The snapshot is cleared after a successful save
 * (the PR is the durable copy from then on) and when the author explicitly
 * discards it.
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

export function clearDraftSnapshot(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
