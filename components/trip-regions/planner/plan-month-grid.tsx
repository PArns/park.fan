'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, type DaySignal } from '@/lib/utils/day-signal-styles';
import { monthMatrix, monthOf, shiftMonth, weekdayLabels } from '@/lib/planner/month-grid';
import { addDays } from '@/lib/utils/park-day';

/** How one date of {@link PlanMonthGrid} is drawn and named. */
export interface PlanGridDay {
  enabled: boolean;
  /** The accessible name: the written date and what it holds. */
  label: string;
  /** A chosen end (filled), a date inside the chosen range (tinted), or neither. */
  mark: 'edge' | 'range' | null;
  /** The small figure under the date. */
  figure?: string | null;
  /** The figure is last year's, set apart in italics. */
  italic?: boolean;
  /** Up to three thin bars along the cell's foot: the tickets whose window holds the date. */
  bars?: ReadonlyArray<'primary' | 'muted'>;
  /** The date's crowd level, which tints the cell as a park's crowd calendar does. */
  level?: ColoredCrowdLevel | null;
  /** The holidays and school breaks the date falls in, as the calendar's bar along the top. */
  signals?: readonly DaySignal[];
}

const NAV_BUTTON =
  'hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30 lg:size-9';

/**
 * A month of dates to pick from, a month at a time (`lib/planner/month-grid.ts`): the trip's two
 * dates in the Dates step, one date for a ticket's first day. One tab stop for the grid, the arrows
 * move by day and week and turn the month at its edge, so the grid works the same in both places.
 * A date with a crowd level is the crowd calendar's tile (`ParkCalendarDay`): tinted, the day and
 * its figure in the level's ink, holidays as the bar along the top. A chosen end is a ring, so the
 * tint stays readable under it.
 */
export function PlanMonthGrid({
  month,
  onMonth,
  title,
  locale,
  canPrev,
  canNext,
  prevLabel,
  nextLabel,
  gridLabel,
  preferred,
  day,
  onPick,
  live,
}: {
  /** `YYYY-MM`. */
  month: string;
  onMonth: (month: string) => void;
  /** The month's name, or a non-breaking space until the browser's clock is read. */
  title: string;
  locale: string;
  canPrev: boolean;
  canNext: boolean;
  prevLabel: string;
  nextLabel: string;
  gridLabel: string;
  /** The date that takes the grid's tab stop when it is shown: the chosen one. */
  preferred: string | null;
  day: (date: string) => PlanGridDay;
  onPick: (date: string) => void;
  live: boolean;
}) {
  const cells = useMemo(() => monthMatrix(month), [month]);
  const headers = useMemo(() => weekdayLabels(locale), [locale]);
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const days = new Map(cells.map((c) => [c.date, c.inMonth ? day(c.date) : null]));
  const tabDate =
    (focusDate && cells.some((c) => c.date === focusDate) && focusDate) ||
    (preferred && cells.some((c) => c.date === preferred) && preferred) ||
    cells.find((c) => c.inMonth && days.get(c.date)?.enabled)?.date ||
    cells.find((c) => c.inMonth)?.date;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const step = steps[event.key];
    if (!step || !tabDate) return;
    event.preventDefault();
    const next = addDays(tabDate, step);
    if (monthOf(next) !== month) onMonth(monthOf(next));
    setFocusDate(next);
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-plan-date="${next}"]`)?.focus()
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, -1))}
          disabled={!live || !canPrev}
          aria-label={prevLabel}
          className={NAV_BUTTON}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-center text-sm font-semibold"
        >
          {title}
        </span>
        <button
          type="button"
          onClick={() => onMonth(shiftMonth(month, 1))}
          disabled={!live || !canNext}
          aria-label={nextLabel}
          className={NAV_BUTTON}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[11px]"
        aria-hidden="true"
      >
        {headers.map((header, index) => (
          <span key={index}>{header}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="group"
        aria-label={gridLabel}
        onKeyDown={onKeyDown}
        // Six rows whatever the month, so the panel keeps its height from month to month.
        className="grid min-h-[19.25rem] grid-cols-7 gap-1"
      >
        {cells.map((cell) => {
          const d = days.get(cell.date);
          const enabled = live && Boolean(d?.enabled);
          const edge = d?.mark === 'edge';
          const level = enabled ? (d?.level ?? null) : null;
          const ink = level ? CROWD_TEXT_CLASS[level] : null;
          return (
            <button
              key={cell.date}
              type="button"
              data-plan-date={cell.date}
              disabled={!enabled}
              tabIndex={cell.date === tabDate ? 0 : -1}
              aria-label={d?.label ?? cell.date}
              aria-pressed={d?.mark != null}
              onClick={() => onPick(cell.date)}
              onFocus={() => setFocusDate(cell.date)}
              className={cn(
                'focus-visible:ring-ring relative flex h-12 flex-col items-center justify-center overflow-hidden rounded-md border text-sm tabular-nums transition focus-visible:ring-2 focus-visible:outline-none',
                !cell.inMonth && 'invisible',
                !enabled && 'text-muted-foreground/40 border-transparent',
                enabled && (level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60'),
                enabled && !edge && 'hover:shadow-sm',
                d?.mark === 'range' && 'ring-primary/60 ring-1 ring-inset',
                edge && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-1'
              )}
            >
              {enabled && d?.signals && d.signals.length > 0 && (
                <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[3px]">
                  {d.signals.map((signal) => (
                    <span key={signal} className={cn('h-full flex-1', DAY_SIGNAL_CLASS[signal])} />
                  ))}
                </span>
              )}
              <span className={cn('leading-4', (edge || level) && 'font-bold', ink)}>
                {cell.day}
              </span>
              <span
                className={cn(
                  'h-3.5 text-[10px] leading-3.5',
                  ink ? cn('font-semibold', ink) : 'text-muted-foreground',
                  d?.italic && 'italic'
                )}
                aria-hidden="true"
              >
                {enabled && d?.figure != null ? d.figure : ''}
              </span>
              {d?.bars?.map((tone, row) => (
                <span
                  key={row}
                  aria-hidden="true"
                  data-plan-ticket-bar={row}
                  className={cn(
                    'absolute inset-x-1 h-[3px] rounded-full',
                    tone === 'primary' ? 'bg-primary' : 'bg-foreground/55'
                  )}
                  style={{ bottom: 1 + row * 4 }}
                />
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
