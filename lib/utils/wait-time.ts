/**
 * Wait times are displayed in five-minute steps, always.
 *
 * Parks post them that way, so every raw observation in the database is already
 * a multiple of five. What breaks it is the maths on top: a percentile
 * interpolates between two stored values and an average across days blurs the
 * rest, which is how the park's hourly table came to print 51, 53 and 47 —
 * readings no park has ever put on a sign.
 *
 * The API rounds these on the way out (`roundToNearest5Minutes` in
 * `src/common/utils/wait-time.utils.ts`, same formula). This is the same rule on
 * the rendering side, so a surface is correct regardless of which API build is
 * answering and regardless of what a third-party payload contains. Rounding an
 * already-rounded value is a no-op, so applying both costs nothing.
 *
 * Round only what is DISPLAYED. Anything that feeds a comparison — a crowd
 * ratio, a ranking, the pick of a ride's peak hour — reads the raw value, or
 * five-minute buckets invent ties the data does not have.
 */
export function roundWaitTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 2.5) return 0;
  return Math.floor((n + 2.5) / 5) * 5;
}

/**
 * The same five-minute grid for a DIFFERENCE between two wait times.
 *
 * `roundWaitTo5` floors everything under 2.5 to zero, which is right for a
 * queue — there is no such thing as −15 minutes of waiting. A delta is the
 * other case, and applying the wait-time rule to it silently deleted half the
 * scale: the attraction card's trend compares the last two readings against the
 * two before them, so a queue being worked off produces a negative delta, and
 * every one of them collapsed to 0 → "stable". No ride could show a falling
 * trend at all. It was visible on the guide page itself, where Black Mamba's
 * card sat at a grey "stabil" under a caption saying its queue was shrinking.
 */
export function roundWaitDeltaTo5(value: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? -roundWaitTo5(-n) : roundWaitTo5(n);
}
