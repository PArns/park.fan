'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown, LayoutList, MapPin, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';
import { plannedDayRows, type PlannerPark } from '@/lib/planner/types';
import { formatParkDay } from '@/lib/utils/park-day';
import { PlannerDayPicker } from './planner-day-picker';
import type { CalendarDay } from '@/lib/api/types';

interface PlannerColumnHeadProps {
  /** Every park the plan holds, which is what this column may switch between. */
  parks: readonly PlannerPark[];
  parkSlug: string | null;
  date: string | null;
  onPickPark: (parkSlug: string) => void;
  onPickDate: (date: string) => void;
  /** A planned day from the chooser's list: its park and its date in one step. */
  onPickDay: (parkSlug: string, date: string) => void;
  /** Starts a park this plan does not have yet — the wizard asks all three questions. */
  onNewPark: () => void;
  /**
   * Opens the plan overview from inside the park list, phone only: the next question after "which
   * park" is "which days". On a desktop the panel header's „Meine Pläne" does it.
   */
  onShowOverview?: () => void;
  /** Absent on the first column: it is the plan's active day and cannot be closed. */
  onClose?: () => void;
  plannedDates?: readonly string[];
  timezone?: string;
  facts?: ReadonlyMap<string, CalendarDay> | null;
  maxDate?: string;
  /**
   * Extra classes for the row: on a phone the panel draws it inside its own `SheetHeader` (see
   * `withHead` in {@link PlannerDayColumn}), which already carries a border and padding. The same
   * element either way, so `[data-planner-column-head]` stays a single answer.
   */
  className?: string;
}

/**
 * What a column says about itself: which park, which day. On the column rather than in the panel's
 * header, because with two columns the header cannot say which one it means.
 *
 * The day picker's ‹ › arrows step a day at a time, which is also how a second day of the same
 * park is put beside the first. The park chooser lists only the plan's own parks; a new park comes
 * from the wizard at the foot of the list, since a park with no day is not a column.
 */
export function PlannerColumnHead({
  parks,
  parkSlug,
  date,
  onPickPark,
  onPickDate,
  onPickDay,
  onNewPark,
  onShowOverview,
  onClose,
  plannedDates = [],
  timezone,
  facts,
  maxDate,
  className,
}: PlannerColumnHeadProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const park = parks.find((entry) => entry.slug === parkSlug) ?? null;
  const rows = plannedDayRows(parks, locale);

  return (
    <div
      data-planner-column-head=""
      // `planner-phone:py-0`: everything in this row is 44 px on a phone, so padding would only
      // take axis.
      className={cn(
        'border-border/60 planner-phone:py-0 flex min-w-0 shrink-0 items-center gap-1 border-b px-2 py-1.5',
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-planner-column-park=""
            aria-label={t('column.pickPark')}
            // `planner-phone:bg-accent/40`: a touch screen has no hover, so without a resting
            // surface beside the tinted day picker this read as a heading rather than a control.
            className={cn(
              'hover:bg-accent planner-phone:bg-accent/40 flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors',
              // Drawn 32 px, 44 to a finger. See `PHONE_TARGET_32`.
              PHONE_TARGET_32
            )}
          >
            <span className="truncate">{park?.name ?? t('column.noPark')}</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        {/* Aligned to the column's own edge, so with two columns the list opens under its own.
            `z-[80]` above the sheet's `z-[70]`, or the portalled list sits behind the panel and no
            row can be tapped; `check:planner` clicks a row to catch that. */}
        <PopoverContent align="start" className="z-[80] w-72 max-w-[calc(100vw-2rem)] p-1">
          <ul className="max-h-64 overflow-y-auto">
            {rows.map((row) => {
              const current = row.slug === parkSlug && (row.date === null || row.date === date);
              return (
                <li key={`${row.slug}@${row.date ?? ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (row.date) onPickDay(row.slug, row.date);
                      else onPickPark(row.slug);
                      setOpen(false);
                    }}
                    data-planner-day-row={row.date ?? undefined}
                    className={cn(
                      // A list a 44 px button opens has 44 px rows on a phone too.
                      'hover:bg-accent planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                      current && 'bg-accent/60'
                    )}
                  >
                    <MapPin
                      className="text-muted-foreground/70 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {row.date && (
                        <span className="tabular-nums">
                          {formatParkDay(locale, row.date, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {' · '}
                        </span>
                      )}
                      {row.name}
                    </span>
                    {current && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {/* The foot of the list, a pair: this row goes to the days that exist, the one below
              starts a park that does not. The border sits on the first, so they read as one
              foot. */}
          {onShowOverview && (
            <button
              type="button"
              onClick={() => {
                onShowOverview();
                setOpen(false);
              }}
              data-planner-overview-row=""
              className="hover:bg-accent border-border/60 planner-phone:min-h-11 mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-left text-xs transition-colors"
            >
              <LayoutList className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t('plans.title')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onNewPark();
              setOpen(false);
            }}
            className={cn(
              'hover:bg-accent border-border/60 planner-phone:min-h-11 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
              !onShowOverview && 'mt-1 border-t'
            )}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('column.addPark')}</span>
          </button>
        </PopoverContent>
      </Popover>

      {date && (
        <PlannerDayPicker
          value={date}
          onChange={onPickDate}
          plannedDates={plannedDates}
          timezone={timezone}
          facts={facts}
          maxDate={maxDate}
        />
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          data-planner-column-close=""
          aria-label={t('column.close')}
          title={t('column.close')}
          className="text-muted-foreground hover:text-foreground hover:bg-accent planner-phone:size-11 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
