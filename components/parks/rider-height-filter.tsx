'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { RiderHeight } from '@/components/common/unit-display';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatRiderHeight } from '@/lib/utils/temperature';
import { cn } from '@/lib/utils';

interface RiderHeightFilterProps {
  /** Every height the slider may be set to, ascending — see `riderHeightStops`. */
  stops: number[];
  /** Chosen rider height in cm, or `null` while the filter is off. */
  value: number | null;
  onChange: (cm: number | null) => void;
  /** Attractions this height may ride / attractions the park has. */
  rideableCount: number;
  totalCount: number;
  className?: string;
}

/**
 * „How tall is the rider?": the park page's height filter.
 *
 * A slider, because a parent knows their child as 118 cm, not as "one of 100, 120 or 140". The
 * input counts in stops (`riderHeightStops`), one per height at which the park's answer changes, so
 * every position gives a different answer, and a child between two stops rounds down to the truth
 * about what they may board. Because the input carries an index, `aria-valuetext` carries the
 * height, in the unit the preference context gives.
 *
 * The thumb is a drawn `<div>` under a transparent `<input type="range">` covering the row: a
 * native range thumb styles through three unrelated vendor pseudo-elements and its fill not at all,
 * and the real input keeps pointer, keyboard and screen-reader behaviour. Off is a real state
 * (`value === null`), distinct from the bottom stop, which is a legitimate answer.
 */
export function RiderHeightFilter({
  stops,
  value,
  onChange,
  rideableCount,
  totalCount,
  className,
}: RiderHeightFilterProps) {
  const t = useTranslations('parks.heightFilter');
  const { unit } = useTemperatureUnit();
  const inputId = useId();

  const isActive = value !== null;
  /**
   * Where the thumb rests before anybody touches it: the left end, with no fill and a hollow head,
   * so the control reads as untouched rather than as a value nobody chose.
   */
  const displayValue = value ?? stops[0];
  /**
   * Defensive: this component only ever writes a stop, but a height between two stops (or below the
   * first) goes to the nearest stop at or below it, the direction that under-promises.
   */
  const index = Math.max(
    0,
    stops.findLastIndex((cm) => cm <= displayValue)
  );

  const lastIndex = stops.length - 1;
  // The native thumb's centre travels from half a thumb-width in to half a thumb-width
  // short of the end, so a drawn thumb placed at a plain percentage would run ahead of
  // the pointer at one end and behind it at the other. `--thumb` is that width.
  const offset = (i: number) =>
    `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${(i / lastIndex).toFixed(4)})`;

  return (
    <div className={className} style={{ '--thumb': '1rem' } as React.CSSProperties}>
      {/* The cell's caption row, matching the plain captions over the search box and toggles; the
          value and the reset ride in it because no other row has room. `relative z-10` because
          below `sm` the track's touch band reaches up past its own 20 px and would take the bottom
          of the reset button's target. */}
      <div className="relative z-10 flex h-6 items-center gap-2 max-sm:h-11">
        <label
          htmlFor={inputId}
          className="text-muted-foreground cursor-pointer text-xs font-medium"
        >
          {t('label')}
        </label>
        <span
          className={cn(
            'ml-auto rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
            isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
          )}
        >
          {isActive ? <RiderHeight cm={stops[index]} /> : t('inactive')}
        </span>
        {/* `invisible` rather than unmounted: a control that appears on first drag would
            shift the value pill beside it out from under the pointer. */}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t('reset')}
          title={t('reset')}
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring/50 -mr-1 grid size-6 shrink-0 touch-manipulation place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none max-sm:size-11',
            !isActive && 'invisible'
          )}
          tabIndex={isActive ? 0 : -1}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative h-5">
        <div className="bg-foreground/12 dark:bg-foreground/15 absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full" />
        {/* No fill at all while the filter is off — a coloured bar behind the head is
            the thing that made an untouched control look set. */}
        {isActive && (
          <div
            className="bg-primary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={{ width: offset(index) }}
          />
        )}
        {/* Every interior stop is a detent, so every interior stop gets a mark. The two
            ends are the track's own edges and need none. */}
        {stops.slice(1, -1).map((cm, i) => (
          <span
            key={cm}
            aria-hidden="true"
            className="bg-background/70 dark:bg-background/60 absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: offset(i + 1) }}
          />
        ))}
        <input
          id={inputId}
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={index}
          aria-valuetext={formatRiderHeight(stops[index], unit)}
          onChange={(e) => onChange(stops[Number(e.target.value)])}
          // A click at the resting position sets the input to the value it already
          // has, so `change` never fires and the filter cannot be switched on at its
          // own left end. The press itself is the intent; the drag that may follow
          // overwrites it a moment later.
          onPointerDown={() => {
            if (!isActive) onChange(stops[0]);
          }}
          // The drawn track is 20 px tall and a finger is not. Below `sm` the real input
          // spills out of it to the 44 px phone tier — 4 px up (the caption row above
          // outranks it, see its `z-10`) and the rest down over the scale line, which is
          // this slider's own label and has nothing else to be tapped for.
          className="peer absolute inset-x-0 top-0 h-full w-full cursor-pointer touch-manipulation appearance-none bg-transparent opacity-0 max-sm:-top-1 max-sm:h-11 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none"
        />
        {/* The drawn head comes after the input so it can read the input's keyboard focus as
            `peer-focus-visible` instead of through a `:has()` rule
            (docs/rules/no-has-selector-in-the-stylesheet.md). It takes no pointer events: the
            invisible input stays the target. */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md transition-colors',
            isActive ? 'border-background bg-primary' : 'border-muted-foreground/60 bg-background',
            'peer-focus-visible:ring-ring/50 peer-focus-visible:ring-4'
          )}
          style={{ left: offset(index) }}
        />
      </div>

      {/* Fixed height and three short cells, so nothing here reflows as the count changes
          and the ride list below never moves while somebody drags. */}
      <div className="text-muted-foreground flex h-4 items-center text-[11px] tabular-nums">
        <span>
          <RiderHeight cm={stops[0]} />
        </span>
        <span className="flex-1 truncate px-2 text-center">
          {isActive ? t('result', { shown: rideableCount, total: totalCount }) : t('hint')}
        </span>
        <span>
          <RiderHeight cm={stops[lastIndex]} />
        </span>
      </div>
    </div>
  );
}
