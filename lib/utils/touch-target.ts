/**
 * A 44 × 44 px target below `sm` for a control whose box has to stay smaller: a centred
 * pseudo-element grows instead of the control, so the layout does not move (the pattern
 * `FavoriteStar` uses). 44 px is the button scale's phone tier. `w-full` keeps a wide control's
 * target full width, `min-w-11` lifts a narrow one; the `relative` it adds means it must not go
 * on an `absolute` or `fixed` element. Not for list rows: overlapping targets go to the later one.
 */
export const PHONE_HIT_AREA =
  'relative max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11 max-sm:after:w-full max-sm:after:min-w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-[""]';
