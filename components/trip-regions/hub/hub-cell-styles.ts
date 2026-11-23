/**
 * The class strings of the hub calendar's marks, shared by the week grid, the phone's week and the
 * legend, so the key draws exactly what the grid draws. The tile itself is the crowd calendar's
 * (`CalendarDayTile`). The tint per level is the site's own
 * (`CROWD_TILE_CLASS` and `CROWD_TEXT_CLASS` in `lib/utils/crowd-level-styles.ts`); nothing here
 * maps a level to a colour.
 */

import { TILE_BEST_RING, TILE_PICKED_RING } from '@/components/parks/calendar-tile-marks';

/** The legend's small tile: a fixed box with the minutes centred, in the tile's own tint. */
export const HUB_CELL =
  'inline-flex items-center justify-center rounded-md border font-semibold tabular-nums leading-none';

/** A park's quietest day of the week, beside the star: the tile's own ring, for the legend. */
export const HUB_CELL_BEST = TILE_BEST_RING;

/** A day the visitor picked for the park, beside the tick: the tile's own ring, for the legend. */
export const HUB_CELL_PICKED = TILE_PICKED_RING;

/**
 * Another park's tile on a day the visitor picked for a park: faded, so the column reads as taken
 * and the stars that moved off it make sense. Still a button, which moves the pick to this park.
 */
export const HUB_CELL_TAKEN = 'opacity-45';

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

/**
 * {@link HUB_WEEK_CELL} for a layer that keeps its place while hidden: every week's events under a
 * park stack in one grid cell, so the cell is as tall as the busiest week and turning a week moves
 * nothing below it.
 */
export const HUB_WEEK_LAYER = [
  'invisible group-data-[week=0]/week:visible',
  'invisible group-data-[week=1]/week:visible',
  'invisible group-data-[week=2]/week:visible',
  'invisible group-data-[week=3]/week:visible',
  'invisible group-data-[week=4]/week:visible',
  'invisible group-data-[week=5]/week:visible',
] as const;

/**
 * An event's bar under a park's tiles, on the days it runs: the text colour, faded. Never a crowd
 * tint, which would read as a level under the tinted tiles, and never a colour per event, since a
 * week can hold eight.
 */
export const HUB_EVENT_BAR = 'h-1.5 bg-foreground/45';

/** {@link HUB_EVENT_BAR} for an event only expected from last year's pattern: dashed. */
export const HUB_EVENT_BAR_EXPECTED =
  'h-1.5 bg-[repeating-linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_45%,transparent)_0_4px,transparent_4px_6px)]';
