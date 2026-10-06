import type { AttractionOutage, OutageEstimate } from '@/lib/api/types';
import { parkDayOf } from '@/lib/utils/park-day';

/**
 * Reading the running-outage block for the two surfaces that draw it (`OutageNote` and
 * `OutageEstimateNote`). The rules are about the payload, not the layout, so they live here where
 * both components share them.
 */

const STEP = 5;

/**
 * Rounds an outage figure to five-minute steps, floored at one step rather than zero.
 * Every figure this rounds describes a span that is still happening, and „0 Min." reads as „over";
 * `roundWaitTo5` floors to zero, which is right for a queue and wrong here.
 */
export function roundOutageMinutes(minutes: number): number {
  return Math.max(STEP, Math.round(minutes / STEP) * STEP);
}

/**
 * The same steps, rounded outward (down for the lower end, up for the upper), so the displayed
 * quartile window always contains the measured one and never collapses to a single number.
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
 * How much longer outages that have got this far usually take, as a rounded window.
 * Past about two hours elapsed the upper quartile stops resolving, and the API then omits the
 * `p75` key instead of sending `null`; anything that is not a finite number is the open range.
 */
export function outageRemainingWindow(
  estimate: OutageEstimate | undefined
): OutageRemainingWindow | null {
  const remaining = estimate?.remaining;
  if (!remaining || !Number.isFinite(remaining.p25)) return null;
  const from = floorOutageMinutes(remaining.p25);
  const p75 = remaining.p75;
  if (typeof p75 !== 'number' || !Number.isFinite(p75)) return { from, to: null };
  // Ordered on the RAW quartiles: rounding decides how a window prints, not whether it has a top.
  // An inversion means the payload is wrong, and an open range is at least true.
  if (p75 < remaining.p25) return { from, to: null };
  // At least one step wide: a range whose two ends print the same number is not a range.
  return { from, to: Math.max(ceilOutageMinutes(p75), from + STEP) };
}

/** The recovery window on the wall clock. Instants, never durations. */
export interface OutageRecoveryClock {
  /** ISO 8601 instant, the lower quartile. */
  from: string;
  /** ISO 8601 instant, the upper quartile. `null` = the range has no top. */
  to: string | null;
  /**
   * `to` falls on a later calendar day than `from`, in the PARK's zone. The sentence has to say so,
   * or „zwischen 19:30 und 11:00 Uhr" reads as one evening.
   */
  toOnLaterDay: boolean;
}

/** How far apart two instants may be before a weekday stops naming one day. */
const WEEKDAY_HORIZON_DAYS = 7;

/**
 * Narrowest clock window that still prints as a window, in milliseconds. Quartiles can sit under a
 * minute apart, and both ends would then print the same label; one minute is the least that
 * separates two whole-minute labels, and widening only ever moves the upper end later.
 */
const MIN_CLOCK_SPREAD_MS = 60_000;

/**
 * When the outage is expected to be over, on the park's own clock.
 *
 * The duration beside it is in OPERATING minutes, so „noch 2:00 Std." near closing means tomorrow
 * morning; the API places these instants from its opening calendar and nothing here recomputes
 * them. Returns `null` (leaving the duration sentence alone) without a `recoveryWindow`, without a
 * usable park `timezone` or with an unparsable `from`. A `to` before `from`, or more than
 * {@link WEEKDAY_HORIZON_DAYS} out (a weekday then names two days), becomes an open range; a pair
 * closer than {@link MIN_CLOCK_SPREAD_MS} is widened.
 */
