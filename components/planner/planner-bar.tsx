'use client';

import { cn } from '@/lib/utils';
import { barGeometry } from '@/lib/planner/bar-geometry';
import { CROWD_DOT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import type { PlanDayTier } from '@/lib/api/types';

interface PlannerBarProps {
  /** Expected wait in minutes, or null when there is no figure. */
  wait: number | null;
  /** The model's own spread. Null means it reported none. */
  uncertaintyMinutes: number | null;
  /** Shared across the day's bars — see `dayScale`. */
  scale: number;
  /** How the number was produced. Decides how solid the bar is drawn. */
  tier: PlanDayTier;
  /** Ticked off: the bar stops being an estimate and becomes a record. */
  done?: boolean;
}

/**
 * One wait time, drawn.
 *
 * Three things are load-bearing and none of them is decoration.
 *
 * **The tier changes the bar's edge, not just its colour.** A composed number and
 * a measured one are equally real numbers and would render identically, so the
 * measured bar gets a hard edge and the composed ones fade out over their last
 * few percent — the further out, the softer. Someone who has never read a word of
 * documentation can still see that the right-hand end of a long-range bar is not
 * a promise.
 *
 * **The band reaches right, never both ways.** The model's figure is its median
 * and the width is its top quantile minus that median, so there is no lower edge.
 * Drawing a symmetric band would invent one.
 *
 * **A missing band is drawn as nothing.** `uncertaintyMinutes === null` means the
 * model reported no spread, which is not a spread of zero; a hairline there would
 * put the most confident-looking mark on the least certain row.
 */
export function PlannerBar({
  wait,
  uncertaintyMinutes,
  scale,
  tier,
  done = false,
}: PlannerBarProps) {
  const { fill, bandTo, hasBand } = barGeometry(wait, uncertaintyMinutes, scale);

  // Colour comes from the wait itself, through the same thresholds the rest of
  // the site uses, so a 70-minute bar here reads like a 70-minute badge on a
  // ride card. CROWD_DOT_CLASS rather than CROWD_SCALE_CLASS: the latter carries
  // a text colour for chips, and a bar has no text on it.
  const tone = wait === null ? null : CROWD_DOT_CLASS[waitTimeCrowdTier(wait)];

  // The softness of the right edge IS the tier. A measured bar ends where it
  // ends; a long-range one dissolves over a fifth of its own length.
  const edgeMask =
    tier === 'measured'
      ? undefined
      : tier === 'composed'
        ? 'linear-gradient(to right, black 88%, transparent 100%)'
        : 'linear-gradient(to right, black 72%, transparent 100%)';

  return (
    <div
      className="bg-muted/40 relative h-2.5 w-full overflow-hidden rounded-full"
      aria-hidden="true"
    >
      {/* The band first, so the solid bar sits on top of it. */}
      {hasBand && !done && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full opacity-25',
            tone ?? 'bg-muted-foreground'
          )}
          style={{ width: `${bandTo * 100}%` }}
        />
      )}
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out',
          done ? 'bg-foreground/45' : (tone ?? 'bg-muted-foreground'),
          // A ticked-off bar is a measurement, so it always gets the hard edge
          // whatever tier the day is on.
          !done && tier !== 'measured' && 'opacity-90'
        )}
        style={{
          width: `${fill * 100}%`,
          ...(done || !edgeMask ? {} : { maskImage: edgeMask, WebkitMaskImage: edgeMask }),
        }}
      />
    </div>
  );
}
