/**
 * Pure logic for the ride-alert threshold field, kept out of
 * `components/push/threshold-minutes-input.tsx` (which has JSX in it, and so
 * cannot be imported by a plain Node test script) so `parseThresholdMinutes`
 * stays independently testable — see `scripts/test-threshold-minutes.mjs`.
 */

/** A person watches for a wait dropping below this many minutes. */
export const DEFAULT_THRESHOLD_MIN = 20;
export const MIN_THRESHOLD_MIN = 1;
export const MAX_THRESHOLD_MIN = 240;

/**
 * Whether `raw` is a whole number of minutes the API will actually accept —
 * see `CreateRideAlertDto` (`@IsInt() @Min(1) @Max(240)`).
 *
 * `null` covers an empty field, not just a bad one — a cleared `<input
 * type="number">` reports `''`, and `Number('')` is `0`, a value that reads
 * as "valid" to anything checking `typeof value === 'number'` but is not one
 * the visitor typed. Kept as a string in the caller's own state for exactly
 * this reason: a `number` state cannot tell "cleared" apart from "typed 0".
 */
export function parseThresholdMinutes(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return value >= MIN_THRESHOLD_MIN && value <= MAX_THRESHOLD_MIN ? value : null;
}
