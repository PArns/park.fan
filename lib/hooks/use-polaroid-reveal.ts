'use client';

import { useEffect, useRef } from 'react';

/**
 * The polaroid stack settling onto the planner page, under the same rules as
 * `use-menu-reveal.ts`: CSS writes each card's resting transform and GSAP only animates towards
 * it, so without JavaScript or with reduced motion the stack is exactly as it ends up; nothing
 * animated may carry `backdrop-blur`; and the cards sit in a fixed-height box, so the reveal costs
 * no layout shift.
 */

type Gsap = typeof import('gsap').gsap;

let gsapPromise: Promise<Gsap | null> | null = null;
function loadGsap(): Promise<Gsap | null> {
  // The CSS-driven stack already looks right; there is nothing to recover.
  gsapPromise ??= import('gsap').then((m) => m.gsap).catch(() => null);
  return gsapPromise;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Deals the cards in, one after another.
 *
 * Each card is tweened from 40 px below and a little further out of true than it
 * ends up, which reads as a hand laying them down rather than as a list fading
 * in. `overwrite: 'auto'` because a fast route change can mount this twice
 * before the first timeline is done.
 */
export function usePolaroidReveal() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const cards = [...root.querySelectorAll<HTMLElement>('[data-polaroid]')];
    if (cards.length === 0) return;

    let killed = false;
    let tl: { kill: () => void } | null = null;

    void loadGsap().then((gsap) => {
      if (!gsap || killed) return;
      tl = gsap.timeline().fromTo(
        cards,
        {
          y: 40,
          // Relative to whatever rotation the card already carries, so the
          // resting angle stays the component's business.
          rotation: (i: number) => (i % 2 === 0 ? -8 : 8),
          scale: 0.94,
        },
        {
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.09,
          overwrite: 'auto',
        }
      );
    });

    return () => {
      killed = true;
      tl?.kill();
    };
  }, []);

  return rootRef;
}
