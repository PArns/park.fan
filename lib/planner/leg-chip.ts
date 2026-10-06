/**
 * Where the chip between two blocks goes, and how big it may be. Pure and in its own file because
 * it once broke with a green build: the gap a reader sees is not the gap between two queues, since
 * a short queue's box is drawn taller and hangs into it. See
 * docs/features/trip-planner.md#and-it-is-drawn-in-the-gap-a-reader-can-see-not-in-the-gap-between-two-queues.
 */

/**
 * The chip's height, rendered rather than estimated: `text-[10px]` on `px-1.5 py-0.5` inside a 1 px
 * border is 21 px in all six languages at both scales. `check:planner` reads the rendered chip.
 */
export const LEG_CHIP_PX = 21;

/**
 * The chip that is left when 21 px do not fit: minutes and verdict only. 12 px, the smallest drawn
 * gap a planned day produces, so the outline is an inset ring (a shadow, no height) rather than a
 * border. The type is not what gives way.
 */
export const LEG_CHIP_COMPACT_PX = 12;

/** Where a leg's chip goes and which size it is drawn at. */
export interface LegChipPlacement {
  /** Pixels from the leg element's own top edge to the chip's top edge. */
  topPx: number;
  /** Whether the short chip is the one to draw. */
  compact: boolean;
  /** The gap it was placed in: drawn bottom of the block above to the top of the next. */
  roomPx: number;
}

/**
 * Place the chip in the gap a reader can actually see.
 *
 * `legPx` is the leg's own height, from queue end to the next start; `overhangPx` is how far the
 * block above is drawn below that top edge (`drawnBoxPx` minus the queue's height). The difference
 * is the room, which decides size and position. `fixedSize` keeps the repair button on a broken leg
 * at 21 px, since it is a target, not a label.
 *
 * A room smaller than the chip centres the chip on it, the one degradation that picks no side. A
 * day somebody dragged can reach that; a day this app planned does not.
 */
export function legChipPlacement(
  legPx: number,
  overhangPx: number,
  fixedSize = false
): LegChipPlacement {
  // Never negative in practice; clamped, because a negative would move the chip up into the block
  // above.
  const overhang = Math.max(0, overhangPx);
  const roomPx = legPx - overhang;
  const compact = !fixedSize && roomPx < LEG_CHIP_PX;
  const chipPx = compact ? LEG_CHIP_COMPACT_PX : LEG_CHIP_PX;
  return { topPx: overhang + (roomPx - chipPx) / 2, compact, roomPx };
}
