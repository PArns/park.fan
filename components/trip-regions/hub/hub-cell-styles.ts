/**
 * The class strings of the hub calendar's marks, shared by the week grid, the phone list and the
 * legend, so the key draws exactly what the grid draws. The tile itself is the crowd calendar's
 * (`CalendarDayTile`). The tint per level is the site's own
 * (`CROWD_TILE_CLASS` and `CROWD_TEXT_CLASS` in `lib/utils/crowd-level-styles.ts`); nothing here
 * maps a level to a colour.
 */

/** The legend's small tile: a fixed box with the minutes centred, in the tile's own tint. */
export const HUB_CELL =
  'inline-flex items-center justify-center rounded-md border font-semibold tabular-nums leading-none';

/** The resort's shortest line that day: one ring inside the tile, so the grid never shifts. */
export const HUB_CELL_BEST = 'ring-foreground/70 ring-2 ring-inset';

/**
 * The early-close mark: a small folded corner, top right, where a ticketed evening sends the day
 * guests out early; the tile's closing time is bold below it. A shape, not an icon, so it never
 * reads as a season's.
 */
export const EARLY_CLOSE_CORNER =
  'bg-foreground/60 pointer-events-none absolute top-0 right-0 size-2 rounded-tr-md [clip-path:polygon(0_0,100%_0,100%_100%)]';

/**
 * Which page of the calendar a column (`HUB_WEEK_CELL`) or a day of the phone's list
 * (`HUB_WEEK_ITEM`) is on, shown by the `data-week` of the `group/week` around it. Every day is in
 * the served HTML, and paging changes that one attribute instead of rendering the days again.
 * Literal strings, so Tailwind sees them: six pages, past the 31 days a window holds.
 */
export const HUB_WEEK_CELL = [
  'hidden group-data-[week=0]/week:table-cell',
  'hidden group-data-[week=1]/week:table-cell',
  'hidden group-data-[week=2]/week:table-cell',
  'hidden group-data-[week=3]/week:table-cell',
  'hidden group-data-[week=4]/week:table-cell',
  'hidden group-data-[week=5]/week:table-cell',
] as const;

/** {@link HUB_WEEK_CELL} for a day of the phone's list. */
export const HUB_WEEK_ITEM = [
  'hidden group-data-[week=0]/week:block',
  'hidden group-data-[week=1]/week:block',
  'hidden group-data-[week=2]/week:block',
  'hidden group-data-[week=3]/week:block',
  'hidden group-data-[week=4]/week:block',
  'hidden group-data-[week=5]/week:block',
] as const;
