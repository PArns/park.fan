'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

interface LazyMountProps {
  children: ReactNode;
  /**
   * Reserved placeholder height (px) shown before the content mounts, so the page's scroll
   * length stays stable and nothing above the fold shifts when sections below mount in.
   */
  minHeight: number;
  /** Mount immediately, skipping the observer (e.g. the first/above-the-fold block, or while searching). */
  eager?: boolean;
  className?: string;
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
export function LazyMount({ children, minHeight, eager = false, className }: LazyMountProps) {
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
  return <div ref={ref} style={{ minHeight }} aria-hidden className={className} />;
}
