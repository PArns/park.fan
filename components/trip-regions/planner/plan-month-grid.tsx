'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PlaneLanding,
  PlaneTakeoff,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, type DaySignal } from '@/lib/utils/day-signal-styles';
import { monthMatrix, monthOf, shiftMonth, weekdayLabels } from '@/lib/planner/month-grid';
import { addDays } from '@/lib/utils/park-day';

/** The pick under a date of {@link PlanMonthGrid}: the park's label in its crowd ink. */
export interface PlanGridPick {
  /** The park's label in a phone cell and in a wide one (`parkLabel`). */
  code: string;
  wide: string;
  /** The park's name: the label's tooltip and part of the date's accessible name. */
  name: string;
  level: ColoredCrowdLevel | null;
  /** The park has not published its hours for the date: the code is underlined dotted. */
  unpublished: boolean;
  /**
   * The park whose day guests leave early for a party that night: a ticket on the row, with the
   * park's wide label where the cell has room, and the party in words as its tooltip.
   */
  party: { wide: string; name: string } | null;
}

/** How one date of {@link PlanMonthGrid} is drawn and named. */
export interface PlanGridDay {
  enabled: boolean;
  /** The accessible name: the written date and what it holds. */
  label: string;
  /**
   * A trip's arrival or departure (a ring and its plane), a lone chosen date such as a ticket's
   * first day (a ring), a date between arrival and departure, or none.
   */
  mark: 'start' | 'end' | 'edge' | 'range' | null;
  /** Where the date sits in a chosen range: the light band behind the tiles runs from start to end. */
  band?: 'start' | 'middle' | 'end';
  /** The tint is last year's measured day, not a forecast: the tile's border is dashed. */
  lastYear?: boolean;
  /** Up to three thin bars along the cell's foot: the tickets whose window holds the date. */
  bars?: ReadonlyArray<'primary' | 'muted'>;
  /** The date's crowd level, which tints the cell as a park's crowd calendar does. */
  level?: ColoredCrowdLevel | null;
  /** The holidays and school breaks the date falls in, as the calendar's bar along the top. */
  signals?: readonly DaySignal[];
  /** The park with the shortest lines under the date, a row each (the Dates step draws one). */
  picks?: readonly PlanGridPick[];
  /** New Year's Eve, marked beside the date. */
  nye?: boolean;
}

const NAV_BUTTON =
  'hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30 lg:size-9';

