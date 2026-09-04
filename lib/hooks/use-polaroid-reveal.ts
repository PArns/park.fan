'use client';

import { useEffect, useRef } from 'react';

/**
 * The polaroid stack settling onto the planner page.
 *
 * Follows the same three rules `use-menu-reveal.ts` arrived at, for the same
 * reasons:
 *
 * - **CSS owns the final state, GSAP owns the motion.** Every card's resting
 *   rotation and position is a CSS transform written by the component. The
 *   timeline animates `y` and `rotation` FROM an offset TO that resting state,
 *   so a failed chunk, a blocked import or a `prefers-reduced-motion` visitor
 *   gets the stack exactly as it is meant to end up — never an empty box that
 *   JavaScript forgot to reveal, and never a fade that could strand at
 *   `opacity: 0`.
 * - **Nothing here touches a backdrop.** No element in this stack carries
 *   `backdrop-blur`, so there is no glass to flatten — but the rule is worth
 *   restating, because a polaroid over a frosted card is an obvious next idea
 *   and it would go flat for the length of the animation.
 * - **It cannot cost layout shift.** The cards are absolutely positioned inside
 *   a box whose height is fixed by the component, so the reveal moves ink and
 *   never geometry.
 *
 * The chunk is fetched on mount of the page that uses it and shared with the
 * header's reveal, which has usually already fetched it.
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
