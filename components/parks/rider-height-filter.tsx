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
 * "How tall is the rider?" — the park page's height filter.
 *
 * A slider rather than a row of chips, though the result set can only change at the
 * park's own limits: nobody knows their child's height as "one of 100, 120 or 140",
 * they know it as 118, and a control that offers three buttons makes them round it
 * themselves — in the direction that gets the answer wrong half the time.
 *
 * But the track is the park's own limits all the same. It used to be a 5 cm ruler
 * with the limits drawn on it as ticks, and most of its travel went to positions
 * that answer exactly like the one before them — dragging to 115 cm on a park whose
 * limits are 100 and 120 moves the thumb and moves nothing else. So the input counts
 * in STOPS (`riderHeightStops`), one per height at which the park's answer changes,
 * and every position on it is a different park. Rounding is the visitor's, and it is
 * the easy direction: a 118 cm child stands on the 100 stop, which is the truth about
 * what they may board.
 *
 * Because the native input now carries an INDEX, `aria-valuetext` carries the height
 * — otherwise a screen reader announces "3 of 7", which is a fact about the widget
 * and not about the park. It is the one place the unit cannot be expressed in CSS the
 * way {@link RiderHeight} does it, so it reads the preference through the context,
 * whose server snapshot is metric and whose real value arrives in the render after
 * hydration.
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
   * Where the thumb rests before anybody touches it: the left end.
   *
   * It used to rest on the park's lowest limit, on the reasoning that this is the
   * first position at which the filter has anything to say. A thumb parked a fifth
   * of the way along a track with a filled bar behind it is a control that has been
   * set, and that is what it looked like — a value nobody chose, presented as a
   * choice. At the end, with no fill and a hollow head, the same control reads as
   * untouched.
   */
  const displayValue = value ?? stops[0];
  /**
   * Defensive: the only writer of `value` is this component and it only ever writes
   * a stop, but a height that fell between two of them (or below the first) belongs
   * on the nearest stop at or below it — the direction that under-promises, and the
   * same rounding a parent does when their child measures 118.
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
      {/* This is the cell's caption row, so the label matches the plain captions over the
          search box and the toggles — the value and the reset ride along in it because
          there is no other row with room for them.

          `relative z-10` for the phone: the track's touch band below reaches up past its
          own 20 px, and without a stacking order of its own the reset button would lose
          the bottom of its target to a slider it is not part of. */}
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

      <div className="group relative h-5">
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
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md transition-colors',
            isActive ? 'border-background bg-primary' : 'border-muted-foreground/60 bg-background',
            'group-has-[:focus-visible]:ring-ring/50 group-has-[:focus-visible]:ring-4'
          )}
          style={{ left: offset(index) }}
        />
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
          className="absolute inset-x-0 top-0 h-full w-full cursor-pointer touch-manipulation appearance-none bg-transparent opacity-0 max-sm:-top-1 max-sm:h-11 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none"
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
