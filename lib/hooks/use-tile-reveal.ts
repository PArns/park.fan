'use client';

import { useEffect, useRef } from 'react';

/**
 * Motion for the entry-tile rows (the park page's tabs, the ride page's chapter row) settling in
 * once on mount, under the same rules as `use-menu-reveal.ts`. CSS owns visibility and GSAP only
 * animates `y`, so the row is there without JavaScript and never stranded at `opacity: 0`. The
 * targets are the tiles' contents (`[data-tile-stagger]`), never the `backdrop-blur` tile or the
 * row, because a transform there flattens the glass while it runs. Not re-run on a tab click: a
 * flourish on navigation people click repeatedly is fidget.
 */

type Gsap = typeof import('gsap').gsap;

/** One import across every hook that animates — the header's, the menu's and this one. */
let gsapPromise: Promise<Gsap | null> | null = null;
function loadGsap(): Promise<Gsap | null> {
  gsapPromise ??= import('gsap').then((m) => m.gsap).catch(() => null); // The row already works without it; there is nothing to recover.
  return gsapPromise;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Returns a ref for an entry-tile row whose `[data-tile-stagger]` children slide up 6 px in a GSAP
 * stagger once on mount; nothing runs under reduced motion.
 */
export function useTileReveal<T extends HTMLElement>() {
  const rowRef = useRef<T>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || prefersReducedMotion()) return;

    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !gsap || !rowRef.current) return;
      const targets = Array.from(
        rowRef.current.querySelectorAll<HTMLElement>('[data-tile-stagger]')
      );
      if (targets.length === 0) return;
      gsap.fromTo(
        targets,
        { y: 6 },
        {
          y: 0,
          duration: 0.28,
          ease: 'power2.out',
          stagger: 0.02,
          // Safe in a way it would not be for opacity: the from-state is a 6px offset, so the
          // worst a half-applied tween can do is leave a label sitting slightly low.
          immediateRender: true,
          // Hand the transform back so the tiles are not left as composited layers — and so a
          // `hover:` transform on a tile is not fighting an inline style GSAP left behind.
          clearProps: 'transform',
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return rowRef;
}
