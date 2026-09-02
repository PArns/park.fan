/**
 * Rider-height filtering for a park's attraction list.
 *
 * A park page's height filter answers one question — "what may a person this tall
 * ride today?" — and the whole file exists so that the grid, the headliner row and
 * the panel's own "23 of 40" readout answer it with the same predicate instead of
 * three inlined comparisons.
 *
 * All heights are centimetres, the unit the API stores them in. The imperial
 * rendering is a display concern and belongs to `RiderHeight`
 * (`components/common/unit-display.tsx`), never to the filtering.
 */

/** The two rider-height limits an attraction may carry. Both are optional and both may be null. */
export interface RiderHeightLimits {
  /** Minimum rider height in cm. Null/absent = unrestricted or unknown. */
  minimumHeight?: number | null;
  /** Maximum rider height in cm (kiddie rides). */
  maximumHeight?: number | null;
}

/** Grid the derived stops are rounded onto, in cm — the unit parks post their limits in. */
export const RIDER_HEIGHT_STEP = 5;

/**
 * How far below the park's lowest limit the "clears nothing" stop sits, in cm.
 *
 * Small on purpose: it is a position to slide FROM, not a region to explore, and
 * every centimetre of it is track on which the answer cannot change.
 */
const LEAD_IN = 10;

/**
 * Whether a rider of `cm` may ride.
 *
 * An attraction with NO height data passes, the same `!== false` shape
 * {@link import('./season').isInSeason} uses and for the same reason: a missing
 * limit means nobody wrote one down, not that the ride is off limits. Hiding a
 * ride we know nothing about would make the filter quietly shorten the park.
 *
 * The upper bound counts too. It is the whole point of a kiddie ride's
 * `maximumHeight`, and a filter that ignored it would answer "yes, ride it" to a
 * 165 cm visitor standing in front of a car built for a five-year-old.
 */
export function canRideAtHeight(attraction: RiderHeightLimits, cm: number): boolean {
  if (attraction.minimumHeight != null && cm < attraction.minimumHeight) return false;
  if (attraction.maximumHeight != null && cm > attraction.maximumHeight) return false;
  return true;
}

/**
 * The distinct minimum heights a park actually enforces, ascending.
 *
 * The backbone of the slider's stops: these are the heights at which a ride
 * becomes available, and a park states them itself.
 */
export function riderHeightThresholds(attractions: readonly RiderHeightLimits[]): number[] {
  const seen = new Set<number>();
  for (const a of attractions) {
    if (a.minimumHeight != null && a.minimumHeight > 0) seen.add(a.minimumHeight);
  }
  return [...seen].sort((a, b) => a - b);
}

const ceilToStep = (n: number) => Math.ceil(n / RIDER_HEIGHT_STEP) * RIDER_HEIGHT_STEP;

/**
 * Every height the slider may be set to, ascending — and nothing else.
 *
 * The track used to be a continuous 5 cm ruler from below the park's lowest limit
 * to its highest, which spends most of its travel in places where nothing happens:
 * Toverland's limits are 80, 90, 100, 120, 125, 132 and 140, so a fifteen-position
 * track had eight positions on it that answer exactly like the position before
 * them. Dragging to 115 and watching "40 von 45" sit still is a control reporting
 * that it is broken. So the slider is a set of DETENTS, one per height at which the
 * park's own answer changes, and every step of it changes the list.
 *
 * Three kinds of stop, and the third is the one that is easy to forget:
 *
 * 1. **Each minimum the park enforces** — the height at which a ride opens up.
 * 2. **One lead-in stop, {@link LEAD_IN} cm below the lowest of them.** There has to
 *    be a position that clears nothing, or the filter cannot express "too small for
 *    every ride that has a limit" — and a slider whose thumb starts at the far left
 *    needs somewhere to be dragged FROM.
 * 3. **The first height that is too TALL for a kiddie ride**, i.e. one step above
 *    each `maximumHeight` below the top. Europa-Park's maxima are 120, 130, 135,
 *    140 and 195 against minima of 90 to 140, so without stops at 125, 135 and 140
 *    a 132 cm rider has no position to stand on that says "too tall for the teacups"
 *    — the filter would keep offering rides they cannot board. Rounded up onto the
 *    5 cm grid rather than reported as `max + 1`: 121 cm is a truthful boundary and
 *    an absurd thing to put under a slider.
 *
 * A maximum at or above the top minimum stretches nothing, which is the one rule
 * carried over from the continuous version: Europa-Park's 195 cm ceiling would
 * otherwise buy a stop whose only claim is that somebody is too tall for a roller
 * coaster.
 *
 * Returns `null` when the park publishes no minimum height at all, or when what
 * comes out has fewer than two positions — both are the caller's signal to render
 * no filter rather than a control with nothing to say.
 */
export function riderHeightStops(attractions: readonly RiderHeightLimits[]): number[] | null {
  const minima = riderHeightThresholds(attractions);
  if (minima.length === 0) return null;

  const top = minima[minima.length - 1];
  const stops = new Set(minima);

  const leadIn = minima[0] - LEAD_IN;
  if (leadIn > 0) stops.add(leadIn);

  for (const a of attractions) {
    const max = a.maximumHeight;
    if (max == null || max <= 0) continue;
    const tooTall = ceilToStep(max + 1);
    if (tooTall < top) stops.add(tooTall);
  }

  if (stops.size < 2) return null;
  return [...stops].sort((a, b) => a - b);
}
