'use client';

import { useEffect, type RefObject } from 'react';
import { scrollWhenSettled } from '@/lib/utils/scroll-when-settled';

/**
 * Keeping the entry-tile row where it is when a visitor walks from one park page to another.
 *
 * The row is the park's navigation and it is rendered on every page of the park — the same six
 * cells in the same order, deliberately, so that park → calendar → park feels like one site. It
 * did not feel like one, and the reason was the scroll: the calendar is a PAGE, so following its
 * cell is a navigation, and a navigation goes to the top of the document. A visitor who had
 * scrolled the row up to read it lost it on the way out and got it back somewhere else on the way
 * in — and the way in was worse, because the park page's hash router then smooth-scrolled the row
 * to 100 px, so one click cost a jump to the top plus an animation back down. Every time, in both
 * directions, and the row a visitor was pointing at is the one thing on the page that is
 * guaranteed to be identical on the other side of the click.
 *
 * So the row's position is handed over rather than recomputed. The cell records where the row sat
 * in the VIEWPORT at the moment of the click, the two scroll-to-top mechanisms are told to stand
 * down, and the row on the destination page corrects itself back to that offset — a few pixels at
 * most, because both pages build the row into the same shell and only the H1 above it differs.
 *
 * Standing the scroll down takes THREE calls, not one, and each answers a different piece of code:
 * `scroll={false}` on the link is the router's; `suppressScrollToTopFor()` is this app's own
 * `ScrollToTop`, which exists because the router's handler bails out whenever the new page's top
 * element is already in the viewport and therefore never fires here; and `hasTileRowHandoff()` is
 * how `useTabHashRouting` knows not to run its deep-link scroll on arrival. Miss any one of them
 * and the row still ends up somewhere the visitor did not put it.
 *
 * A module-level variable rather than `sessionStorage`, because these are App Router client
 * navigations and the module outlives them. A hard navigation (middle-click, a reload, an address
 * bar) finds nothing here and gets exactly the behaviour it had before, which is the right
 * fallback: a visitor arriving cold has no position to keep.
 *
 * Nothing consumes the record — it expires instead, and that is what makes it survive React's
 * development double-mount. A version that cleared it in the effect's cleanup restored nothing at
 * all: StrictMode runs setup, cleanup, setup, so the first mount ate the handoff and the second
 * found an empty slot. An age is also the honest test of what the record is for. It describes one
 * click; if the destination has not rendered within `MAX_HANDOFF_AGE_MS` the visitor has long
 * stopped expecting the page to remember anything.
 */
interface TileRowHandoff {
  /** The park it was recorded on. A handoff is only ever redeemed on the same park. */
  park: string;
  /** The row's `getBoundingClientRect().top` at the moment the visitor left. */
  top: number;
  /** `performance.now()` at the click — monotonic, and the document is the same one. */
  at: number;
}

/** How long a recorded position stays worth restoring. Covers a cold route fetch with room over;
 *  past it the visitor is looking at a page they have been reading for a while. */
const MAX_HANDOFF_AGE_MS = 5000;

let handoff: TileRowHandoff | null = null;

/** Marker attribute on the row, so a cell can find it without a ref. */
export const TILE_ROW_ATTR = 'data-park-tile-row';

/** The record, if there is a live one for this park. Expired ones are dropped as they are read. */
function liveHandoff(park: string): TileRowHandoff | null {
  if (!handoff) return null;
  if (handoff.park !== park) return null;
  if (performance.now() - handoff.at > MAX_HANDOFF_AGE_MS) {
    handoff = null;
    return null;
  }
  return handoff;
}

/**
 * Record the row's position, from a cell inside it, on the way out.
 *
 * The row is found by walking up from the cell rather than threaded down as a ref: the cells are
 * built in two different components (`ParkTabsList`, `ParkNavTiles`) and both render them inside
 * `ParkTileGrid`, which is the element that carries the marker and the one that gets restored.
 */
export function rememberTileRow(cell: HTMLElement | null, park: string) {
  const row = cell?.closest<HTMLElement>(`[${TILE_ROW_ATTR}]`);
  handoff = row ? { park, top: row.getBoundingClientRect().top, at: performance.now() } : null;
}

/**
 * Did this page arrive from a cell of the row — i.e. is the row's position already spoken for?
 *
 * `useTabHashRouting` asks once, on mount. Only then, because a `hashchange` arriving later (the
 * header panel's show rows aim at `#map-show-<slug>`) is a visitor asking to be taken somewhere,
 * and that scroll must still happen.
 */
export function hasTileRowHandoff(park: string): boolean {
  return liveHandoff(park) !== null;
}

/** Restore the row to the offset it was left at, on the page it was handed to. */
export function useTileRowAnchor(rowRef: RefObject<HTMLElement | null>, park: string) {
  useEffect(() => {
    const record = liveHandoff(park);
    if (!record) return;
    // Instant, and there is nothing to see: the row is already within a few pixels of where it
    // was, because nothing scrolled on the way here. What this corrects is the difference between
    // the two pages' headings — and then keeps correcting, because the panel above the row fills
    // in from client queries and would otherwise push the row down under the visitor.
    return scrollWhenSettled(() => rowRef.current, { offset: record.top, smooth: false });
  }, [rowRef, park]);
}
