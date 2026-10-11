'use client';

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';

/**
 * How much of the viewport may lie below the slot when a block goes in for a reader who has
 * scrolled: pushing a sliver out of view scores its share of the screen, so a tenth scores about
 * 0.1 at most.
 */
const VISIBLE_SLICE = 0.1;

/**
 * At the top of the page always, anywhere else only while the slot lies below the viewport, give
 * or take VISIBLE_SLICE. The top is the exception because waiting there can mean never: on common
 * phones the homepage's slot sits inside the viewport at y = 0 (docs/features/park-compass.md has
 * the table).
 */
function mayPlace(slotTop: number): boolean {
  return window.scrollY < 1 || slotTop >= window.innerHeight * (1 - VISIBLE_SLICE);
}

/**
 * Whether a late block with no box held open for it may go into the slot `ref` marks: once
 * `ready`, the first moment its arrival moves nothing the reader is looking at. Once true it stays
 * true. A compensating `scrollBy` is still scored as a layout shift, so waiting is the only way to
 * keep a reader who has scrolled past the slot from being shoved down by it.
 */
export function usePlacedOutOfSight(ref: RefObject<HTMLElement | null>, ready: boolean): boolean {
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (!ready || placed) return;
    const el = ref.current;
    if (!el) return;
    // At most one layout read per frame. A listener rather than an IntersectionObserver, because
    // `mayPlace` also asks whether the page is back at its top.
    let frame = 0;
    const check = () => {
      frame = 0;
      if (mayPlace(el.getBoundingClientRect().top)) setPlaced(true);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref, ready, placed]);
  return placed;
}

const subscribeNever = () => () => {};
const readScrollAnchoring = () =>
  typeof CSS !== 'undefined' && CSS.supports('overflow-anchor', 'auto');

/**
 * Whether the browser keeps what the reader is looking at in place when something is inserted
 * above it (CSS scroll anchoring). Chromium and Firefox do; where it is missing, a block inserted
 * above a reader who has scrolled shoves the page down under them. `false` on the server.
 */
export function useScrollAnchoring(): boolean {
  return useSyncExternalStore(subscribeNever, readScrollAnchoring, () => false);
}
