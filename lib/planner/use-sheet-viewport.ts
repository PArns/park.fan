'use client';

import { useLayoutEffect } from 'react';

/**
 * Sizes the phone sheet by what the browser SHOWS, not by what a viewport unit
 * says it would show.
 *
 * The sheet is `position: fixed` at the bottom of the layout viewport, and
 * every length it used to have was a viewport unit (`92svh`, `100svh`), which
 * is the layout viewport too. Whenever the part of the page on screen is
 * smaller than that box, the difference comes off the sheet — and iOS takes
 * it off the TOP, where the grabber and the × are. Three things do that on
 * a phone:
 *
 * - **A zoom.** iOS zooms in on a text field under 16 px and does not zoom back
 *   out (PAR-485), and a pinch does the same on purpose. Measured in Chromium
 *   at 390 × 844 with the page scale at 1.3: 649 px on screen, the sheet still
 *   ending at 844 — 195 px of it outside the view.
 * - **The keyboard.** It shrinks the visual viewport and leaves the layout
 *   viewport as it was, so a fixed sheet runs on underneath it, and iOS pans
 *   the view down to keep the focused field in sight.
 * - **A browser whose viewport units are not its window**: an in-app browser,
 *   a toolbar that is left out of `svh`, a split screen.
 *
 * So the sheet reads two numbers off `window.visualViewport`, kept on `<html>`
 * as custom properties for as long as `enabled` holds:
 *
 * - `--planner-viewport`: the height on screen. Every detent is written in it
 *   (`app/globals.css`), so the sheet is never taller than what can be seen.
 * - `--planner-viewport-lift`: how far the bottom of what is on screen sits
 *   above the bottom of the layout viewport — the keyboard, or the part of a
 *   zoomed page below the view. The sheet stands on it rather than on `0`.
 *
 * Both fall back to the stylesheet's `100svh` and `0px` when the browser has no
 * `visualViewport`, which is where the sheet was before.
 *
 * On `<html>` rather than on the sheet, because the detents are declared on
 * `:root` and a custom property substitutes where it is declared: set on the
 * sheet, `--planner-viewport` would change nothing that `--planner-sheet-large`
 * had already computed from the root's value. It also puts the numbers where
 * the drag's probe reads them (`cssLengthPx()` in `planner-flyout.tsx`).
 *
 * The lift is measured against a probe rather than `innerHeight`: the box a
 * fixed element's `bottom` is counted from is the layout viewport, and what
 * `innerHeight` reports under a zoom has not always been that box in every
 * engine. A fixed element spanning `top: 0` to `bottom: 0` is it by definition.
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
      // A frame that is not laid out answers 0, and a sheet 0 px tall is a
      // worse trap than the one this corrects: the stylesheet's `svh` stays.
      if (layout <= 0 || viewport.height <= 0) return;
      const shown = Math.min(viewport.height, layout);
      const lift = Math.max(0, layout - viewport.offsetTop - viewport.height);
      root.style.setProperty('--planner-viewport', `${shown}px`);
      root.style.setProperty('--planner-viewport-lift', `${lift}px`);
    };
    // One write per frame: a pinch or the keyboard sliding in fires these on
    // every frame of the gesture, and the probe read is a layout flush.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    // Synchronously on the open, so the first frame of the sheet is already
    // the right size rather than the viewport unit it corrects.
    write();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    // The numbers stay on `<html>` when the sheet closes: it animates out at
    // the size it was, where taking them off would snap it back to `svh` for
    // the length of the slide. Nothing else reads them, and the next open
    // writes fresh ones before its first frame.
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
