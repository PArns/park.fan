/**
 * Rider-height filtering for a park's attraction list, so the grid, the headliner row and the
 * panel's „23 of 40" readout share one predicate. All heights are centimetres, as the API stores
 * them; imperial display belongs to `RiderHeight` (`components/common/unit-display.tsx`).
 */

/** The two rider-height limits an attraction may carry. Both are optional and both may be null. */
export interface RiderHeightLimits {
  /** Minimum rider height in cm. Null/absent = unrestricted or unknown. */
  minimumHeight?: number | null;
  /** Maximum rider height in cm (kiddie rides). */
  maximumHeight?: number | null;
}

/** Grid the derived stops are rounded onto, in cm, the unit parks post their limits in. */
export const RIDER_HEIGHT_STEP = 5;

/**
 * How far below the park's lowest limit the „clears nothing" stop sits, in cm. Small, because it
 * is a position to slide from and nothing changes along it.
 */
const LEAD_IN = 10;

/**
 * Whether a rider of `cm` may ride. An attraction with no height data passes, like
 * {@link import('./season').isInSeason}'s `!== false`: a missing limit means nobody wrote one down,
 * and hiding the ride would quietly shorten the park. A kiddie ride's `maximumHeight` counts too.
 */
export function canRideAtHeight(attraction: RiderHeightLimits, cm: number): boolean {
  if (attraction.minimumHeight != null && cm < attraction.minimumHeight) return false;
  if (attraction.maximumHeight != null && cm > attraction.maximumHeight) return false;
  return true;
}

/** The distinct minimum heights a park enforces, ascending: where a ride opens up. */
export function riderHeightThresholds(attractions: readonly RiderHeightLimits[]): number[] {
  const seen = new Set<number>();
  for (const a of attractions) {
    if (a.minimumHeight != null && a.minimumHeight > 0) seen.add(a.minimumHeight);
  }
  return [...seen].sort((a, b) => a - b);
}

const ceilToStep = (n: number) => Math.ceil(n / RIDER_HEIGHT_STEP) * RIDER_HEIGHT_STEP;

/**
 * Every height the slider may be set to, ascending: one detent per height at which the park's
 * answer changes, so every step changes the list.
 *
 * The stops are each enforced minimum; one lead-in stop {@link LEAD_IN} cm below the lowest, so the
 * filter can say „too small for everything"; and the first height too tall for each kiddie ride
 * (`maximumHeight` plus one, rounded up to the 5 cm grid), so a tall rider is not offered the
 * teacups. A maximum at or above the top minimum adds no stop.
 *
 * Returns `null` when the park publishes no minimum or fewer than two stops result, which tells the
 * caller to render no filter.
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
