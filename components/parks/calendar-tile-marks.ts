/**
 * The rings a crowd calendar's tile draws for its marks (`CalendarDayTile`), shared with the keys
 * that show them, so a key draws exactly what a tile draws. In the site's accent, inside the tile:
 * it stands out on every crowd tint in both themes without reading as a crowd colour, and the grid
 * never shifts.
 */

/** The quietest day of a week, beside the star. */
export const TILE_BEST_RING = 'ring-primary ring-2 ring-inset';

/** A day the visitor picked (the hub's tick): the same ring, a pixel stronger. */
export const TILE_PICKED_RING = 'ring-primary ring-[3px] ring-inset';
