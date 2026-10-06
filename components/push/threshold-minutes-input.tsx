'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_THRESHOLD_MIN,
  MIN_THRESHOLD_MIN,
  MAX_THRESHOLD_MIN,
  THRESHOLD_STEP_MIN,
  THRESHOLD_SLIDER_MIN,
  defaultThresholdFor,
  hasUsableThresholdRange,
  maxThresholdFor,
  parseThresholdMinutes,
} from '@/lib/push/threshold-minutes';

export {
  DEFAULT_THRESHOLD_MIN,
  MIN_THRESHOLD_MIN,
  MAX_THRESHOLD_MIN,
  THRESHOLD_STEP_MIN,
  THRESHOLD_SLIDER_MIN,
  defaultThresholdFor,
  hasUsableThresholdRange,
  maxThresholdFor,
  parseThresholdMinutes,
};

interface ThresholdMinutesInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
  /** The unit word shown beside the big number — e.g. "min" / "Min.". */
  minutesLabel: string;
  /**
   * Top of the track, from {@link maxThresholdFor} — ten minutes under what
   * the ride queues right now, because a threshold at or above the current
   * reading fires the moment it is saved. Defaults to the API's own maximum
   * for a ride with no reading to cap against.
   */
  max?: number;
}

/**
 * The "notify below N minutes" control both ride-alert dialogs render: a slider, because the value
 * is about where it sits between "almost nothing" and "barely worth waiting for". Drawn like
 * `RiderHeightFilter` (a styled track and thumb under a transparent `input[type=range]`), with
 * stops {@link THRESHOLD_STEP_MIN} apart.
 *
 * The native `min` is {@link THRESHOLD_SLIDER_MIN} (5), not {@link MIN_THRESHOLD_MIN}: a range
 * input snaps every value to `min + k·step`, so anchoring at 1 would make no reachable position a
 * round number. The drawn thumb uses the unsnapped value, clamped, so an older alert of 1 to 9
 * minutes draws at the left edge with its exact number above.
 *
 * No `autoFocus`: inside a freshly opened Radix `Dialog` it scrolls the page mid-transition, and
 * Radix moves focus to this input once the dialog has opened anyway.
 */
export function ThresholdMinutesInput({
  value,
  onChange,
  className,
  ariaLabel,
  minutesLabel,
  max = MAX_THRESHOLD_MIN,
}: ThresholdMinutesInputProps) {
  const numericValue = parseThresholdMinutes(value) ?? DEFAULT_THRESHOLD_MIN;
  // A max equal to the floor is a legal one-stop track (a ride at 15 minutes
  // can only be watched for "under 5"), and dividing by that span would be a
  // division by zero — so the fraction is pinned rather than computed.
  const span = max - THRESHOLD_SLIDER_MIN;
  const fraction =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (numericValue - THRESHOLD_SLIDER_MIN) / span));
  // The native thumb's centre travels from half a thumb-width in to half a
  // thumb-width short of the end — see RiderHeightFilter's `offset`, same
  // formula, just against a linear value instead of a stop index.
  const thumbOffset = `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${fraction.toFixed(4)})`;

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      style={{ '--thumb': '1.25rem' } as CSSProperties}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-primary text-2xl font-bold tabular-nums">{numericValue}</span>
        <span className="text-muted-foreground text-sm font-medium">{minutesLabel}</span>
      </div>

      <div className="relative h-6">
        <div className="bg-foreground/12 dark:bg-foreground/15 absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
        <div
          className="bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{ width: thumbOffset }}
        />
        <input
          type="range"
          inputMode="numeric"
          min={THRESHOLD_SLIDER_MIN}
          max={max}
          step={THRESHOLD_STEP_MIN}
          value={numericValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          // Same construction as RiderHeightFilter: a 44px phone-tier band the
          // drawn track sits inside of, real input invisible but on top.
          className="peer absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 cursor-pointer touch-manipulation appearance-none bg-transparent opacity-0 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none"
        />
        {/* After the input, so its keyboard focus reaches the head as `peer-focus-visible` rather
            than through a `:has()` rule — see RiderHeightFilter and
            docs/rules/no-has-selector-in-the-stylesheet.md. */}
        <div
          aria-hidden="true"
          className="border-background bg-primary peer-focus-visible:ring-ring/50 pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md peer-focus-visible:ring-4"
          style={{ left: thumbOffset }}
        />
      </div>

      <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
        <span>{THRESHOLD_SLIDER_MIN}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
