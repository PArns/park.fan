import { MIN_BAND_PX, blockBoxFor, heightFor, yFor, type DayGrid } from './day-grid';
import type { PlannerEstimate } from './estimate';
import type { PlannerEntry } from './types';

/**
 * How the band leaves off: full at the queue's end, gone at its own. A one-sided spread is a
 * likelihood running out, so a hard edge would claim certainty at its least sure minute.
 */
export const BAND_FADE = 'linear-gradient(to bottom, black 0%, transparent 100%)';

/** Where a block's uncertainty band is drawn on the axis. */
export interface BlockBand {
  /** Top edge on the axis: the minute the queue itself ends. */
  top: number;
  height: number;
}

/**
 * Where a block's uncertainty band is drawn, in the axis's own pixels.
 *
 * Not in `planner-block.tsx`: the band hangs past the block into the next gap, so it is drawn in
 * its own layer under every block and leg (see `planner-day-grid.tsx`), since a block's lane
 * `z-index` makes it a stacking context. A tail from the block's lower edge to the end of the
 * spread, not a slab behind the block.
 *
 * `null` for a free block (a duration, not a forecast), a ticked-off or live one (a measurement), a
 * block with no figure, and a model that reported no spread (`null` is not a band of width zero).
 * Under `MIN_BAND_PX` a band is an antialiasing artefact, so none either.
 */
export function bandGeometry(
  grid: DayGrid,
  entry: PlannerEntry,
  estimate: PlannerEstimate,
  options: { live?: boolean } = {}
): BlockBand | null {
  if (entry.custom || entry.done || options.live) return null;

  const wait = estimate.wait;
  if (wait === null) return null;

  const minutes = estimate.uncertaintyMinutes;
  if (minutes === null) return null;

  const height = heightFor(grid, minutes);
  if (height < MIN_BAND_PX) return null;

  // From the drawn box, not the queue's end: a short queue's box is floored taller than the queue,
  // and a band starting inside it would be hidden behind the block.
  return { top: yFor(grid, entry.startMinute) + blockBoxFor(grid, wait), height };
}
