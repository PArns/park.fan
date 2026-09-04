/**
 * How long a wait-time bar is drawn, and how far its uncertainty band reaches.
 *
 * Geometry only, so it can be tested without a browser — the scale decision below
 * is the kind that looks right on the one day you happen to open and wrong on
 * half the catalogue.
 */

/**
 * Shortest full-scale value, in minutes.
 *
 * A day's bars are scaled to that day's own longest wait, so a quiet day reads
 * as quiet rather than as a row of stubs. But scaling a 15-minute day to full
 * width would draw a walk-on as a maximum, so the scale never drops below this:
 * on a quiet day the bars stay visibly short, and only once something crosses an
 * hour does the day start using its full width.
 */
export const MIN_FULL_SCALE = 60;

/** Never wider than the track, however long a queue gets. */
const MAX_FRACTION = 1;

export interface BarGeometry {
  /** Fraction of the track the solid bar covers, 0–1. */
  fill: number;
  /**
   * Fraction the uncertainty band reaches to, 0–1. Equals `fill` when there is
   * no band. The band is one-sided upward by construction: the model's number is
   * its median and the width is its top quantile minus that median, so there is
   * no lower edge to draw.
   */
  bandTo: number;
  /** True when a band exists and is wide enough to be worth drawing. */
  hasBand: boolean;
}

/**
 * The scale a day's bars share.
 *
 * One scale for the whole day, not per bar: the point of a timeline is that two
 * entries can be compared, and a bar fitted to its own value makes a 20-minute
 * queue look like a 90-minute one.
 */
export function dayScale(waits: readonly (number | null)[]): number {
  let max = 0;
  for (const wait of waits) {
    if (typeof wait === 'number' && wait > max) max = wait;
  }
  return Math.max(MIN_FULL_SCALE, max);
}

export function barGeometry(
  wait: number | null,
  uncertaintyMinutes: number | null,
  scale: number
): BarGeometry {
  if (wait === null || !Number.isFinite(wait) || scale <= 0) {
    return { fill: 0, bandTo: 0, hasBand: false };
  }

  const fill = Math.min(MAX_FRACTION, Math.max(0, wait) / scale);

  // Null is "the model reported no spread", which is not a band of width zero.
  // Drawing one anyway would put a confident hairline on the least certain rows.
  if (uncertaintyMinutes === null || !Number.isFinite(uncertaintyMinutes)) {
    return { fill, bandTo: fill, hasBand: false };
  }

  const bandTo = Math.min(MAX_FRACTION, Math.max(0, wait + uncertaintyMinutes) / scale);

  // A band thinner than a hair reads as a rendering artefact rather than as
  // uncertainty. Below half a percent of the track it is not drawn at all.
  const hasBand = bandTo - fill >= 0.005;

  return { fill, bandTo, hasBand: hasBand && uncertaintyMinutes > 0 };
}
