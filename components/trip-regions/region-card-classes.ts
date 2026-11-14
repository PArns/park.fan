/**
 * The class strings a trip region's card is drawn with, wherever one stands: the header band's
 * region card and tiles (`PlannerMenuPanel`) and the planner tile on a park's pages
 * (`TripPlannerTile`). A module of plain strings, because one side is a Client Component and the
 * other a Server Component, and a constant exported from a `'use client'` file reaches a Server
 * Component as a reference, not as its value.
 */

/**
 * The card: the muted ground the scene is drawn on, a hairline ring in either theme and the
 * band's rounding. `isolate` keeps a picture's `-z-10` inside it.
 */
export const REGION_CARD =
  'group bg-muted relative isolate overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10';

/**
 * The line over the card's name, where the region is or what the card is for. `primary-ink`, not
 * `primary`: the brand blue misses AA as 11 px text on the light fade.
 */
export const REGION_KICKER = 'text-primary-ink text-[11px] font-semibold tracking-widest uppercase';

/** The cards' buttons are the site's (`buttonVariants`), drawn as pills as in the draft. */
export const REGION_PILL = 'rounded-full font-semibold';
