'use client';

import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { PX_PER_MIN, PX_PER_MIN_COARSE } from './day-grid';

/**
 * What the planner means by "phone", as a media query: the JS half of the one switch, whose CSS
 * half is `planner-phone:` / `planner-wide:` in `app/globals.css`, kept side by side there.
 *
 * `40rem`, never `640px`: Tailwind's breakpoints are rem and move with the reader's default font
 * size. The height term catches a landscape phone, and asks `(pointer: coarse)` so a desktop window
 * dragged flat stays wide, since the phone branch makes the panel modal and stops cards being
 * dragged onto the axis. See
 * docs/features/trip-planner.md#the-axis-has-a-phone-scale-and-it-comes-from-one-place.
 */
export const PLANNER_PHONE_QUERY = '(width < 40rem), (height < 31.25rem) and (pointer: coarse)';

/**
 * A landscape phone, as a media query: the one size the sheet draws in two columns. A refinement of
 * {@link PLANNER_PHONE_QUERY}, so everything matching it is also a phone; it adds room for the
 * day's chrome beside the axis. The CSS half is `planner-landscape:` in `app/globals.css`, with the
 * same rem numbers. `useMediaQuery`'s `false` server snapshot is right, as the panel is
 * client-only.
 */
export const PLANNER_LANDSCAPE_QUERY =
  '(width >= 35.5rem) and (height < 31.25rem) and (pointer: coarse)';

/**
 * How many pixels one minute of the day is worth, here and now: one hook, so every axis in the
 * panel reads the same day at the same scale. The first render is the desktop value, which is
 * right because the panel is client-only; the trip-planner page's demos re-render once on mount.
 */
export function usePlannerPxPerMin(): number {
  return useMediaQuery(PLANNER_PHONE_QUERY) ? PX_PER_MIN_COARSE : PX_PER_MIN;
}
