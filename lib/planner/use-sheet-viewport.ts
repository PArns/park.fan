'use client';

import { useLayoutEffect } from 'react';

/**
 * Sizes the phone sheet by what the browser shows, not by what a viewport unit says it would. The
 * sheet is fixed to the layout viewport, so whenever less is on screen (a zoom, the keyboard, an
 * in-app browser) iOS takes the difference off its top, where the grabber and the × are.
 *
 * So two numbers from `window.visualViewport` go on `<html>` while `enabled` holds:
 * `--planner-viewport`, the height on screen, which every detent in `app/globals.css` is written
 * in, and `--planner-viewport-lift`, how far the bottom of the view sits above the layout
 * viewport's. Without `visualViewport` the stylesheet's `100svh` and `0px` apply. On `<html>`
 * because the detents are declared on `:root`. The lift is measured against a fixed
 * `top: 0; bottom: 0` probe, which is the layout viewport by definition, where `innerHeight` under
 * a zoom is not in every engine.
 */
export function useSheetViewport(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);

    let frame = 0;
    const write = () => {
      frame = 0;
      const layout = probe.offsetHeight;
      // A frame not laid out answers 0, and a 0 px sheet is worse: the stylesheet's `svh` stays.
      if (layout <= 0 || viewport.height <= 0) return;
      const shown = Math.min(viewport.height, layout);
      const lift = Math.max(0, layout - viewport.offsetTop - viewport.height);
      root.style.setProperty('--planner-viewport', `${shown}px`);
      root.style.setProperty('--planner-viewport-lift', `${lift}px`);
    };
    // One write per frame: a pinch or the keyboard fires these every frame, and the probe read is a
    // layout flush.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    // Synchronously on open, so the first frame is already the right size.
    write();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    // The numbers stay on `<html>` when the sheet closes, so it animates out at its size; the next
    // open writes fresh ones first.
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      probe.remove();
    };
  }, [enabled]);
  useLayoutEffect(
    () => () => {
      document.documentElement.style.removeProperty('--planner-viewport');
      document.documentElement.style.removeProperty('--planner-viewport-lift');
    },
    []
  );
}
