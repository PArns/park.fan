'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_THRESHOLD_MIN,
  MIN_THRESHOLD_MIN,
  MAX_THRESHOLD_MIN,
  parseThresholdMinutes,
} from '@/lib/push/threshold-minutes';

export { DEFAULT_THRESHOLD_MIN, MIN_THRESHOLD_MIN, MAX_THRESHOLD_MIN, parseThresholdMinutes };

interface ThresholdMinutesInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
  /** The unit word shown beside the big number — e.g. "min" / "Min.". */
  minutesLabel: string;
  autoFocus?: boolean;
}

/**
 * The "notify below N minutes" control both ride-alert dialogs render — a
 * slider, not a spinner: the whole point of the value is where it sits
 * between "almost nothing" and "barely worth waiting for", which a dragged
 * position shows and a stepper's ±1 arrows do not.
 *
 * Draws the same way `RiderHeightFilter` does (see that file for the fuller
 * reasoning): a `<div>` track + thumb for the look, a transparent
 * `input[type=range]` on top for pointer/keyboard/screen-reader behaviour,
 * because a native range input's thumb and fill are not addressable from one
 * shared stylesheet. Unlike that filter this one has no stops to round to —
 * every whole minute from {@link MIN_THRESHOLD_MIN} to
 * {@link MAX_THRESHOLD_MIN} is a legitimate threshold — so the position is a
 * plain linear fraction rather than an index into a list.
 *
 * Still hands the caller a raw string rather than parsing it here: a real
 * range input can never actually report an out-of-range or non-numeric
 * value, but `value` is typed as a string so a caller can still seed it with
 * `''` before the first render without a type error.
 */
export function ThresholdMinutesInput({
  value,
  onChange,
  className,
  ariaLabel,
  minutesLabel,
  autoFocus,
}: ThresholdMinutesInputProps) {
  const numericValue = parseThresholdMinutes(value) ?? DEFAULT_THRESHOLD_MIN;
  const fraction = (numericValue - MIN_THRESHOLD_MIN) / (MAX_THRESHOLD_MIN - MIN_THRESHOLD_MIN);
  // The native thumb's centre travels from half a thumb-width in to half a
  // thumb-width short of the end — see RiderHeightFilter's `offset`, same
  // formula, just against a linear value instead of a stop index.
  const thumbOffset = `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${fraction.toFixed(4)})`;

  return (
    <div className={cn('flex flex-col gap-2', className)} style={{ '--thumb': '1.25rem' } as CSSProperties}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-primary text-2xl font-bold tabular-nums">{numericValue}</span>
        <span className="text-muted-foreground text-sm font-medium">{minutesLabel}</span>
      </div>

      <div className="group relative h-6">
        <div className="bg-foreground/12 dark:bg-foreground/15 absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
        <div
          className="bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={{ width: thumbOffset }}
        />
        <div
          aria-hidden="true"
          className="border-background bg-primary group-has-[:focus-visible]:ring-ring/50 absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md group-has-[:focus-visible]:ring-4"
          style={{ left: thumbOffset }}
        />
        <input
          type="range"
          inputMode="numeric"
          min={MIN_THRESHOLD_MIN}
          max={MAX_THRESHOLD_MIN}
          step={1}
          value={numericValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          // Same construction as RiderHeightFilter: a 44px phone-tier band the
          // drawn track sits inside of, real input invisible but on top.
          className="absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 cursor-pointer touch-manipulation appearance-none bg-transparent opacity-0 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>

      <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
        <span>{MIN_THRESHOLD_MIN}</span>
        <span>{MAX_THRESHOLD_MIN}</span>
      </div>
    </div>
  );
}
