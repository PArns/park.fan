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
