'use client';

/**
 * How wide the desktop panel is, as an external store rather than component state: it survives the
 * panel closing, and the server snapshot is the default, so the stored width arrives on mount with
 * no `setState` in an effect. A preference of this browser, not part of the plan.
 */

const KEY = 'parkfan_planner_width';

/** `max-w-md`, the width the panel had before it could be resized. */
export const PANEL_WIDTH_DEFAULT = 448;
/** Narrow enough to still hold a block's name and its figure side by side. */
export const PANEL_WIDTH_MIN = 340;
/** Past this the day grid is mostly empty canvas and the page behind is gone. */
export const PANEL_WIDTH_MAX = 900;

/**
 * What the page keeps, whatever the stored width says: the header's least compressible row needs
 * about 335 px, and below 360 the bar slides under the panel again.
 */
export const PAGE_MIN_PX = 360;

/** Rounds a planner panel width and clamps it to 340–900 px. */
export function clampPanelWidth(px: number): number {
  return Math.round(Math.min(Math.max(px, PANEL_WIDTH_MIN), PANEL_WIDTH_MAX));
}

/**
 * The stored width, capped so the page beside it stays usable. Applied in `getSnapshot`, since the
 * panel's width, the page's `--planner-inset` and the edge tab's offset all read it.
 * `PANEL_WIDTH_MIN` still wins where both cannot hold: a panel too narrow for a block's name is the
 * worse failure.
 */
function fitToViewport(px: number): number {
  if (typeof window === 'undefined') return px;
  return Math.max(PANEL_WIDTH_MIN, Math.min(px, (viewport ?? window.innerWidth) - PAGE_MIN_PX));
}

let width = PANEL_WIDTH_DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

/**
 * The window's width, read on subscribe and on each resize, never in `getSnapshot`: React calls
 * that during every render, and `window.innerWidth` forces style and layout on a dirty document.
 * `null` while nobody listens. See docs/rules/no-has-selector-in-the-stylesheet.md ("Layout reads
 * in a store").
 */
let viewport: number | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function onResize(): void {
  viewport = window.innerWidth;
  emit();
}

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) width = clampPanelWidth(parsed);
  } catch {
    // Private mode, or storage disabled: the default is a good width.
  }
}

/** The panel width as an external store: snapshots, a live preview and a stored commit. */
export const plannerPanelWidth = {
  subscribe(listener: () => void): () => void {
    load();
    listeners.add(listener);
    // The cap reads the window, so one resize listener, installed with the first subscriber and
    // removed with the last.
    if (listeners.size === 1) {
      viewport = window.innerWidth;
      window.addEventListener('resize', onResize);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener('resize', onResize);
        viewport = null;
      }
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
  /** Set the width without storing it, for every frame of a drag. */
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
      // The width holds for this session.
    }
  },
};
