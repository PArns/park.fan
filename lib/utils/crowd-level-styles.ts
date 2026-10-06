import type { CrowdLevel } from '@/lib/api/types';

/**
 * Single source for mapping the six coloured crowd levels onto the `--crowd-*` palette; pick the
 * face you need here rather than declaring it per component. Full literal class strings on
 * purpose: Tailwind's scanner must see them (no `text-crowd-${level}` templates).
 */

/** The six crowd levels that carry a color (i.e. `CrowdLevel` minus `unknown`). */
export type ColoredCrowdLevel = Exclude<CrowdLevel, 'unknown'>;

/** Canonical low→high ordering of the colored crowd levels. */
export const CROWD_LEVEL_ORDER: readonly ColoredCrowdLevel[] = [
  'very_low',
  'low',
  'moderate',
  'high',
  'very_high',
  'extreme',
] as const;

/** Whether a level is one of the six that carry a colour (i.e. not `unknown`, not `closed`). */
export function isColoredCrowdLevel(level: string): level is ColoredCrowdLevel {
  return (CROWD_LEVEL_ORDER as readonly string[]).includes(level);
}

/**
 * What each level means as a percentage, for the surfaces that explain the scale. These are the
 * API's own thresholds (`determineCrowdLevel`, backend `src/common/utils/crowd-level.util.ts`),
 * where 100 % is a typical reading for both calendar days and live readings. The union keeps the
 * open ends (`very_low` has no `min`, `extreme` no `max`) narrowable without a non-null assertion.
 */
export type CrowdPercentRange =
  | { min?: undefined; max: number }
  | { min: number; max: number }
  | { min: number; max?: undefined };

/** The percentage range behind each coloured crowd level. */
export const CROWD_LEVEL_PERCENT_RANGE: Record<ColoredCrowdLevel, CrowdPercentRange> = {
  very_low: { max: 60 },
  low: { min: 61, max: 89 },
  moderate: { min: 90, max: 110 },
  high: { min: 111, max: 150 },
  very_high: { min: 151, max: 200 },
  extreme: { min: 200 },
};

/**
 * Text colour per level (inline values, blog annotations, …). `crowd-ink-*`, not `crowd-*`: the
 * light theme's fills are too light to read as text.
 */
export const CROWD_TEXT_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'text-crowd-ink-very-low',
  low: 'text-crowd-ink-low',
  moderate: 'text-crowd-ink-moderate',
  high: 'text-crowd-ink-high',
  very_high: 'text-crowd-ink-very-high',
  extreme: 'text-crowd-ink-extreme',
};

/** `badge-crowd-*` solid badge per level (CrowdLevelBadge, blog wait badges, …). */
export const CROWD_BADGE_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'badge-crowd-very-low',
  low: 'badge-crowd-low',
  moderate: 'badge-crowd-moderate',
  high: 'badge-crowd-high',
  very_high: 'badge-crowd-very-high',
  extreme: 'badge-crowd-extreme',
};

/**
 * An opaque fill per level with white text, for a wait read at a glance in daylight: the in-park
 * compass's markers and wait pills. `badge-crowd-*` is translucent and fails contrast over the
 * compass face, so these are the dark theme's `--badge-crowd-*` tones, solid, in both themes.
 */
export const CROWD_SOLID_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'bg-[oklch(0.42_0.14_192)] text-white',
  low: 'bg-[oklch(0.48_0.19_162)] text-white',
  moderate: 'bg-[oklch(0.48_0.2_145)] text-white',
  high: 'bg-[oklch(0.5_0.2_78)] text-white',
  very_high: 'bg-[oklch(0.46_0.22_52)] text-white',
  extreme: 'bg-[oklch(0.42_0.23_25)] text-white',
};

/** Outlined chip (tinted border + text) per level (live ticker, …). */
export const CROWD_OUTLINE_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'border-crowd-very-low/60 text-crowd-ink-very-low',
  low: 'border-crowd-low/60 text-crowd-ink-low',
  moderate: 'border-crowd-moderate/60 text-crowd-ink-moderate',
  high: 'border-crowd-high/60 text-crowd-ink-high',
  very_high: 'border-crowd-very-high/60 text-crowd-ink-very-high',
  extreme: 'border-crowd-extreme/60 text-crowd-ink-extreme',
};

/**
 * The crowd-calendar day tile: tinted fill + border. The opacity climbs with the level so the
 * tiers differ in weight as well as hue, since hue alone is the channel a red-green colour vision
 * deficiency loses first.
 */
export const CROWD_TILE_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'bg-crowd-very-low/8 border-crowd-very-low/25',
  low: 'bg-crowd-low/8 border-crowd-low/25',
  moderate: 'bg-crowd-moderate/8 border-crowd-moderate/25',
  high: 'bg-crowd-high/10 border-crowd-high/25',
  very_high: 'bg-crowd-very-high/14 border-crowd-very-high/25',
  extreme: 'bg-crowd-extreme/18 border-crowd-extreme/25',
};

/**
 * One segment of the calendar legend's crowd scale: the solid colour with text on it. The text is
 * a fixed near-black in both themes, not `text-background`, which turns white in the light theme
 * and fails contrast on the mid tones.
 */
export const CROWD_SCALE_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'bg-crowd-very-low text-neutral-950',
  low: 'bg-crowd-low text-neutral-950',
  moderate: 'bg-crowd-moderate text-neutral-950',
  high: 'bg-crowd-high text-neutral-950',
  very_high: 'bg-crowd-very-high text-neutral-950',
  extreme: 'bg-crowd-extreme text-neutral-950',
};

/** Solid `bg-crowd-*` fill per level (status dots in the hero bubbles, …). */
export const CROWD_DOT_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'bg-crowd-very-low',
  low: 'bg-crowd-low',
  moderate: 'bg-crowd-moderate',
  high: 'bg-crowd-high',
  very_high: 'bg-crowd-very-high',
  extreme: 'bg-crowd-extreme',
};

/** Soft tinted chip (translucent bg + border + text) per level (best-days chips, …). */
export const CROWD_CHIP_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'bg-crowd-very-low/20 text-crowd-ink-very-low border border-crowd-very-low/30',
  low: 'bg-crowd-low/20 text-crowd-ink-low border border-crowd-low/30',
  moderate: 'bg-crowd-moderate/20 text-crowd-ink-moderate border border-crowd-moderate/30',
  high: 'bg-crowd-high/20 text-crowd-ink-high border border-crowd-high/30',
  very_high: 'bg-crowd-very-high/20 text-crowd-ink-very-high border border-crowd-very-high/30',
  extreme: 'bg-crowd-extreme/20 text-crowd-ink-extreme border border-crowd-extreme/30',
};

/**
 * Wait-time (minutes) → crowd tier, shared by `WaitTimeValue` and the inline blog wait badges so a
 * wait gets the same colour everywhere.
 */
export function waitTimeCrowdTier(minutes: number): ColoredCrowdLevel {
  if (minutes <= 5) return 'very_low';
  if (minutes <= 15) return 'low';
  if (minutes <= 30) return 'moderate';
  if (minutes <= 40) return 'high';
  if (minutes <= 60) return 'very_high';
  return 'extreme';
}