/**
 * A month of dates to pick from, a month at a time (`lib/planner/month-grid.ts`): the trip's two
 * dates in the Dates step, one date for a ticket's first day. One tab stop for the grid, the arrows
 * move by day and week and turn the month at its edge, so the grid works the same in both places.
 * A date with a crowd level is the crowd calendar's tile (`ParkCalendarDay`): tinted, the day in
 * the level's ink, holidays as the bar along the top. `rich` makes room under the date for its pick,
 * a park label with a ticket where a party night sends the day guests home early. Arrival and
 * departure are a ring with their plane on its corner, so the rows stay free, and a light band
 * behind the tiles joins the dates between. `onShow` hears every date pointed at, focused or picked.
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
  onShow,
  rich = false,
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
  onShow?: (date: string) => void;
  /** Taller cells with each resort's pick under the date. */
  rich?: boolean;
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
        className={cn(
          'grid grid-cols-7 gap-1',
          rich ? 'min-h-[19.25rem] lg:min-h-[22.25rem]' : 'min-h-[19.25rem]'
        )}
      >
        {cells.map((cell) => {
          const d = days.get(cell.date);
          const enabled = live && Boolean(d?.enabled);
          const ring = d?.mark === 'start' || d?.mark === 'end' || d?.mark === 'edge';
          const level = enabled ? (d?.level ?? null) : null;
          const Plane =
            d?.mark === 'start' ? PlaneLanding : d?.mark === 'end' ? PlaneTakeoff : null;
          const picks = enabled ? (d?.picks ?? []) : [];
          return (
            // The tiles are opaque so the range's band shows only around them, in the gaps, and
            // never mixes with a crowd tint.
            <div
              key={cell.date}
              className={cn('@container relative', !cell.inMonth && 'invisible')}
            >
              {cell.inMonth && d?.band && (
                <span
                  aria-hidden="true"
                  data-plan-range={d.band}
                  className={cn(
                    'bg-primary/15 absolute -inset-y-0.5',
                    d.band === 'start'
                      ? '-right-0.5 left-1/2'
                      : d.band === 'end'
                        ? 'right-1/2 -left-0.5'
                        : '-inset-x-0.5'
                  )}
                />
              )}
              <button
                type="button"
                data-plan-date={cell.date}
                disabled={!enabled}
                tabIndex={cell.date === tabDate ? 0 : -1}
                aria-label={d?.label ?? cell.date}
                aria-pressed={d?.mark != null}
                onClick={() => {
                  onPick(cell.date);
                  onShow?.(cell.date);
                }}
                onPointerEnter={onShow && enabled ? () => onShow(cell.date) : undefined}
                onFocus={() => {
                  setFocusDate(cell.date);
                  if (enabled) onShow?.(cell.date);
                }}
                className={cn(
                  'focus-visible:ring-ring relative flex w-full flex-col items-center overflow-hidden rounded-md text-sm tabular-nums transition focus-visible:ring-2 focus-visible:outline-none',
                  rich
                    ? 'h-12 justify-start gap-0.5 pt-1.5 lg:h-14 lg:pt-2'
                    : 'h-12 justify-center',
                  enabled ? 'bg-background hover:shadow-sm' : 'text-muted-foreground/40',
                  ring && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-1'
                )}
              >
                {enabled && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-0 rounded-md border',
                      level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60',
                      d?.lastYear && 'border-dashed'
                    )}
                  />
                )}
                {enabled && d?.signals && d.signals.length > 0 && (
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[3px]">
                    {d.signals.map((signal) => (
                      <span
                        key={signal}
                        className={cn('h-full flex-1', DAY_SIGNAL_CLASS[signal])}
                      />
                    ))}
                  </span>
                )}
                <span
                  className={cn(
                    'relative flex items-center gap-0.5 leading-4',
                    (ring || level || picks.length > 0) && 'font-bold',
                    level && CROWD_TEXT_CLASS[level]
                  )}
                >
                  {cell.day}
                  {enabled && d?.nye && (
                    <Sparkles className="text-primary-ink size-3" aria-hidden="true" />
                  )}
                </span>
                {picks.length > 0 && (
                  <span
                    className="relative flex flex-col items-center text-[11px] leading-[13px] font-bold tracking-wide lg:text-xs lg:leading-4"
                    aria-hidden="true"
                  >
                    {picks.map((pick) => (
                      <span key={pick.code} className="flex items-center gap-px">
                        <span
                          title={pick.name}
                          data-plan-pick={pick.code}
                          className={cn(
                            pick.level ? CROWD_TEXT_CLASS[pick.level] : 'text-muted-foreground',
                            pick.unpublished && 'underline decoration-dotted underline-offset-2'
                          )}
                        >
                          {pick.wide === pick.code ? (
                            pick.code
                          ) : (
                            <>
                              <span className="@min-[4.5rem]:hidden">{pick.code}</span>
                              <span className="hidden @min-[4.5rem]:inline">{pick.wide}</span>
                            </>
                          )}
                        </span>
                        {pick.party && (
                          <span
                            title={pick.party.name}
                            className="text-crowd-ink-high flex items-center gap-px"
                          >
                            <Ticket className="size-2.5 shrink-0" />
                            <span className="hidden text-[10px] @min-[4.5rem]:inline">
                              {pick.party.wide}
                            </span>
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                )}
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
              {enabled && Plane && (
                <span
                  aria-hidden="true"
                  className="bg-primary text-primary-foreground ring-background absolute -top-1.5 -right-1.5 z-20 flex size-4 items-center justify-center rounded-full ring-2"
                >
                  <Plane className="size-2.5" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
