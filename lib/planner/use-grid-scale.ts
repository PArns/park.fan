'use client';

import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { PX_PER_MIN, PX_PER_MIN_COARSE } from './day-grid';

/**
 * What the planner means by "phone", as a media query.
 *
 * The planner has exactly one switch, and this is the JS half of it, written
 * once so a second consumer cannot pick a slightly different number and disagree
 * with the CSS. `planner-flyout.tsx` reads it for `isPhone`; the CSS half is
 * `planner-phone:` / `planner-wide:` in `app/globals.css`, and the two are kept
 * literally side by side there.
 *
 * **`40rem` and never `640px`**, which is the rule `globals.css` already states
 * at length for `.pk-panel-seam-sm`: Tailwind's breakpoints are rem, so
 * `planner-wide:` moves with the reader's default font size and a px query does
 * not. At 20 px / 700 px the panel would lay itself out as a phone — bottom
 * sheet, 44 px targets, the ride search instead of the drag coach — while this
 * answered `false` and handed it the desktop axis, i.e. exactly the mismatch the
 * whole scale exists to avoid, for exactly the readers who raised the default.
 *
 * **And a second term, on the HEIGHT**, because a width breakpoint cannot see a
 * landscape phone: 844x390 is the same device and the same thumb as 390x844, but
 * 844 is over `sm`, so this answered `false` and the panel drew the desktop
 * arrangement into a 390 px tall window. Measured on `main` @ `9e37710a`: the
 * time axis got **16 px** of a 448x390 side panel, all sixteen of them under the
 * optimize row. `or`, not `and` — a phone held either way is a phone.
 *
 * `31.25rem` is 500 px at the default size, which clears a 390 px landscape
 * phone by 110 px and leaves a 1512x982 laptop on the wide side. See PAR-76 and
 * the note above `@variant planner-phone` for the measurements.
 *
 * **The height term asks the POINTER too, and the width term does not.** A short
 * window is not by itself a phone: 1440x480 is a desktop browser somebody
 * dragged flat, and the height term alone caught it and handed it the phone
 * branch — which on this panel means `modal`, and `modal` kills the one gesture
 * the planner is deliberately non-modal for (drag a ride card off the park page
 * onto the axis). A landscape phone answers `(pointer: coarse)`, that window
 * does not, and the width term needs no such guard because 390 px of width on a
 * fine pointer wants the narrow arrangement anyway.
 */
export const PLANNER_PHONE_QUERY = '(width < 40rem), (height < 31.25rem) and (pointer: coarse)';

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
