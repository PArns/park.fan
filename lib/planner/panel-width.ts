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

/**
 * What the page keeps, whatever the stored width says.
 *
 * Measured off the header, which is the page's least compressible row: with the
 * nav and the search collapsed it still needs the lockup plus the action group,
 * 334.6 px in German and 333.9 in French. 360 leaves that its 25 px and is the
 * width below which the bar starts sliding under the panel again — which is the
 * fault this exists to prevent, one window size further down. At 768 px the
 * stored 448 becomes 408 and the bar fits; at 1024 px and up nothing is capped
 * and the panel is exactly as wide as it was dragged.
 */
export const PAGE_MIN_PX = 360;

export function clampPanelWidth(px: number): number {
  return Math.round(Math.min(Math.max(px, PANEL_WIDTH_MIN), PANEL_WIDTH_MAX));
}

/**
 * The stored width, capped so the page beside it stays usable.
 *
 * Applied in `getSnapshot` rather than at each call site, because three
 * components read this — the panel's own width, the `--planner-inset` the page
 * is padded by, and the edge tab's offset — and a cap that reached only some of
 * them would move the tab off the panel's edge.
 *
 * `PANEL_WIDTH_MIN` still wins at the bottom: between 640 px (where the panel
 * becomes a bottom sheet instead) and about 700 px there is no width that
 * satisfies both, and a panel too narrow to hold a block's name is the worse of
 * the two failures.
 */
function fitToViewport(px: number): number {
  if (typeof window === 'undefined') return px;
  return Math.max(PANEL_WIDTH_MIN, Math.min(px, window.innerWidth - PAGE_MIN_PX));
}

let width = PANEL_WIDTH_DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

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
    // The cap reads the window, so the window changing changes the answer. One
    // listener for all subscribers, installed with the first and removed with
    // the last, like the panel's minute tick.
    if (listeners.size === 1) window.addEventListener('resize', emit);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener('resize', emit);
    };
  },
  getSnapshot(): number {
    load();
    return fitToViewport(width);
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
    emit();
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
