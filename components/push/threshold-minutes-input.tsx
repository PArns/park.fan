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
  parseThresholdMinutes,
} from '@/lib/push/threshold-minutes';

export {
  DEFAULT_THRESHOLD_MIN,
  MIN_THRESHOLD_MIN,
  MAX_THRESHOLD_MIN,
  THRESHOLD_STEP_MIN,
  THRESHOLD_SLIDER_MIN,
  defaultThresholdFor,
  parseThresholdMinutes,
};

interface ThresholdMinutesInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
  /** The unit word shown beside the big number — e.g. "min" / "Min.". */
  minutesLabel: string;
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
 * shared stylesheet. Unlike that filter this one's stops are a fixed
 * {@link THRESHOLD_STEP_MIN} apart rather than an index into a curated list —
 * a 240-position drag is fiddly on a touchscreen, and nobody is asking for
 * "notify below 47 minutes" specifically. The native input's own `min` is
 * {@link THRESHOLD_SLIDER_MIN} (ten — a wait-time alert under that is not a
 * useful one), not {@link MIN_THRESHOLD_MIN}: a range input snaps EVERY
 * value — the initial one, a drag, an arrow key — to `min + k·step`, always,
 * so anchoring the grid at `MIN_THRESHOLD_MIN` (1) would make the reachable
 * positions 1, 6, 11, 16, 21, ... — not one of which is a round number, and
 * none of which is what `defaultThresholdFor` actually returns (20, 30, 45,
 * ...). Anchored at ten with a step of five the grid is exactly
 * 10, 15, ..., 240. The drawn thumb/fill still use the true, unsnapped
 * `numericValue` for their position (clamped into `[0,1]` since an OLD
 * alert saved before this control had a floor at all can still carry 1–9),
 * so a legacy value like that draws at the track's left edge rather than
 * off it, while the number above it keeps reading its real, exact value.
 *
 * Still hands the caller a raw string rather than parsing it here: a real
 * range input can never actually report an out-of-range or non-numeric
 * value, but `value` is typed as a string so a caller can still seed it with
 * `''` before the first render without a type error.
 *
 * No `autoFocus` prop: an `autoFocus`ed range input inside a freshly-opened
 * Radix `Dialog` used to send the WHOLE PAGE scrolling to somewhere near its
 * bottom the instant the dialog appeared, on both the phone and desktop
 * viewport this was tested at — the native autofocus fires synchronously at
 * mount, before the dialog's open transform/animation has settled, and the
 * browser's implicit scroll-into-view reads that mid-transition layout.
 * Radix's own `Dialog.Content` already moves focus to the first focusable
 * descendant once the dialog has actually finished opening, deferred exactly
 * to avoid this, which is what still lands focus on this input with no
 * `autoFocus` here at all.
 */
export function ThresholdMinutesInput({
  value,
  onChange,
  className,
  ariaLabel,
  minutesLabel,
}: ThresholdMinutesInputProps) {
  const numericValue = parseThresholdMinutes(value) ?? DEFAULT_THRESHOLD_MIN;
  const fraction = Math.min(
    1,
    Math.max(
      0,
      (numericValue - THRESHOLD_SLIDER_MIN) / (MAX_THRESHOLD_MIN - THRESHOLD_SLIDER_MIN)
    )
  );
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
          min={THRESHOLD_SLIDER_MIN}
          max={MAX_THRESHOLD_MIN}
          step={THRESHOLD_STEP_MIN}
          value={numericValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          // Same construction as RiderHeightFilter: a 44px phone-tier band the
          // drawn track sits inside of, real input invisible but on top.
          className="absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 cursor-pointer touch-manipulation appearance-none bg-transparent opacity-0 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>

      <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
        <span>{THRESHOLD_SLIDER_MIN}</span>
        <span>{MAX_THRESHOLD_MIN}</span>
      </div>
    </div>
  );
}
