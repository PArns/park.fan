'use client';

import { useEffect, useRef } from 'react';

/**
 * Staggers the header's contents in the first time the bar solidifies.
 *
 * The header already cross-fades from transparent to solid in CSS, and that crossfade is
 * deliberately tuned (`backdrop-filter` is kept out of the transition list — animating it
 * re-rasterized the blur of the whole page behind the bar on every frame). None of that is
 * replaced here. This only adds a one-off flourish on top:
 *
 * - **CSS stays the source of truth.** GSAP animates `y` and sets `opacity` inline for the
 *   duration of the tween, then `clearProps` hands both back to the class-driven fade. If the
 *   chunk never loads, or the visitor asked for reduced motion, the header behaves exactly as
 *   it did before.
 * - **Once per page, not once per scroll.** The 50 px threshold is crossed every time the
 *   visitor scrolls back up and down again; re-running the stagger there would turn the header
 *   into a fidget. The ref latches after the first run.
 * - **Nothing is hidden up front.** The tween starts from the state the elements are already
 *   in, so there is no frame where JS has hidden something it might fail to reveal.
 *
 * Cost: the GSAP chunk is fetched the first time a hero page is scrolled past 50 px. Non-hero
 * pages never call this with `active`, so they never pay for it.
 */
export function useHeaderReveal(active: boolean) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    const root = navRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-header-stagger]'));
    if (targets.length === 0) return;

    played.current = true;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    import('gsap')
      .then(({ gsap }) => {
        if (cancelled) return;
        ctx = gsap.context(() => {
          gsap.from(targets, {
            opacity: 0,
            y: -6,
            duration: 0.4,
            ease: 'power2.out',
            stagger: 0.05,
            clearProps: 'all',
          });
        }, root);
      })
      .catch(() => {
        // The CSS fade already showed them; there is nothing to recover.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [active]);

  return navRef;
}
