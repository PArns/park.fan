import type { AttractionOutage, OutageEstimate } from '@/lib/api/types';

/**
 * Reading the running-outage block, in one place, for the two surfaces that draw it.
 *
 * `OutageNote` and `OutageEstimateNote` render the same outage on a park page's ride card and in
 * the ride page's live panel, and every rule below used to live inline in one of them. They are
 * here because the rules are about the PAYLOAD rather than about either layout — what an absent
 * quartile means, which figures may be rounded, when a percentage stops being a statement — and a
 * rule that lives in a component is a rule the second component gets wrong.
 */

const STEP = 5;

/**
 * Five-minute steps, the resolution everything on this site is displayed at.
 *
 * Floored at one step rather than at zero: all three figures this is used on (elapsed, and the two
 * remaining quartiles) describe a span that is happening, and „0 Min." is not a shorter way of
 * saying „a few minutes" — it reads as „over". `roundWaitTo5` deliberately does floor to zero,
 * which is right for a queue length and wrong here.
 */
export function roundOutageMinutes(minutes: number): number {
  return Math.max(STEP, Math.round(minutes / STEP) * STEP);
}

/** The remaining-time window, already rounded. `to: null` is an open range, not a missing one. */
export interface OutageRemainingWindow {
  from: number;
  /** `null` = the upper quartile did not resolve, so the range has no top. */
  to: number | null;
}

/**
 * How much longer outages that have got this far usually take.
 *
 * **The upper quartile can be missing in two shapes and both mean the same thing.** Past roughly
 * two hours elapsed it stops resolving; the type says `p75: number | null`, and what the API
 * actually sends is a `remaining` object with no `p75` key at all — measured 2026-09-09 on three
 * of the ten outages running at the time (Revenge of the Mummy at 2648 elapsed minutes,
 * `{"p25":117,"median":460}`). A `=== null` test therefore fell through to the two-ended range and
 * formatted `undefined`, so those three rides rendered „meist noch 1:55 Std. bis NaN:NaN Std." on
 * the card and again on the ride page. Anything that is not a finite number is the open range.
 */
export function outageRemainingWindow(
  estimate: OutageEstimate | undefined
): OutageRemainingWindow | null {
  const remaining = estimate?.remaining;
  if (!remaining || !Number.isFinite(remaining.p25)) return null;
  const from = roundOutageMinutes(remaining.p25);
  const p75 = remaining.p75;
  if (typeof p75 !== 'number' || !Number.isFinite(p75)) return { from, to: null };
  const to = roundOutageMinutes(p75);
  // Quartiles are ordered by construction, so this only fires if the payload is wrong. An
  // inverted range would read as a typo; an open one is at least true.
  return to > from ? { from, to } : { from, to: null };
}

/**
 * P(reported running again within 60 more operating minutes), in whole five-point steps.
 *
 * Five, because the curve is calibrated out-of-sample to 2.55 percentage points and „47 %" claims
 * a precision it does not have. A rounded 0 comes back as `null`: it would read as „never", a
 * claim the curve does not make — the thinnest measured bucket is still 8.5 %.
 */
export function outageRecoveryPercent(estimate: OutageEstimate | undefined): number | null {
  if (!estimate || !Number.isFinite(estimate.recoveryWithin60)) return null;
  const percent = Math.round((estimate.recoveryWithin60 * 100) / STEP) * STEP;
  return percent > 0 ? percent : null;
}

/**
 * How long the ride has been down, in the only clock this may be answered on.
 *
 * `estimate.elapsedMinutes` is **operating** minutes and is never `now - startedAt`: an outage
 * that began at 18:00 in a park that shut at 20:00 reads two hours the next morning, not sixteen,
 * and the recovery curve beside it is conditioned on exactly this figure. Deriving a duration from
 * `startedAt` instead would put two different answers to one question on the same card.
 *
 * Two absences, both deliberate:
 *
 * - **No `estimate`** — no curve could answer, which includes a park that publishes no opening
 *   hours. Without an opening clock there is no operating minute to count, so there is no number
 *   to show and none is invented.
 * - **`startObserved: false`** — the outage was already running at the edge of the seven-day
 *   window, so `startedAt` is the oldest reading rather than the onset. Every elapsed figure built
 *   on it is a lower bound, and a bound rendered as a duration reads as a measurement. The
 *   sentence beside it already says „Beginn unbekannt"; this stays out of it.
 */
export function outageElapsedMinutes(outage: AttractionOutage | undefined): number | null {
  if (!outage?.startObserved) return null;
  const elapsed = outage.estimate?.elapsedMinutes;
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed <= 0) return null;
  return roundOutageMinutes(elapsed);
}
