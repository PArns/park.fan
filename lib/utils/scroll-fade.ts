/**
 * The far edge of a row that scrolls sideways, faded over its last 2rem, so a chip or tab cut by
 * the edge reads as a row to swipe rather than as a fault. The `pr-8` under the fade lets the last
 * item scroll clear of it.
 */
export const SCROLL_FADE_X =
  '[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] pr-8';

/** The same at the foot of a pane that scrolls down: a row cut by its edge reads as more below. */
export const SCROLL_FADE_Y =
  '[mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)] pb-8';
