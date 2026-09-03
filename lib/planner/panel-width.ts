'use client';

/**
 * How wide the desktop panel is, as a store rather than as component state.
 *
 * An external store and not `useState` for the reason `ui-store.ts` gives for
 * being one: the value has to survive the panel closing, and reading
 * `localStorage` in a render would make the first client render disagree with
 * the server's. `useSyncExternalStore` has a server snapshot for exactly this,
 * so the default is what renders on the server and the stored width arrives on
 * mount with no `setState` in an effect — which React 19 rejects outright.
 *
 * It is NOT part of the plan. The plan is a document somebody may keep for
 * months; how wide they like a panel is a preference of this browser, and
 * writing it into the plan would carry it into every export and every future
 * shape of the stored document.
 */

const KEY = 'parkfan_planner_width';

/** `max-w-md`, the width the panel had before it could be resized. */
export const PANEL_WIDTH_DEFAULT = 448;
/** Narrow enough to still hold a block's name and its figure side by side. */
export const PANEL_WIDTH_MIN = 340;
/** Past this the day grid is mostly empty canvas and the page behind is gone. */
export const PANEL_WIDTH_MAX = 900;

export function clampPanelWidth(px: number): number {
  return Math.round(Math.min(Math.max(px, PANEL_WIDTH_MIN), PANEL_WIDTH_MAX));
}

let width = PANEL_WIDTH_DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) width = clampPanelWidth(parsed);
  } catch {
    // Private mode, or storage disabled. The default is a perfectly good width.
  }
}

export const plannerPanelWidth = {
  subscribe(listener: () => void): () => void {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): number {
    load();
    return width;
  },
  /** The default, so the first client render matches the server's. */
  getServerSnapshot(): number {
    return PANEL_WIDTH_DEFAULT;
  },
  /**
   * Set the width without writing it down — what a drag calls on every frame.
   * Persisting sixty times a second would be sixty synchronous storage writes.
   */
  preview(px: number): void {
    const next = clampPanelWidth(px);
    if (next === width) return;
    width = next;
    for (const listener of listeners) listener();
  },
  /** Set it and keep it. What a release calls. */
  commit(px: number): void {
    plannerPanelWidth.preview(px);
    try {
      window.localStorage.setItem(KEY, String(width));
    } catch {
      // Nothing to do and nothing broken — the width holds for this session.
    }
  },
};
