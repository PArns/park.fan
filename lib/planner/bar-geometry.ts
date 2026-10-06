/**
 * How long a wait-time bar is drawn, and how far its uncertainty band reaches. Geometry only, so
 * the scale can be tested against more days than the one you happen to open.
 */

/**
 * Shortest full-scale value, in minutes: bars scale to the day's own longest wait, but never to
 * less than an hour, so a quiet day stays visibly short instead of drawing a walk-on as a maximum.
 */
export const MIN_FULL_SCALE = 60;

/** Never wider than the track, however long a queue gets. */
const MAX_FRACTION = 1;

/** How far a bar and its band reach, as fractions of the track. */
export interface BarGeometry {
  /** Fraction of the track the solid bar covers, 0–1. */
  fill: number;
  /**
   * Fraction the uncertainty band reaches to, 0–1; equals `fill` without a band. One-sided upward:
   * the figure is the model's median and the width its top quantile minus it.
   */
  bandTo: number;
  /** True when a band exists and is wide enough to be worth drawing. */
  hasBand: boolean;
}

/**
 * The scale a day's bars share: one per day, so two entries can be compared.
 */
export function dayScale(waits: readonly (number | null)[]): number {
  let max = 0;
  for (const wait of waits) {
    if (typeof wait === 'number' && wait > max) max = wait;
  }
  return Math.max(MIN_FULL_SCALE, max);
}

/**
 * Returns how far a planner wait-time bar fills its track and how far its upward uncertainty band
 * reaches, as fractions of the day's shared scale.
 */
export function barGeometry(
  wait: number | null,
  uncertaintyMinutes: number | null,
  scale: number
): BarGeometry {
  if (wait === null || !Number.isFinite(wait) || scale <= 0) {
    return { fill: 0, bandTo: 0, hasBand: false };
  }

  const fill = Math.min(MAX_FRACTION, Math.max(0, wait) / scale);

  // `null` means "no spread reported", not a band of width zero.
  if (uncertaintyMinutes === null || !Number.isFinite(uncertaintyMinutes)) {
    return { fill, bandTo: fill, hasBand: false };
  }

  const bandTo = Math.min(MAX_FRACTION, Math.max(0, wait + uncertaintyMinutes) / scale);

  // Below half a percent of the track a band reads as an artefact, so it is not drawn.
  const hasBand = bandTo - fill >= 0.005;

  return { fill, bandTo, hasBand: hasBand && uncertaintyMinutes > 0 };
}
