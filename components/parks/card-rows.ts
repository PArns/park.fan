/**
 * The row template for one `ParkCard` or `AttractionCard` on its own wrapper: a blog widget, a
 * post's reference cards, a hover card, a demo. Both cards are `row-span-3` + subgrid, so the
 * wrapper owns the three tracks (docs/rules/blog-spotlight-cards.md).
 *
 * Below `sm` the photo is hidden, and the middle track has to take the panels' overlap: the top
 * panel's `-mb-4` and the bottom panel's `-mt-4`. Narrower than `2rem`, the bottom panel slides
 * over the top one and covers its badge line. `minmax(220px,1fr)` keeps a card without a photo at
 * full height from `sm` up.
 */
export const STANDALONE_CARD_ROWS_CLASS =
  'grid [grid-template-rows:auto_2rem_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]';
