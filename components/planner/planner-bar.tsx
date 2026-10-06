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
 * One wait time, drawn. The tier changes the bar's edge, not just its colour: a measured bar ends
 * hard and a composed one fades, softer the further out. The band reaches right only, since the
 * figure is the median and the width its top quantile minus it. A missing band
 * (`uncertaintyMinutes === null`) is drawn as nothing, not a hairline.
 */
export function PlannerBar({
  wait,
  uncertaintyMinutes,
  scale,
  tier,
  done = false,
}: PlannerBarProps) {
  const { fill, bandTo, hasBand } = barGeometry(wait, uncertaintyMinutes, scale);

  // Colour from the wait, through the site's own thresholds. `CROWD_DOT_CLASS`, since
  // `CROWD_SCALE_CLASS` carries a text colour and a bar has no text.
  const tone = wait === null ? null : CROWD_DOT_CLASS[waitTimeCrowdTier(wait)];

  // The softness of the right edge is the tier.
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
          // A ticked-off bar is a measurement: always the hard edge.
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
