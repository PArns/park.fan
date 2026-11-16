'use client';

import { useEffect, useState } from 'react';
import { isScrollKey } from '@/lib/utils/scroll-when-settled';
import { parkyStill } from './parky/motion';
import {
  FlingTracker,
  SETTLE_MS,
  type FlingHand,
  type FlingHandAt,
  type ParkyFling,
} from './fling-tracker';

/** How long the drop back into the corner takes (`.parky-hang`'s `--parky-fall`). */
export const PARKY_FALL_MS = 700;

// Passive, so none of them can hold up the scroll; capture, so a handler that stops propagation
// cannot hide the hand from Parky.
const LISTEN = { capture: true, passive: true } as const;

/**
 * The direction a hard scroll has thrown Parky in (`.parky-hang`, decided by {@link FlingTracker}):
 * `down` carries him up with the page, `up` presses him flat into his corner. Null once the page
 * has all but stopped for a moment, and he drops back or springs up; slower scrolling keeps him
 * where he is. The scroll position is read once a frame at most, so the listener adds no layout work
 * of its own. Never with reduced motion, where he would not move.
 */
export function useScrollFling(enabled: boolean): ParkyFling | null {
  const [fling, setFling] = useState<ParkyFling | null>(null);
  useEffect(() => {
    if (!enabled || parkyStill()) return;
    const tracker = new FlingTracker();
    let viewport = window.innerHeight;
    let hand: FlingHandAt | null = null;
    let frame = 0;
    let settle = 0;
    const letGo = () => {
      tracker.letGo();
      setFling(null);
    };
    const by = (kind: FlingHand) => () => {
      hand = { kind, at: performance.now() };
    };
    // A press on the page's own scrollbar lands on `<html>`, and nothing reports the drag that
    // follows, so the hand counts as there until the button is let go.
    let dragging = false;
    const onBar = by('bar');
    const read = () => {
      frame = 0;
      if (dragging) onBar();
      const state = tracker.read(performance.now(), window.scrollY, viewport, hand);
      if (!state.fling) return;
      setFling(state.fling);
      if (!state.holding) return;
      clearTimeout(settle);
      settle = window.setTimeout(letGo, SETTLE_MS);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onWheel = by('wheel');
    const onTouch = by('touch');
    const onScrollKey = by('key');
    const onKey = (event: KeyboardEvent) => {
      if (isScrollKey(event)) onScrollKey();
    };
    const onPress = (event: PointerEvent) => {
      dragging = event.target === document.documentElement;
      if (dragging) onBar();
      // A press anywhere else, on a link say, ends it, so the new page's jump to its top is a jump.
      else if (hand?.kind === 'bar') hand = null;
    };
    const onRelease = () => {
      if (dragging) onBar();
      dragging = false;
    };
    const onResize = () => {
      viewport = window.innerHeight;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, LISTEN);
    window.addEventListener('touchmove', onTouch, LISTEN);
    window.addEventListener('keydown', onKey, LISTEN);
    window.addEventListener('pointerdown', onPress, LISTEN);
    window.addEventListener('pointerup', onRelease, LISTEN);
    window.addEventListener('pointercancel', onRelease, LISTEN);
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel, LISTEN);
      window.removeEventListener('touchmove', onTouch, LISTEN);
      window.removeEventListener('keydown', onKey, LISTEN);
      window.removeEventListener('pointerdown', onPress, LISTEN);
      window.removeEventListener('pointerup', onRelease, LISTEN);
      window.removeEventListener('pointercancel', onRelease, LISTEN);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      letGo();
    };
  }, [enabled]);
  return fling;
}
