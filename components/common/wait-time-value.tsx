import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';

interface WaitTimeValueProps {
  minutes: number;
  /** On the root: the figure alone, or the figure and its unit together when `unit` is set. */
  className?: string;
  /**
   * The drop shadow that lifts the figure off a card photo. Off where the figure sits on a flat
   * surface — a menu row, a list — and the shadow would only blur it.
   */
  shadow?: boolean;
  /** A unit after the figure, muted and in the body weight: "25 min". */
  unit?: ReactNode;
  unitClassName?: string;
}

/**
 * A wait time in minutes, coloured by its crowd tier, with an optional muted unit after it and a
 * drop shadow for figures on a photo.
 */
export function WaitTimeValue({
  minutes,
  className,
  shadow = true,
  unit,
  unitClassName,
}: WaitTimeValueProps) {
  const figure = (
    <span
      className={cn(CROWD_TEXT_CLASS[waitTimeCrowdTier(minutes)], unit == null && className)}
      style={shadow ? { filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.3))' } : undefined}
    >
      {minutes}
    </span>
  );
  if (unit == null) return figure;

  return (
    <span className={className}>
      {figure}
      <span className={cn('text-muted-foreground ml-1 text-xs font-normal', unitClassName)}>
        {unit}
      </span>
    </span>
  );
}
