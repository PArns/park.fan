import { Leaf, Snowflake, Sprout } from 'lucide-react';
import type { ParkBreakScene } from '@/lib/utils/park-break';

/**
 * The break's icon, after the scene Parky sleeps in: the park page's panel (`ParkBreakPanel`) and
 * the hero's park cards draw a break with the same one.
 */
export const PARK_BREAK_ICON: Record<ParkBreakScene, typeof Snowflake> = {
  winter: Snowflake,
  autumn: Leaf,
  spring: Sprout,
};

/** „Winterpause" or „Saisonpause" with its icon: amber caps on the panel's yellow glass. */
export const PARK_BREAK_KICKER_CLASS =
  'flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] text-amber-800 uppercase dark:text-yellow-300';

/** How long until it opens again („in 18 Wochen"), as a yellow pill. */
export const PARK_BREAK_PILL_CLASS =
  'inline-flex items-center rounded-full bg-yellow-300/70 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-yellow-600/30 dark:bg-yellow-400/20 dark:text-yellow-100 dark:ring-yellow-300/30';

/** The panel's yellow edge, for a card that shows a break. */
export const PARK_BREAK_BORDER_CLASS = 'border-yellow-500/50 dark:border-yellow-300/35';
