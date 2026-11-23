/**
 * The rings a crowd calendar's tile draws for its marks (`CalendarDayTile`), shared with the keys
 * that show them, so a key draws exactly what a tile draws. In the site's accent, inside the tile:
 * it stands out on every crowd tint in both themes without reading as a crowd colour, and the grid
 * never shifts.
 */

/** The quietest day of a week, beside the star. */
export const TILE_BEST_RING = 'ring-primary ring-2 ring-inset';

/**
 * A day the visitor picked (the hub's tick): a ring a pixel stronger in the pick's own colour
 * (`--signal-pick`, fuchsia), so a choice never reads as the star's suggestion beside it.
 */
export const TILE_PICKED_RING = 'ring-signal-pick ring-[3px] ring-inset';

/**
 * The round badge behind the pick's tick, wherever it stands: the tile, the note beside the park,
 * the key and the line above the grid. The tick in the page's own background, which holds 4.5 : 1
 * on the fuchsia in the light theme and 7.9 : 1 in the dark one.
 */
export const PICK_BADGE = 'bg-signal-pick text-background';
