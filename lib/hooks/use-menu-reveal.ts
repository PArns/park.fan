'use client';

import { useEffect, useRef } from 'react';

/**
 * Motion for the header's mega-menu band: its columns settling in when the panel opens, and the
 * detail row settling in again each time it fills with a different country.
 *
 * This follows the rules `use-header-reveal.ts` arrived at, for the same reasons, plus one that is
 * specific to the band:
 *
 * - **CSS owns visibility, GSAP owns motion.** The timeline animates `y` and never `opacity`. The
 *   panel is shown and hidden by a `hidden` class, so a failed chunk, a blocked import or a
 *   `prefers-reduced-motion` visitor gets a menu that simply appears — never one that JavaScript
 *   forgot to reveal. It is also why there is no fade: fading in from `opacity: 0` would need the
 *   from-state written before the first frame, and if that write ever happened without the tween
 *   following it the menu would open empty.
 * - **Nothing touches the glass.** The band's surface carries `backdrop-blur-xl`. A transform or an
 *   opacity on that element — or on any ancestor of it — makes it a backdrop root for as long as
 *   the animation runs, so the blur would go flat exactly while somebody is watching it appear.
 *   Everything animated here is a DESCENDANT of that surface, which leaves its backdrop alone.
 * - **The panel is out of flow**, so none of this can cost layout shift. That is not luck: it is
 *   why the band is absolutely positioned in the first place.
 *
 * Cost: the GSAP chunk is fetched the first time somebody opens a menu, and shared with the
 * header's own reveal. Nobody who never opens the menu pays for it.
 */

type Timeline = { restart: () => void; kill: () => void };
type Gsap = typeof import('gsap').gsap;

/** One import for both hooks and for however many panels the bar has. */
let gsapPromise: Promise<Gsap | null> | null = null;
function loadGsap(): Promise<Gsap | null> {
  gsapPromise ??= import('gsap').then((m) => m.gsap).catch(() => null); // The CSS-driven menu already works; there is nothing to recover.
  return gsapPromise;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * The panel's columns lifting into place on open.
 *
 * `restart()` rather than one timeline played and reversed, which is what the header does: opening
 * a menu is a discrete event with a beginning, not a state being crossed back and forth, and
 * closing snaps because a menu that lingers on the way out is a menu in the way.
 */
export function useMenuReveal(open: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    if (tlRef.current) {
      tlRef.current.restart();
      return;
    }

    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !gsap || !rootRef.current) return;
      const targets = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>('[data-menu-stagger]')
      );
      if (targets.length === 0) return;
      tlRef.current = gsap.timeline().fromTo(
        targets,
        { y: -10 },
        {
          y: 0,
          duration: 0.4,
          ease: 'power3.out',
          stagger: 0.035,
          // Safe here in a way it would not be for opacity: the from-state is a 10 px offset, so
          // the worst a half-applied tween can do is leave a column slightly high.
          immediateRender: true,
          clearProps: 'transform',
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  return rootRef;
}

/**
 * The detail row re-settling whenever it fills with a different country.
 *
 * Deliberately shorter and flatter than the open: this fires on every country somebody rests on,
 * and a full flourish repeated down a column of 23 countries is the fidget the header's reveal
 * had to be rewritten to stop doing. It is here at all because the content genuinely changes —
 * new cities, new parks — and a row that swaps its contents with no motion reads as a glitch.
 *
 * `key` is what identifies "different content": pass the country, plus whether its data has
 * arrived, so the skeleton → cities swap animates too.
 */
export function useRowReveal(key: string | null) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!key) return;
    const row = rowRef.current;
    if (!row || prefersReducedMotion()) return;

    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !gsap || !rowRef.current) return;
      const targets = Array.from(
        rowRef.current.querySelectorAll<HTMLElement>('[data-row-stagger]')
      );
      if (targets.length === 0) return;
      gsap.fromTo(
        targets,
        { y: 6 },
        {
          y: 0,
          duration: 0.25,
          ease: 'power2.out',
          stagger: 0.02,
          immediateRender: true,
          clearProps: 'transform',
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return rowRef;
}

/**
 * The mobile sheet's rows settling in behind the panel that is sliding on.
 *
 * The burger menu is the whole navigation on a phone and it was the one menu surface with no
 * motion at all: Radix slides the panel in from the right and the eleven rows inside arrive
 * fully formed, as one block, which reads as a screenshot rather than as a menu opening. The
 * same treatment as the desktop band, tuned down — a phone shows the entire list at once, so a
 * stagger long enough to be legible on a 1400 px band is a queue on a 300 px column.
 *
 * The rules are `useMenuReveal`'s, for the same reasons: CSS (Radix's own `data-[state]`
 * animation) owns visibility, this only moves the rows along one axis and never their opacity,
 * and if the chunk never loads the sheet opens exactly as it does today. Radix unmounts the content when the sheet closes, so there is no
 * timeline to keep — this builds one per open and lets it go.
 */
export function useSheetReveal(open: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !gsap || !rootRef.current) return;
      const targets = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>('[data-sheet-stagger]')
      );
      if (targets.length === 0) return;
      // `x`, not `y`: the panel itself is travelling leftwards onto the screen, and rows that
      // arrive along the same axis read as part of that one movement instead of as a second,
      // unrelated one crossing it.
      gsap.fromTo(
        targets,
        { x: 16 },
        {
          x: 0,
          duration: 0.35,
          ease: 'power3.out',
          stagger: 0.025,
          immediateRender: true,
          clearProps: 'transform',
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return rootRef;
}
