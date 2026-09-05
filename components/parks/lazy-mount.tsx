'use client';

import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import './lazy-mount.css';

/** Column counts of the shared card grid
 *  (`grid-cols-1 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3`). */
const GRID_COLUMNS = [1, 2, 3] as const;

export interface LazyMountGrid {
  /** Number of cards that will render into the grid. */
  count: number;
  /** Approximate height of one grid row in px, including the row gap. */
  rowHeight: number;
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
   * per breakpoint from the column count, so the placeholder matches what will actually be
   * rendered there.
   *
   * A single `minHeight` can't do this: it reserved the ONE-column height at every
   * breakpoint, so on a 3-column desktop a 30-card land reserved roughly three times the
   * space the cards end up taking — the page scrolled far too long and the scrollbar visibly
   * jumped the moment the section mounted.
   */
  grid?: LazyMountGrid;
  /** Mount immediately, skipping the observer (e.g. the first/above-the-fold block, or while searching). */
  eager?: boolean;
  className?: string;
}

/** Reserved height for `columns` columns of the grid. */
function reservedHeight({ count, rowHeight, headerHeight = 0 }: LazyMountGrid, columns: number) {
  return headerHeight + Math.ceil(count / columns) * rowHeight;
}

/**
 * Defers mounting heavy below-the-fold content until it nears the viewport, then keeps it
 * mounted (no unmount → no scroll jank, no lost state). On long pages this slashes the initial
 * DOM node count and the layout/paint/compositing cost — e.g. a big park's attraction grid
 * renders 100+ glass cards (each with backdrop-blur + sparkline), which Lighthouse flags as an
 * excessive DOM and which dominates mobile rendering time. SSR/SEO are unaffected: the grid is
 * already client-rendered, so the server payload never contained these nodes anyway.
 *
 * The observer uses a generous rootMargin so a section mounts ~1.5 screens before it scrolls
 * into view — the swap happens off-screen, below the fold, so the user never sees a placeholder.
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
