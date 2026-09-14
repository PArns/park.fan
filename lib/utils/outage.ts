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

/**
 * The same steps, but outward — down for the lower end of a range, up for the upper.
 *
 * A quartile pair is an uncertainty window, so the displayed one has to CONTAIN the measured one:
 * rounding both ends to nearest can narrow it, and on a narrow enough pair it can collapse the two
 * ends onto the same number, at which point there is no range left to print. Widening cannot do
 * either, and it never claims less spread than was measured.
 */
function floorOutageMinutes(minutes: number): number {
  return Math.max(STEP, Math.floor(minutes / STEP) * STEP);
}

function ceilOutageMinutes(minutes: number): number {
  return Math.max(STEP, Math.ceil(minutes / STEP) * STEP);
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
  const from = floorOutageMinutes(remaining.p25);
  const p75 = remaining.p75;
  if (typeof p75 !== 'number' || !Number.isFinite(p75)) return { from, to: null };
  // Ordered on the RAW quartiles, never on the rounded ones: rounding decides how a window is
  // printed and may not decide whether it has a top at all. Quartiles are ordered by
  // construction, so an inversion means the payload is wrong — and an open range is at least
  // true, where „2:00 Std. bis 1:55 Std." reads as a typo.
  if (p75 < remaining.p25) return { from, to: null };
  // At least one step wide, because a range whose two ends print the same number is not a range —
  // „meist noch 5 Min. bis 5 Min." Outward rounding can only collapse them when the quartiles are
  // effectively the same value (both inside one five-minute bucket and on its edges, or both
  // under the one-step floor), so the extra step is never narrower than what was measured.
  return { from, to: Math.max(ceilOutageMinutes(p75), from + STEP) };
}

/**
 * The right-hand end of the scale the remaining window is drawn against, in minutes.
 *
 * Fixed, never per instance. A park page can draw several of these bars at once, and a bar scaled
 * to its own window would make the ride that is nearly back look exactly like the one that is not
 * — the trap `Sparkline`'s `yMax` prop exists for. Four hours because that is what the measured
 * windows fit in: of the ten outages running on 2026-09-14, five carried a curve, and the four
 * with a resolved upper quartile ran 25-180, 15-59, 10-63 and 20-220 minutes.
 */
export const OUTAGE_BAR_HORIZON_MIN = 240;

/**
 * Hour marks inside the track, drawn as hairlines in both variants.
 *
 * Unlabelled on purpose: the two ends of the scale are named beside the track, and three more
 * labels between them is a row of five on a 360 px card. Evenly spaced marks between „jetzt" and
 * „4 Std." are read as hours without being told.
 */
export const OUTAGE_BAR_TICKS_MIN = [60, 120, 180];

/**
 * Narrowest segment that still reads as a segment, in percent of the track.
 *
 * A ten-minute window on a four-hour scale is 4 % wide, which is two pixels on a card and looks
 * like a rendering fault rather than a short outage. The floor widens it to the right, so a
 * segment is never drawn starting earlier than it was measured.
 *
 * Exported because the open-end fade has to respect it: a gradient that turns transparent partway
 * along the segment takes the guaranteed width back, and nothing in the geometry can see that.
 */
export const OUTAGE_MIN_SEGMENT_PCT = 5;
const MIN_SEGMENT_PCT = OUTAGE_MIN_SEGMENT_PCT;

export interface OutageRemainingBar {
  /** Left edge, percent of the track. */
  startPct: number;
  /** Right edge, percent of the track. */
  endPct: number;
  /**
   * The window's top is not on this scale — either no upper quartile resolved, or it resolved
   * past {@link OUTAGE_BAR_HORIZON_MIN}. Drawn as a fading edge rather than a cap; the sentence
   * above the bar still carries the number when there is one.
   */
  openEnd: boolean;
}

/**
 * Where the remaining window sits on the fixed scale, as two percentages.
 *
 * Geometry lives here rather than in the component for the same reason `weather-chart-axis` does:
 * it is arithmetic with edge cases, and a green build shows nothing of it.
 *
 * **A window that cannot be drawn a full segment wide gets no bar at all.** Its segment would be
 * a sliver pinned to the right edge, identical for „noch 5 Std." and „noch 40 Std." — the scale
 * cannot show that window, so it does not draw it and the sentence stands alone. The long outages
 * are where this bites: Revenge of the Mummy sat at `p25: 117` after 2648 operating minutes, which
 * is still inside the scale, but a lower quartile above four hours is reachable from there.
 *
 * The refusal is measured against the SEGMENT, not against the horizon, because the widening floor
 * below only ever pushes an edge to the right and the right edge is already at the wall: a lower
 * quartile of 235 minutes is under the horizon, passes a `from >= horizon` test, and then draws
 * two percent of track — the degenerate case one step below the threshold that was supposed to
 * catch it.
 */
export function outageRemainingBar(
  window: OutageRemainingWindow | null | undefined
): OutageRemainingBar | null {
  if (!window) return null;

  const startPct = (window.from / OUTAGE_BAR_HORIZON_MIN) * 100;
  if (startPct > 100 - MIN_SEGMENT_PCT) return null;

  const openEnd = window.to === null || window.to > OUTAGE_BAR_HORIZON_MIN;
  const endPct = openEnd ? 100 : (window.to! / OUTAGE_BAR_HORIZON_MIN) * 100;

  return {
    startPct,
    endPct: Math.min(100, Math.max(endPct, startPct + MIN_SEGMENT_PCT)),
    openEnd,
  };
}

/** Which of the two probability sentences a surface gets, with the figure it prints. */
export interface OutageRecoveryLine {
  /** A key under `parks.outage.estimate`. */
  key: 'recovery' | 'recoveryOnly';
  percent: number;
}

/**
 * Whether the recovery probability is said at all, and in which of its two sentences.
 *
 * Three inputs decide it and every one of them is a rule rather than a layout, which is why the
 * answer is computed here: the branch that used to live in the component got it wrong on its first
 * write, silently, with a green build and a passing suite behind it.
 *
 * - **A card beside a range says nothing about the probability.** The compact block sits in a ride
 *   card's badge row, and every card in that grid row inherits the height its widest sentence
 *   wraps to. One statement per card; the range is the one a visitor came for.
 * - **The long sentence is the ride page's.** „Von Störungen, die schon so lange dauern …" names
 *   the condition the whole estimate rests on and costs a line to do it. A card that has no range
 *   to print still gets the short form.
 * - **No percentage, no line.** `outageRecoveryPercent` withholds a rounded zero, and „0 %" beside
 *   a meter drawn at zero width would read as „never".
 */
export function outageRecoveryLine(
  percent: number | null,
  variant: 'compact' | 'full',
  hasRange: boolean
): OutageRecoveryLine | null {
  if (percent === null) return null;
  if (variant === 'compact' && hasRange) return null;
  return { key: variant === 'full' && !hasRange ? 'recoveryOnly' : 'recovery', percent };
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
