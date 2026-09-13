import { MIN_BAND_PX, heightFor, yFor, type DayGrid } from './day-grid';
import type { PlannerEstimate } from './estimate';
import type { PlannerEntry } from './types';

/**
 * How the band leaves off: full at the queue's end, gone at its own.
 *
 * A one-sided spread is not a duration with an end, it is a likelihood running
 * out, so the tail is drawn as one — and a slab that stops dead would claim its
 * hardest edge at exactly the minute it is least sure of.
 */
export const BAND_FADE = 'linear-gradient(to bottom, black 0%, transparent 100%)';

export interface BlockBand {
  /** Top edge on the axis: the minute the queue itself ends. */
  top: number;
  height: number;
}

/**
 * Where a block's uncertainty band is drawn, in the axis's own pixels.
 *
 * It lives here rather than in `planner-block.tsx` because the band is the one
 * part of a block that is NOT in the block: it hangs past the box, into the gap
 * the next stop starts in, so it is drawn in a layer of its own underneath
 * every block and every leg (see the band layer in `planner-day-grid.tsx`). A
 * child of the block cannot be under those, whatever z-index it carries — the
 * block's own `z-index` for its lane makes it a stacking context, so the band
 * was pinned above the leg chip that describes the very gap it hangs in.
 * Measured with `elementFromPoint` at the centre of every chip on a planned
 * Phantasialand day: nine of nine were painted by somebody's band.
 *
 * It is a TAIL — from the end of the queue to the end of the spread — and not a
 * slab behind the whole block. Run from the top it painted the queue's own
 * pixels a second time under the fill, and a headliner's band is as long again
 * as its queue (29 minutes on Taron, 36–38 on F.L.Y. and the two Winja's), so a
 * planned day came out as one unbroken orange column with the blocks somewhere
 * inside it.
 *
 * `null` is the whole of the rule about which blocks have one:
 *
 * - a FREE block is a duration the visitor wrote down, not a forecast;
 * - a TICKED-OFF one is a measurement, and a measurement has no spread;
 * - a block showing a LIVE standby reading reports the queue standing in front
 *   of somebody right now, which is likewise not a prediction;
 * - a block with no figure has nothing to be uncertain about;
 * - and a model that reported no spread does not get a band of width zero.
 *   `uncertaintyMinutes: null` means "no spread was reported", which is a
 *   different statement and may not be drawn as one.
 *
 * The `MIN_BAND_PX` floor is the last of them: under three pixels a band is an
 * antialiasing artefact on the block's own lower border rather than a band.
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

  return { top: yFor(grid, entry.startMinute) + heightFor(grid, wait), height };
}
