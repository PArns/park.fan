import type { CrowdLevel } from '@/lib/api/types';

/**
 * Single source of truth for mapping the six colored crowd levels onto the
 * project-wide `--crowd-*` palette. Every face of the palette (text, badge,
 * border chip) used to be hand-declared per component, so retuning a shade or
 * adding a level meant editing half a dozen files — pick the variant you need
 * from here instead. Full literal class strings on purpose: Tailwind's scanner
 * must see them (no `text-crowd-${level}` templates).
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

/** `text-crowd-*` text color per level (inline values, blog annotations, …). */
export const CROWD_TEXT_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'text-crowd-very-low',
  low: 'text-crowd-low',
  moderate: 'text-crowd-moderate',
  high: 'text-crowd-high',
  very_high: 'text-crowd-very-high',
  extreme: 'text-crowd-extreme',
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

/** Outlined chip (tinted border + text) per level (live ticker, …). */
export const CROWD_OUTLINE_CLASS: Record<ColoredCrowdLevel, string> = {
  very_low: 'border-crowd-very-low/60 text-crowd-very-low',
  low: 'border-crowd-low/60 text-crowd-low',
  moderate: 'border-crowd-moderate/60 text-crowd-moderate',
  high: 'border-crowd-high/60 text-crowd-high',
  very_high: 'border-crowd-very-high/60 text-crowd-very-high',
  extreme: 'border-crowd-extreme/60 text-crowd-extreme',
};

/**
 * The crowd-calendar day tile: tinted fill + border, one class per level.
 *
 * The opacity climbs with the level on purpose. A quiet day should recede into the card and a
 * full one should be visible from the other side of the room — at one flat alpha the six tiers
 * differ only in hue, and hue alone is the channel a red-green colour vision deficiency spends
 * first. So `very_low` … `moderate` sit at 8 %, `high` at 10, `very_high` at 14 and `extreme` at
 * 18, which reads as a ramp in weight as well as in colour.
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
 * One segment of the calendar legend's crowd scale — the solid colour with text ON it.
 *
 * The six chips butt together into one strip, so this is the only face of the palette that needs
 * a readable foreground over a full-strength `--crowd-*`.
 *
 * The foreground is a fixed near-black in BOTH themes, not `text-background`. The palette is not
 * symmetric: in the dark theme the six sit at L 0.74 … 0.86 and `--background` happens to be
 * near-black, which reads; in the light theme they drop to L 0.55 … 0.62 and `--background`
 * becomes white, which puts white text on a mid amber at about 2.4:1 and fails outright. Black on
 * the light theme's darkest tier (`extreme`, L 0.55) still measures 5.4:1.
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
  very_low: 'bg-crowd-very-low/20 text-crowd-very-low border border-crowd-very-low/30',
  low: 'bg-crowd-low/20 text-crowd-low border border-crowd-low/30',
  moderate: 'bg-crowd-moderate/20 text-crowd-moderate border border-crowd-moderate/30',
  high: 'bg-crowd-high/20 text-crowd-high border border-crowd-high/30',
  very_high: 'bg-crowd-very-high/20 text-crowd-very-high border border-crowd-very-high/30',
  extreme: 'bg-crowd-extreme/20 text-crowd-extreme border border-crowd-extreme/30',
};

/**
 * Canonical wait-time (minutes) → crowd tier thresholds, shared by
 * `WaitTimeValue` (the canonical wait-time display) and the inline blog wait
 * badges so a wait is green at 20 min and red past an hour everywhere.
 */
export function waitTimeCrowdTier(minutes: number): ColoredCrowdLevel {
  if (minutes <= 5) return 'very_low';
  if (minutes <= 15) return 'low';
  if (minutes <= 30) return 'moderate';
  if (minutes <= 40) return 'high';
  if (minutes <= 60) return 'very_high';
  return 'extreme';
}
