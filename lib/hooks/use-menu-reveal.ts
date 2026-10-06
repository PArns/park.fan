'use client';

import { useEffect, useRef } from 'react';

/**
 * Motion for the header's mega-menu band: its columns settling in when the panel opens, and the
 * detail row settling again each time it fills with a different country.
 *
 * - CSS owns visibility, GSAP owns motion: the timeline animates `y`, never `opacity`, so a failed
 *   chunk or a reduced-motion visitor gets a menu that simply appears, never one stranded empty.
 * - Nothing touches the glass: a transform or opacity on the `backdrop-blur-xl` surface or an
 *   ancestor flattens the blur while it runs, so only its descendants are animated.
 * - The panel is out of flow, so none of this can cost layout shift.
 *
 * The GSAP chunk loads the first time somebody opens a menu.
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
 * The panel's columns lifting into place on open. `restart()` rather than a timeline played and
 * reversed: opening is a discrete event, and closing snaps because a menu that lingers on the way
 * out is in the way.
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
 * The detail row re-settling whenever it fills with a different country. Shorter and flatter
 * than the open, because it fires on every country somebody rests on; there at all because a row
 * that swaps its contents with no motion reads as a glitch. `key` is the country plus whether its
 * data has arrived, so the skeleton-to-cities swap animates too.
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
 * The mobile sheet's rows settling in behind the panel sliding on, tuned down from the desktop
 * band because a phone shows the whole list at once. Same rules as `useMenuReveal`, with Radix's
 * own `data-[state]` animation owning visibility. Radix unmounts the content on close, so a
 * timeline is built per open.
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
