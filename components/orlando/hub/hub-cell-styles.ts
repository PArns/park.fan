/**
 * The class strings of one matrix square, shared by the matrix, the phone list's chips and the
 * legend, so the key draws exactly what the grid draws. The tint per level is the site's own
 * (`CROWD_TILE_CLASS` and `CROWD_TEXT_CLASS` in `lib/utils/crowd-level-styles.ts`); nothing here
 * maps a level to a colour.
 */

/** The square: a fixed box with the minutes centred, tabular so columns line up. */
export const HUB_CELL =
  'inline-flex items-center justify-center rounded-md border font-semibold tabular-nums leading-none';

/** The resort's shortest line that day: one ring inside the box, so the grid never shifts. */
export const HUB_CELL_BEST = 'ring-foreground/70 ring-2 ring-inset';

/** A day read off last year: the dashed edge the legend names "last year". */
export const HUB_CELL_LAST_YEAR = 'border-dashed border-foreground/45';

/**
 * The early-close mark: a small folded corner, top right, where a ticketed evening sends the day
 * guests out early. A shape, not an icon, so the square still holds only its number.
 */
export const EARLY_CLOSE_CORNER =
  'bg-foreground/60 pointer-events-none absolute top-0 right-0 size-2 rounded-tr-md [clip-path:polygon(0_0,100%_0,100%_100%)]';
