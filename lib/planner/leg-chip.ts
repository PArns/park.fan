/**
 * Where the chip between two blocks goes, and how big it is allowed to be.
 *
 * Geometry, in its own file and pure, for the reason `weather-chart-axis.ts` and
 * `favorites-band-plan.ts` are: it broke once in a way a green build showed
 * nothing of. The chip hung in the middle of the gap between the END of one
 * queue and the START of the next, and that gap is not the gap a reader sees —
 * a block is drawn at `minBlockPxFor` even where its queue is shorter, so the
 * box above hangs into the space below it. Measured over 46 planned park-days
 * from `/plan/day` (267 legs, 2026-09-14): the drawn gap on the desktop axis is
 * median 16 px against 24 px between the queues, and the chip is 21 px — which
 * is how nine of nine chips on a packed Phantasialand day came out cut.
 */

/**
 * The chip's height, rendered rather than estimated.
 *
 * `text-[10px]` on `px-1.5 py-0.5` inside a 1 px border, measured in the app's
 * own stylesheet at 1440×1000 and at 390×844, in all six languages: 21.0 px
 * every time, because the height follows the type and not the words. The 18 that
 * stood here before was typed, and was three pixels under the thing it was
 * supposed to measure.
 */
export const LEG_CHIP_PX = 21;

/**
 * …and the chip that is left when 21 px do not fit: minutes and verdict only.
 *
 * 12.0 px, measured the same way, de 74 px wide and it 77 — `text-[10px]
 * leading-[12px]` on `px-1 py-0`, with the outline as a `ring-1 ring-inset`
 * rather than a border because an inset ring is a shadow and costs no height.
 * The figure it has to clear is the SMALLEST drawn gap a planned day produces,
 * and that is 12.0 px: 34 of those 267 legs, 12.7 % of them, all on the desktop
 * axis (the phone's 1.8 px per minute never goes under 18 px). A 14 px chip —
 * the same content with the border kept — would still have been cut on every one
 * of the 34.
 *
 * The type size is NOT what gives way. 9 px with the border would also measure
 * 12, and shrinking the text is a strange way to fix a chip that is hard to read.
 */
export const LEG_CHIP_COMPACT_PX = 12;

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
 * `legPx` is the leg element's own height — queue end to the next block's start
 * — and `overhangPx` is how far the block above is DRAWN below that same top
 * edge, which is `drawnBoxPx` minus the queue's own height and is zero for every
 * queue over the 16.7-minute floor. The difference between the two is the room,
 * and the room is what decides both the size and the position.
 *
 * `fixedSize` is for the repair button on a broken leg: it is a target rather
 * than a label, its text is already down to a deficit and one word, and a broken
 * leg has by definition too little room for anything. It keeps its 21 px and
 * gets the better position, which is all this can do for it.
 *
 * A room smaller than the chip leaves the chip centred on it and therefore
 * overlapping both boxes by the same amount. That does not happen on a day this
 * app plans — 12.0 px is the floor over the measured corpus and the short chip
 * is 12.0 px — but a day somebody drags themselves has no floor at all, and
 * centring is the one degradation that does not pick a side.
 */
export function legChipPlacement(
  legPx: number,
  overhangPx: number,
  fixedSize = false
): LegChipPlacement {
  // Never negative: the drawn box is never shorter than the queue it stands for.
  // Clamped anyway, because a negative would move the chip UP into the block
  // above while claiming to have found it more room.
  const overhang = Math.max(0, overhangPx);
  const roomPx = legPx - overhang;
  const compact = !fixedSize && roomPx < LEG_CHIP_PX;
  const chipPx = compact ? LEG_CHIP_COMPACT_PX : LEG_CHIP_PX;
  return { topPx: overhang + (roomPx - chipPx) / 2, compact, roomPx };
}
