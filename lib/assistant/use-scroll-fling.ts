'use client';

import { useEffect, useState } from 'react';

/** Pixels per millisecond to throw Parky: a fling or a held key, not a turn of the wheel. */
const FLING_SPEED = 6;
/** Once thrown he holds on while the page still moves this fast, slower scrolling included. */
const HOLD_SPEED = 0.5;
/** Slower than that for this long and he lets go. */
const SETTLE_MS = 150;
/** How long the drop back into the corner takes (`.parky-hang`'s `--parky-fall`). */
export const PARKY_FALL_MS = 700;

/** Which way a fast scroll throws Parky: carried up (`down`) or pressed flat (`up`). */
export type ParkyFling = 'down' | 'up';

/**
 * The direction the page is being flung in, fast enough to move Parky (`.parky-hang`): `down`
 * carries him up with the page, `up` presses him flat into his corner. Null once the page has all
 * but stopped for a moment, and he drops back or springs up; slower scrolling keeps him where he is.
 * The scroll position is read once a frame at most, so the listener adds no layout work of its own. Never with reduced motion, where he would not move.
 */
export function useScrollFling(enabled: boolean): ParkyFling | null {
  const [fling, setFling] = useState<ParkyFling | null>(null);
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastY = window.scrollY;
    let lastAt = performance.now();
    let frame = 0;
    let settle = 0;
    let thrown = false;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const at = performance.now();
      const speed = (y - lastY) / Math.max(at - lastAt, 1);
      // The first fast direction holds until he lets go: a hanging Parky is not squashed.
      if (Math.abs(speed) > (thrown ? HOLD_SPEED : FLING_SPEED)) {
        thrown = true;
        setFling((was) => was ?? (speed > 0 ? 'down' : 'up'));
        clearTimeout(settle);
        settle = window.setTimeout(() => {
          thrown = false;
          setFling(null);
        }, SETTLE_MS);
      }
      lastY = y;
      lastAt = at;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      setFling(null);
    };
  }, [enabled]);
  return fling;
}
