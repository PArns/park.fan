'use client';

import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import './lazy-mount.css';

/** Column counts of the shared card grid
 *  (`grid-cols-1 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3`). */
const GRID_COLUMNS = [1, 2, 3] as const;

/** The card grid a `LazyMount` stands in for, so it can reserve its height per breakpoint. */
export interface LazyMountGrid {
  /** Number of cards that will render into the grid. */
  count: number;
  /** Approximate height of one grid row in px, including the row gap. */
  rowHeight: number;
  /**
   * Row height for the one-column (phone) grid, when it differs from `rowHeight` — the park
   * page's ride list lays its cards out as compact rows there (`AttractionCard`'s `phoneRow`).
   * Falls back to `rowHeight`.
   */
  phoneRowHeight?: number;
  /** Extra px above the grid (section heading etc.). */
  headerHeight?: number;
}

interface LazyMountProps {
  children: ReactNode;
  /**
   * Reserved placeholder height (px) shown before the content mounts, so the page's scroll
   * length stays stable and nothing above the fold shifts when sections below mount in.
   * Use for content that is NOT the responsive card grid — otherwise prefer `grid`.
   */
  minHeight?: number;
  /**
   * Reservation for content rendering into the responsive card grid. The height is derived
   * per breakpoint from the column count; a single `minHeight` would reserve the one-column
   * height everywhere, about three times too much on a desktop.
   */
  grid?: LazyMountGrid;
  /** Mount immediately, skipping the observer (e.g. the first/above-the-fold block, or while searching). */
  eager?: boolean;
  className?: string;
}

/** Reserved height for `columns` columns of the grid. */
function reservedHeight(
  { count, rowHeight, phoneRowHeight, headerHeight = 0 }: LazyMountGrid,
  columns: number
) {
  const row = columns === 1 ? (phoneRowHeight ?? rowHeight) : rowHeight;
  return headerHeight + Math.ceil(count / columns) * row;
}

/**
 * Defers mounting heavy below-the-fold content until it nears the viewport, then keeps it
 * mounted (no unmount → no scroll jank, no lost state). A big park's ride grid is 100+ glass
 * cards, which dominates mobile rendering time.
 *
 * It decides what the first HTML contains: below the first area, a reader without JavaScript sees
 * this placeholder, so the park's full ride list stays machine-readable through `containsPlace`
 * in the page's structured data. The generous rootMargin mounts a section well before it scrolls
 * into view, so the swap happens off-screen.
 */
export function LazyMount({ children, minHeight, grid, eager = false, className }: LazyMountProps) {
  const [shown, setShown] = useState(eager);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown || eager) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '1200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, eager]);

  if (shown || eager) return <>{children}</>;

  // Grid mode hands the per-breakpoint heights to CSS (see lazy-mount.css); inline styles
  // can't express media queries, and the column count is only known there.
  const style: CSSProperties = grid
    ? ({
        '--lm-h-1': `${reservedHeight(grid, GRID_COLUMNS[0])}px`,
        '--lm-h-2': `${reservedHeight(grid, GRID_COLUMNS[1])}px`,
        '--lm-h-3': `${reservedHeight(grid, GRID_COLUMNS[2])}px`,
      } as CSSProperties)
    : { minHeight };

  return (
    <div
      ref={ref}
      style={style}
      aria-hidden
      className={grid ? `lazy-mount-reserve${className ? ` ${className}` : ''}` : className}
    />
  );
}
