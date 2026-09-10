'use client';

import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { PX_PER_MIN, PX_PER_MIN_COARSE } from './day-grid';

/**
 * The `sm` breakpoint, as a media query.
 *
 * The planner has exactly one breakpoint — `sm` / `max-sm` — and this is the JS
 * half of it, written once so a second consumer cannot pick a slightly different
 * number and disagree with Tailwind. `planner-flyout.tsx` reads it for
 * `isPhone`.
 *
 * **`40rem` and never `640px`**, which is the rule `globals.css` already states
 * at length for `.pk-panel-seam-sm`: Tailwind's breakpoints are rem, so
 * `max-sm:` moves with the reader's default font size and a px query does not.
 * At 20 px / 700 px the panel would lay itself out as a phone — bottom sheet,
 * 44 px targets, the ride search instead of the drag coach — while this answered
 * `false` and handed it the desktop axis, i.e. exactly the mismatch the whole
 * scale exists to avoid, for exactly the readers who raised the default.
 */
export const PLANNER_PHONE_QUERY = '(width < 40rem)';

/**
 * How many pixels one minute of the day is worth, here and now.
 *
 * A hook rather than six `isPhone ? … : …` at the call sites, because the six
 * axes have to agree: the wizard's preview, the ride search's free-slot maths
 * and the column's own grid are all read as the same day, and two of them at
 * different scales would put 09:00 at two heights in one panel.
 *
 * `useMediaQuery`'s server snapshot is `false`, so the first render is always
 * the desktop value. That is right here and not a compromise: every consumer is
 * inside the planner panel, which is mounted on the client and never
 * server-rendered — the comment at `planner-day-column.tsx` says the same thing
 * about `isPhone` and for the same reason. The one place this is NOT true is
 * `app/[locale]/trip-planner/_demos.tsx`, which is a Client Component on a
 * server-rendered page: it gets one re-render on mount, which is what a
 * `useMediaQuery` costs anywhere, and the axis it draws is a demo rather than a
 * plan.
 */
export function usePlannerPxPerMin(): number {
  return useMediaQuery(PLANNER_PHONE_QUERY) ? PX_PER_MIN_COARSE : PX_PER_MIN;
}
