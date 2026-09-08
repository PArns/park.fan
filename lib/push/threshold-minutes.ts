import { roundWaitTo5 } from '@/lib/utils/wait-time';

/**
 * Pure logic for the ride-alert threshold field, kept out of
 * `components/push/threshold-minutes-input.tsx` (which has JSX in it, and so
 * cannot be imported by a plain Node test script) so `parseThresholdMinutes`
 * stays independently testable — see `scripts/test-threshold-minutes.mjs`.
 */

/** A person watches for a wait dropping below this many minutes. */
export const DEFAULT_THRESHOLD_MIN = 20;
/** The API's actual floor — see `CreateRideAlertDto` — kept for parsing/validation only. */
export const MIN_THRESHOLD_MIN = 1;
export const MAX_THRESHOLD_MIN = 240;
/** The slider's own step. */
export const THRESHOLD_STEP_MIN = 5;
/**
 * The slider's practical floor — a wait-time alert under ten minutes is not
 * a useful one — and, doubling as the native `<input min>` in
 * `ThresholdMinutesInput` rather than {@link MIN_THRESHOLD_MIN}, its grid's
 * anchor too. A browser snaps a range input's value to `min + k·step`
 * regardless of who set it (dragging, arrow keys, or the initial `value`
 * prop): anchored at `MIN_THRESHOLD_MIN` (1) the grid would be 1, 6, 11, 16,
 * 21, ... — not one of the round numbers this feature actually produces (20,
 * 30, 45 from `defaultThresholdFor`; 240 = {@link MAX_THRESHOLD_MIN} itself).
 * Anchored here at 10 with a step of 5 the grid is exactly 10, 15, ..., 240,
 * which both of those land on ((240 − 10) is a whole multiple of the step).
 */
export const THRESHOLD_SLIDER_MIN = 10;

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

/**
 * Where the slider starts for a ride the visitor has not already set an
 * alert for: ten minutes under what the queue reads right now, not a flat
 * {@link DEFAULT_THRESHOLD_MIN} that means nothing next to a ride at 80
 * minutes or one at 10. A live reading is always a multiple of five (parks
 * post them that way — `roundWaitTo5`'s own docstring), so subtracting ten
 * keeps the result on the slider's five-minute grid without a second round.
 * Falls back to the flat default with nothing to anchor on — closed, out of
 * season, or never reported. Floored at {@link THRESHOLD_SLIDER_MIN}, not
 * {@link MIN_THRESHOLD_MIN} — a value below the slider's own floor would
 * just get silently bumped back up to it the moment the input mounts, so
 * returning it here would be a starting point the slider cannot actually
 * start at.
 */
export function defaultThresholdFor(currentWaitTime: number | null | undefined): number {
  if (currentWaitTime == null) return DEFAULT_THRESHOLD_MIN;
  const target = roundWaitTo5(currentWaitTime) - 10;
  return Math.min(MAX_THRESHOLD_MIN, Math.max(THRESHOLD_SLIDER_MIN, target));
}
