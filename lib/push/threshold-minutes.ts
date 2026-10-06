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
 * The slider's practical floor and its native `<input min>`: a browser snaps a range input to
 * `min + k·step`, so anchored at {@link MIN_THRESHOLD_MIN} the grid would be 1, 6, 11; at 5 it is
 * 5, 10, 15 and every {@link maxThresholdFor} lands on it. Five, not ten, because a ride queueing
 * fifteen minutes caps at five, and "tell me when this is a walk-on" is a real request.
 */
export const THRESHOLD_SLIDER_MIN = 5;

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
 * Where the slider starts for a ride without an alert yet: {@link maxThresholdFor}, ten minutes
 * under the current reading and the least demanding alert that is not already true. Without a
 * reading (closed, out of season, never reported) it is the flat {@link DEFAULT_THRESHOLD_MIN}.
 */
export function defaultThresholdFor(currentWaitTime: number | null | undefined): number {
  if (currentWaitTime == null) return DEFAULT_THRESHOLD_MIN;
  return maxThresholdFor(currentWaitTime);
}

/**
 * How far up the slider may go: ten minutes under the current reading. The alert fires when the
 * queue falls below the threshold, so anything at or above today's reading is already true, and
 * a queue drifts by five minutes without meaning anything. The reading is rounded to five first
 * (Disney's 13-minute walk-on gives 3, which the floor lifts to 5). Without a reading the cap is
 * the API's own maximum.
 */
export function maxThresholdFor(currentWaitTime: number | null | undefined): number {
  if (currentWaitTime == null) return MAX_THRESHOLD_MIN;
  const target = roundWaitTo5(currentWaitTime) - 10;
  return Math.min(MAX_THRESHOLD_MIN, Math.max(THRESHOLD_SLIDER_MIN, target));
}

/**
 * Whether a wait-time alert can say anything at all about this ride today.
 *
 * The cap is ten minutes under the current reading, so once the queue itself
 * is down to ten there is nothing left to promise: the alert would have to
 * fire at zero minutes or less, which is not a queue anybody is waiting in.
 * The bell hides rather than opening a dialog whose slider has no legal
 * position — the same rule `ShowFollowBell` applies when a performance is
 * too close to warn anybody about.
 *
 * Unknown reads as usable: a ride with no live number may well have one in
 * an hour, and hiding the control there would take the alert away from
 * exactly the closed ride somebody wants to be told about.
 */
export function hasUsableThresholdRange(currentWaitTime: number | null | undefined): boolean {
  if (currentWaitTime == null) return true;
  // Against the UNCLAMPED target, not `maxThresholdFor`: that one floors its
  // answer at `THRESHOLD_SLIDER_MIN` so the slider always gets a legal `max`,
  // which would make every reading down to zero look usable here.
  return roundWaitTo5(currentWaitTime) - 10 > 0;
}
