'use client';

import { useEffect, useRef } from 'react';

interface HeaderRevealOptions {
  /** Hero pages only — everywhere else the bar is solid from the first frame. */
  enabled: boolean;
  /** True once the bar has solidified (scrolled past the threshold). */
  solid: boolean;
}

type Timeline = {
  play: () => void;
  reverse: () => void;
  kill: () => void;
};

/**
 * The bar's contents settling in as the header solidifies, and lifting back out as it goes
 * transparent again.
 *
 * The CSS crossfade underneath is deliberately tuned and is NOT replaced here: `backdrop-filter`
 * is kept out of its transition list, because animating it re-rasterized the blur of the whole
 * page behind the bar on every frame — by far the most expensive repaint on a hero page, repeated
 * on every direction change. This only layers a stagger on top of it.
 *
 * Rules this follows, all of them learned the hard way:
 *
 * - **CSS owns visibility, GSAP owns motion.** The timeline animates `y` and never `opacity`.
 *   The class-driven fade stays the source of truth, so a failed chunk or a blocked import means
 *   a plain fade with everything visible — never a header that JavaScript forgot to reveal.
 * - **Nothing animates the `<header>` itself.** It carries `backdrop-blur-md`, and a transform or
 *   an opacity on it would make it a backdrop root for as long as the animation ran — the bar
 *   would lose its blur exactly while it is fading in. Only its contents move.
 * - **One timeline, played and reversed.** It is not re-run per scroll. Crossing the 50 px
 *   threshold plays it; crossing back reverses it. Repeated crossings therefore continue the
 *   same motion from wherever it currently is instead of restarting a flourish, which is what
 *   made the earlier version fidget.
 *
 * Cost: the GSAP chunk is fetched the first time a hero page is scrolled past the threshold.
 * Non-hero pages pass `enabled: false` and never pay for it.
 */
export function useHeaderReveal({ enabled, solid }: HeaderRevealOptions) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<Timeline | null>(null);
  /** The live scroll state, readable from the import's `then` — the visitor can cross the
      threshold again while the chunk is still in flight. */
  const solidRef = useRef(solid);
  useEffect(() => {
    solidRef.current = solid;
  }, [solid]);

  useEffect(() => {
    if (!enabled || !solid || tlRef.current) return;
    const root = navRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-header-stagger]'));
    if (targets.length === 0) return;

    let cancelled = false;
    import('gsap')
      .then(({ gsap }) => {
        if (cancelled) return;
        const tl = gsap.timeline({ paused: true }).fromTo(
          targets,
          { y: -10 },
          {
            y: 0,
            duration: 0.45,
            ease: 'power3.out',
            stagger: 0.045,
            // The from-state is written the moment the timeline is built, which is safe because
            // it is only ever built at the instant the bar solidifies on a hero page — the
            // contents are still at opacity 0 there, so the offset is never seen as a jump.
            immediateRender: true,
          }
        );
        tlRef.current = tl;
        if (solidRef.current) tl.play();
        else tl.reverse();
      })
      .catch(() => {
        // The CSS fade already showed them; there is nothing to recover.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, solid]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (solid) tl.play();
    else tl.reverse();
  }, [solid]);

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  return navRef;
}
