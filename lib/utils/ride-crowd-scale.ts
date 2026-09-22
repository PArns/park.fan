import { CROWD_LEVEL_ORDER, type ColoredCrowdLevel } from './crowd-level-styles';

/**
 * The crowd level the API gives a ride for one wait, against that ride's own baseline.
 *
 * A twin of the backend's `determineCrowdLevel` (`src/common/utils/crowd-level.util.ts`), fed the
 * way `getAttractionCrowdLevel` feeds it: `wait ÷ baseline × 100`, unrounded, bucketed with `<=`.
 * The two change together or not at all — a tooltip that draws the boundary one step off from the
 * badge above it would contradict the badge on exactly the waits people look up.
 */
export function rideCrowdLevelForWait(wait: number, baseline: number): ColoredCrowdLevel {
  const occupancy = (wait / baseline) * 100;
  if (occupancy <= 60) return 'very_low';
  if (occupancy <= 89) return 'low';
  if (occupancy <= 110) return 'moderate';
  if (occupancy <= 150) return 'high';
  if (occupancy <= 200) return 'very_high';
  return 'extreme';
}

/**
 * The waits one tier covers, in minutes, or `null` when no wait a park posts lands in it.
 *
 * `max` is absent on `extreme` only: that end is open.
 */
export type RideCrowdMinuteRange = { min: number; max?: number } | null;

/**
 * Which waits put THIS ride in which tier.
 *
 * The badge on a ride card is rated against the ride's own typical wait (`baseline`, the API's P50
 * of its samples), so „Hoch" is 20 minutes on one ride and 95 on the next, and a percentage table
 * answers neither. The tooltip therefore speaks minutes, and it enumerates them instead of
 * multiplying the five percentage thresholds out: parks post waits in five-minute steps, so the
 * question a reader can actually ask is „which of the waits I could see here is which tier". Taking
 * `baseline × 0.6` and rounding it would print boundaries no sign ever shows and, at a small
 * baseline, give two tiers the same number — at 15 minutes „Normal" spans 13.5 to 16.5, which
 * rounds to 15 at both ends.
 *
 * The same small baselines are why a tier can come back empty: at 5 minutes a ride goes from
 * 0 % straight to 100 % and then 200 %, and there is no wait that reads „Niedrig". An empty tier is
 * `null`, never a made-up range.
 *
 * Returns `null` for a missing or non-positive baseline. There is no fallback scale: the API rates
 * a ride without a baseline as nothing at all, and any other table would be the wrong numbers.
 */
export function rideCrowdMinuteRanges(
  baseline: number | null | undefined
): Record<ColoredCrowdLevel, RideCrowdMinuteRange> | null {
  if (typeof baseline !== 'number' || !Number.isFinite(baseline) || baseline <= 0) return null;

  const ranges = Object.fromEntries(CROWD_LEVEL_ORDER.map((level) => [level, null])) as Record<
    ColoredCrowdLevel,
    RideCrowdMinuteRange
  >;

  // Anything above twice the baseline is `extreme`, so the walk always ends.
  for (let wait = 0; ; wait += 5) {
    const level = rideCrowdLevelForWait(wait, baseline);
    if (level === 'extreme') {
      ranges.extreme = { min: wait };
      return ranges;
    }
    const range = ranges[level];
    ranges[level] = range ? { min: range.min, max: wait } : { min: wait, max: wait };
  }
}
