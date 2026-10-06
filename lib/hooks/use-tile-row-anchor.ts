'use client';

import { useEffect, type RefObject } from 'react';
import { scrollWhenSettled } from '@/lib/utils/scroll-when-settled';

/**
 * Keeps the entry-tile row where it is when a visitor walks from one park page to another. The row
 * is identical on every page of a park, but following a cell is a navigation, which goes to the
 * top. So the cell records where the row sat in the viewport, the scroll-to-top mechanisms stand
 * down, and the destination's row corrects itself back to that offset.
 *
 * Standing down takes three calls: `scroll={false}` on the link for the router,
 * `suppressScrollToTopFor()` for this app's `ScrollToTop`, and `hasTileRowHandoff()` for
 * `useTabHashRouting`'s deep-link scroll. A module variable rather than `sessionStorage`, since
 * these are client navigations; a hard navigation finds nothing. The record expires instead of
 * being consumed, so React's development double-mount cannot eat it.
 */
interface TileRowHandoff {
  /** The park it was recorded on. A handoff is only ever redeemed on the same park. */
  park: string;
  /** The row's `getBoundingClientRect().top` at the moment the visitor left. */
  top: number;
  /** The document's scroll offset at the click — see `useTileRowAnchor` for what reads it. */
  scrollY: number;
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
  handoff = row
    ? {
        park,
        top: row.getBoundingClientRect().top,
        scrollY: window.scrollY,
        at: performance.now(),
      }
    : null;
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
    // A visitor who had not scrolled has nothing to hand over: the title card above the row
    // differs in height between a park's pages, so a correction would move the page's own top.
    // The record stays, so `useTabHashRouting` still skips its scroll on arrival.
    if (record.scrollY === 0) return;
    // Instant: the row is already within a few pixels of where it was. It keeps correcting while
    // the panel above the row fills in from client queries.
    return scrollWhenSettled(() => rowRef.current, { offset: record.top, smooth: false });
  }, [rowRef, park]);
}
