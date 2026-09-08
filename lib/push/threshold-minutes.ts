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
 * The slider's practical floor, and — doubling as the native `<input min>` in
 * `ThresholdMinutesInput` rather than {@link MIN_THRESHOLD_MIN} — its grid's
 * anchor. A browser snaps a range input's value to `min + k·step` regardless
 * of who set it (dragging, arrow keys, or the initial `value` prop): anchored
 * at `MIN_THRESHOLD_MIN` (1) the grid would be 1, 6, 11, 16, 21, ... — not
 * one of the round numbers this feature actually produces. Anchored here at 5
 * with a step of 5 the grid is 5, 10, 15, ..., and every {@link
 * maxThresholdFor} lands on it, since that one subtracts ten from an already
 * five-rounded reading.
 *
 * It was ten, on the reasoning that an alert under ten minutes is not a
 * useful one. That collided with the cap: a ride queueing fifteen minutes
 * caps at five, so a floor of ten left the slider with a max under its own
 * min. Five is what makes both rules hold at once, and "tell me when this is
 * a walk-on" is a real thing to ask for.
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
 *
 * With a reading it is {@link maxThresholdFor} exactly, i.e. the slider opens
 * at the top of its own track. That is not a coincidence to tidy away: the
 * cap is "the least demanding alert that is not already true", which is also
 * the sensible thing to offer somebody first. Dragging goes down from there.
 */
export function defaultThresholdFor(currentWaitTime: number | null | undefined): number {
  if (currentWaitTime == null) return DEFAULT_THRESHOLD_MIN;
  return maxThresholdFor(currentWaitTime);
}

/**
 * How far up the slider may go for a ride queueing `currentWaitTime` right
 * now — ten minutes UNDER that reading, not the flat {@link
 * MAX_THRESHOLD_MIN}.
 *
 * The alert fires when the queue falls below the threshold, so any threshold
 * at or above what the queue reads today is already true: picking 240 on a
 * ride sitting at 110 files an alert that is satisfied in the same second it
 * is saved. Everything from the current reading upward is not a choice, it
 * is a no-op with a slider in front of it, and it was two thirds of the
 * track. The ten-minute margin is the same one {@link defaultThresholdFor}
 * uses, and for the same reason: a queue drifts by five minutes without
 * meaning anything, so "below what it says right now" would fire on noise.
 *
 * The reading is rounded first because a live wait time is always a multiple
 * of five (parks post them that way — see `roundWaitTo5`), which keeps the
 * result on the slider's own grid without a second round.
 *
 * With no reading to work from — closed, out of season, or never reported —
 * the cap is the API's own maximum: there is nothing to say the visitor is
 * wrong, and refusing to guess beats capping against a number we do not have.
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