export function outageRecoveryClock(
  estimate: OutageEstimate | undefined,
  timezone: string | undefined
): OutageRecoveryClock | null {
  const window = estimate?.recoveryWindow;
  if (!window?.from || !timezone) return null;

  const from = new Date(window.from);
  if (Number.isNaN(from.getTime())) return null;

  // An unusable zone throws here and costs the whole clock form. Falling back to the runtime's zone
  // would make the day comparison differ between server render and hydration.
  let fromDay: string;
  try {
    fromDay = parkDayOf(from, timezone);
  } catch {
    return null;
  }

  const open: OutageRecoveryClock = { from: window.from, to: null, toOnLaterDay: false };
  if (!window.to) return open;

  const to = new Date(window.to);
  if (Number.isNaN(to.getTime()) || to.getTime() < from.getTime()) return open;
  // Judged on the RAW upper end: a minute added for legibility may not decide whether the window
  // has a top.
  if (to.getTime() - from.getTime() >= WEEKDAY_HORIZON_DAYS * 86_400_000) return open;

  // The day marker reads the widened end so label and weekday agree: 23:59:40 plus a minute prints
  // „00:00", and that is tomorrow.
  const spread = new Date(Math.max(to.getTime(), from.getTime() + MIN_CLOCK_SPREAD_MS));

  return {
    from: window.from,
    to: spread.toISOString(),
    toOnLaterDay: parkDayOf(spread, timezone) !== fromDay,
  };
}

/**
 * The right-hand end of the remaining-window bar's scale, in minutes.
 * Fixed, never per instance: a park page draws several bars, and each scaled to its own window
 * would make the ride nearly back look like the one that is not. Four hours fits the observed
 * windows.
 */
export const OUTAGE_BAR_HORIZON_MIN = 240;

/**
 * Hour marks inside the track, drawn as unlabelled hairlines; the two ends are named beside the
 * track and evenly spaced marks read as hours without labels.
 */
export const OUTAGE_BAR_TICKS_MIN = [60, 120, 180];

/**
 * Narrowest segment that still reads as a segment, in percent of the track; a ten-minute window
 * would otherwise look like a rendering fault. Exported because the open-end fade must not eat
 * into this guaranteed width.
 */
export const OUTAGE_MIN_SEGMENT_PCT = 5;
const MIN_SEGMENT_PCT = OUTAGE_MIN_SEGMENT_PCT;

/** The remaining window placed on the bar, in percent of the track. */
export interface OutageRemainingBar {
  /** Left edge, percent of the track. */
  startPct: number;
  /** Right edge, percent of the track. */
  endPct: number;
  /**
   * The window's top is off this scale (no upper quartile, or one past
   * {@link OUTAGE_BAR_HORIZON_MIN}); drawn as a fading edge rather than a cap.
   */
  openEnd: boolean;
}

/**
 * Where the remaining window sits on the fixed scale, as two percentages.
 * A window whose lower end leaves less than one full segment of track gets no bar: it would be a
 * sliver at the right edge, the same for „noch 5 Std." and „noch 40 Std.". The test is against the
 * segment, not the horizon, because widening only pushes edges right.
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
 * A compact card that already shows a range says nothing more (one statement per card keeps grid
 * rows level); the long sentence is the ride page's; and without a percentage there is no line.
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
 * P(running again within 60 more operating minutes), in five-point steps because the curve is
 * calibrated to about 2.5 points. A rounded 0 returns `null`, since „0 %" reads as „never" and the
 * curve never claims that.
 */
export function outageRecoveryPercent(estimate: OutageEstimate | undefined): number | null {
  if (!estimate || !Number.isFinite(estimate.recoveryWithin60)) return null;
  const percent = Math.round((estimate.recoveryWithin60 * 100) / STEP) * STEP;
  return percent > 0 ? percent : null;
}

/**
 * How long the ride has been down, in operating minutes. Never `now - startedAt`: an outage that
 * began two hours before closing reads two hours the next morning, and the recovery curve is
 * conditioned on this figure. `null` without an estimate (no opening clock to count against) or
 * when `startObserved` is false, because `startedAt` is then only the oldest reading.
 */
export function outageElapsedMinutes(outage: AttractionOutage | undefined): number | null {
  if (!outage?.startObserved) return null;
  const elapsed = outage.estimate?.elapsedMinutes;
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed <= 0) return null;
  return roundOutageMinutes(elapsed);
}
