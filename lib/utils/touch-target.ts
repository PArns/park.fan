/**
 * A 44 × 44 px target below `sm` for a control whose box has to stay smaller.
 *
 * 44 px is the phone tier of the button scale (`components/ui/button.tsx`). A control that grows
 * its own box to reach it moves whatever it sits in: a 22 px badge becomes a 44 px line, and a
 * link under a list grows the panel by the difference. This grows a pseudo-element instead,
 * centred on the control — the finger gets 44 px, the layout does not move. `FavoriteStar` does
 * the same with its own classes; this is that pattern for the park page's other small controls.
 *
 * `w-full` keeps a wide control's target as wide as the control; `min-w-11` lifts a narrow one to
 * 44. The control gets `relative` so the pseudo-element is placed against it, which is why this
 * must not go on an element that is itself `absolute` or `fixed`.
 *
 * Where two targets are closer than 44 px apart their pseudo-elements overlap and the later one
 * in the DOM takes the overlap. That is the case for rows in a list, which is why list rows do
 * not use this.
 */
export const PHONE_HIT_AREA =
  'relative max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11 max-sm:after:w-full max-sm:after:min-w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-[""]';
