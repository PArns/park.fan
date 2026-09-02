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

/** Slider step, in cm. */
export const RIDER_HEIGHT_STEP = 5;

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
 * These are the only values at which the filter's result set can change, so the
 * slider draws them as ticks: they tell a visitor where the park's own steps are
 * before they drag anything.
 */
export function riderHeightThresholds(attractions: readonly RiderHeightLimits[]): number[] {
  const seen = new Set<number>();
  for (const a of attractions) {
    if (a.minimumHeight != null && a.minimumHeight > 0) seen.add(a.minimumHeight);
  }
  return [...seen].sort((a, b) => a - b);
}

export interface RiderHeightRange {
  min: number;
  max: number;
  /** Every distinct minimum height the park enforces, ascending — the slider's ticks. */
  thresholds: number[];
}

const floorToStep = (n: number) => Math.floor(n / RIDER_HEIGHT_STEP) * RIDER_HEIGHT_STEP;
const ceilToStep = (n: number) => Math.ceil(n / RIDER_HEIGHT_STEP) * RIDER_HEIGHT_STEP;

/**
 * The slider's range, derived from the park rather than from a table of typical
 * child heights: a park whose lowest limit is 90 cm has nothing to say about 60 cm,
 * and a slider that spends half its travel in a region where the answer never
 * changes reads as broken.
 *
 * So it runs from two steps below the park's lowest limit — there has to be a
 * position that clears nothing, or the filter cannot express "too small for every
 * ride that has a limit" — up to the highest limit, where the visitor clears them
 * all. Every position in between changes the answer.
 *
 * `maximumHeight` deliberately does NOT stretch it, though it is filtered on. Those
 * values are mostly a coaster's safety ceiling rather than a kiddie ride's cutoff:
 * Phantasialand's are 140, 145, 195, 200 and 205 cm, and honouring the top of that
 * would spend a third of the track between 140 and 205, where the only thing that
 * can change is whether somebody is too tall for a roller coaster. The ones that
 * matter to a child sit below the highest minimum and are inside the range anyway.
 *
 * Returns `null` when the park publishes no minimum height at all, which is the
 * caller's signal to render no filter.
 */
export function riderHeightRange(
  attractions: readonly RiderHeightLimits[]
): RiderHeightRange | null {
  const thresholds = riderHeightThresholds(attractions);
  if (thresholds.length === 0) return null;

  const min = Math.max(RIDER_HEIGHT_STEP, floorToStep(thresholds[0]) - 2 * RIDER_HEIGHT_STEP);
  // The floor is for a park with a single limit, where the two would otherwise sit
  // 10 cm apart and the track would have three positions on it.
  const max = Math.max(ceilToStep(thresholds[thresholds.length - 1]), min + 4 * RIDER_HEIGHT_STEP);

  return { min, max, thresholds };
}
