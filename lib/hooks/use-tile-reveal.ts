'use client';

import { useEffect, useRef } from 'react';

/**
 * Motion for the entry-tile rows — the park page's tabs and the ride page's chapter row settling
 * in once on mount.
 *
 * Same three rules `use-menu-reveal.ts` arrived at, and the middle one is why this hook exists at
 * all rather than a class on the tile:
 *
 * - **CSS owns visibility, GSAP owns motion.** The tween animates `y` and nothing else. The tiles
 *   are in the document and visible with no JavaScript at all, so a failed chunk, a blocked
 *   import or a `prefers-reduced-motion` visitor gets a row that is simply there. There is no
 *   fade for the same reason as the menu: an `opacity: 0` from-state that is written without its
 *   tween following leaves the navigation invisible, and this row IS the navigation.
 * - **Nothing touches the glass.** Every tile carries `backdrop-blur-md`. A transform on that
 *   element — or on any ancestor — makes it a backdrop root for as long as the animation runs,
 *   so the blur would go flat exactly while somebody watches the row appear. The targets are
 *   therefore the tile's CONTENTS (`[data-tile-stagger]`, the icon chip and the label), never the
 *   tile box and never the row.
 * - **No ScrollTrigger.** The row sits at the top of the page; it is on screen when the page is.
 *
 * The stagger runs over chips and labels in DOM order, so it reads as a wave crossing the row
 * rather than each tile popping as a unit — at 6 px and 20 ms it is a settle, not an entrance.
 *
 * Cost: the GSAP chunk is fetched on mount, and it is the same module the header's reveal already
 * shares. A visitor who prefers reduced motion never imports it.
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
