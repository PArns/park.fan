'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Ruler, X } from 'lucide-react';
import { RiderHeight } from '@/components/common/unit-display';
import { RIDER_HEIGHT_STEP, type RiderHeightRange } from '@/lib/utils/rider-height';
import { cn } from '@/lib/utils';

interface RiderHeightFilterProps {
  range: RiderHeightRange;
  /** Chosen rider height in cm, or `null` while the filter is off. */
  value: number | null;
  onChange: (cm: number | null) => void;
  /** Attractions this height may ride / attractions the park has. */
  rideableCount: number;
  totalCount: number;
  className?: string;
}

/**
 * "How tall is the rider?" — the park page's height filter.
 *
 * A slider rather than a row of chips, though the result set can only change at the
 * park's own limits: nobody knows their child's height as "one of 100, 120 or 140",
 * they know it as 118, and a control that offers three buttons makes them round it
 * themselves — in the direction that gets the answer wrong half the time. The park's
 * limits are drawn on the track instead, as ticks, so the steps are visible without
 * being the only thing on offer.
 *
 * The thumb is drawn as a `<div>` and a transparent `<input type="range">` lies over
 * the whole row — the same construction as the admin's one-field TOTP boxes. A native
 * range input styles its thumb through three vendor pseudo-elements that share no
 * cascade, and the filled part of the track is not addressable at all; drawing both
 * and keeping the real input for the pointer, keyboard and screen-reader behaviour
 * costs one absolutely positioned element and gets all of it for free.
 *
 * Off is a real state (`value === null`), not "the slider happens to sit at the
 * bottom": the bottom position is a legitimate answer (a toddler who clears nothing),
 * and it has to be distinguishable from a visitor who has not touched the control.
 */
export function RiderHeightFilter({
  range,
  value,
  onChange,
  rideableCount,
  totalCount,
  className,
}: RiderHeightFilterProps) {
  const t = useTranslations('parks.heightFilter');
  const inputId = useId();

  const isActive = value !== null;
  // Where the thumb rests before anybody touches it: the park's lowest limit, which is
  // the first position at which the filter has anything to say.
  const displayValue = value ?? range.thresholds[0];

  const span = range.max - range.min;
  const fraction = (cm: number) => (span > 0 ? (cm - range.min) / span : 0);
  // The native thumb's centre travels from half a thumb-width in to half a thumb-width
  // short of the end, so a drawn thumb placed at a plain percentage would run ahead of
  // the pointer at one end and behind it at the other. `--thumb` is that width.
  const offset = (cm: number) =>
    `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${fraction(cm).toFixed(4)})`;

  return (
    <div className={className} style={{ '--thumb': '1rem' } as React.CSSProperties}>
      <div className="flex h-6 items-center gap-2">
        <Ruler className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <label htmlFor={inputId} className="cursor-pointer text-xs font-medium">
          {t('label')}
        </label>
        <span
          className={cn(
            'ml-auto rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
            isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
          )}
        >
          {isActive ? <RiderHeight cm={displayValue} /> : t('inactive')}
        </span>
        {/* `invisible` rather than unmounted: a control that appears on first drag would
            shift the value pill beside it out from under the pointer. */}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t('reset')}
          title={t('reset')}
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring/50 -mr-1 grid size-6 shrink-0 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none',
            !isActive && 'invisible'
          )}
          tabIndex={isActive ? 0 : -1}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="group relative h-5">
        <div className="bg-foreground/12 dark:bg-foreground/15 absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
        <div
          className={cn(
            'absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-colors',
            isActive ? 'bg-primary' : 'bg-muted-foreground/35'
          )}
          style={{ width: offset(displayValue) }}
        />
        {range.thresholds.map((cm) => (
          <span
            key={cm}
            aria-hidden="true"
            className="bg-background/70 dark:bg-background/60 absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: offset(cm) }}
          />
        ))}
        <div
          aria-hidden="true"
          className={cn(
            'border-background absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md transition-[background-color,box-shadow]',
            isActive ? 'bg-primary' : 'bg-muted-foreground',
            'group-has-[:focus-visible]:ring-ring/50 group-has-[:focus-visible]:ring-4'
          )}
          style={{ left: offset(displayValue) }}
        />
        <input
          id={inputId}
          type="range"
          min={range.min}
          max={range.max}
          step={RIDER_HEIGHT_STEP}
          value={displayValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none"
        />
      </div>

      {/* Fixed height and three short cells, so nothing here reflows as the count changes
          and the ride list below never moves while somebody drags. */}
      <div className="text-muted-foreground flex h-4 items-center text-[11px] tabular-nums">
        <span>
          <RiderHeight cm={range.min} />
        </span>
        <span className="flex-1 truncate px-2 text-center">
          {isActive ? t('result', { shown: rideableCount, total: totalCount }) : null}
        </span>
        <span>
          <RiderHeight cm={range.max} />
        </span>
      </div>
    </div>
  );
}
