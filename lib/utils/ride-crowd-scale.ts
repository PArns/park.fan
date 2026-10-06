import { CROWD_LEVEL_ORDER, type ColoredCrowdLevel } from './crowd-level-styles';

/**
 * The crowd level the API gives a ride for one wait, against that ride's own baseline. A twin of
 * the backend's `determineCrowdLevel` (`src/common/utils/crowd-level.util.ts`): `wait ÷ baseline ×
 * 100`, unrounded, bucketed with `<=`. The two change together, or a tooltip contradicts the badge.
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
 * The waits one tier covers, in minutes, or `null` when no posted wait lands in it; `extreme` has
 * no `max`.
 */
export type RideCrowdMinuteRange = { min: number; max?: number } | null;

/**
 * Which waits put THIS ride in which tier, for the badge tooltip. The badge is rated against the
 * ride's own baseline, so the tooltip speaks minutes: it walks the five-minute steps parks post
 * rather than multiplying thresholds out, which would print boundaries no sign shows. A tier no
 * step lands in is `null`. `null` overall for a missing baseline, which the API does not rate.
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
