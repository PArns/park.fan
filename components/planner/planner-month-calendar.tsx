'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  monthLabel,
  monthMatrix,
  monthOf,
  shiftMonth,
  weekdayLabels,
} from '@/lib/planner/month-grid';
import { CROWD_DOT_CLASS, CROWD_TILE_CLASS } from '@/lib/utils/crowd-level-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { ColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import type { CalendarDay } from '@/lib/api/types';

interface PlannerMonthCalendarProps {
  /** The day currently chosen, or `null` while nothing is. */
  value: string | null;
  onChange: (date: string) => void;
  /** Today in the PARK's zone — see `park-time.ts`. Earlier days are read-only. */
  today: string;
  /** Days of this park that already have entries. Marked, and always reachable. */
  plannedDates?: readonly string[];
  /**
   * What we know about each day, keyed by date, from the park's best-days snapshot. It reaches
   * about ninety days, so a cell without an entry says nothing.
   */
  facts?: ReadonlyMap<string, CalendarDay> | null;
  /** The last day that may be picked. Beyond it the grid stops stepping. */
  maxDate?: string;
  /** A phone popover has less room than a wizard step. */
  size?: 'compact' | 'roomy';
}

/** The crowd level a cell paints with, or `null` where there is nothing to paint. */
function toneOf(day: CalendarDay | undefined): ColoredCrowdLevel | null {
  if (!day) return null;
  const level = day.crowdLevel;
  if (level === 'closed' || level === 'unknown') return null;
  return level;
}

/**
 * A month at a time, which is how somebody picks a day for a trip ("the Saturday after next"). The
 * cells carry the park's forecast in `CROWD_TILE_CLASS` tints, as in the park's own calendar. Past
 * days are drawn and not selectable, except where the plan has entries on one: a finished day is a
 * record somebody may want to see again.
 */
export function PlannerMonthCalendar({
  value,
  onChange,
  today,
  plannedDates = [],
  facts,
  maxDate,
  size = 'compact',
}: PlannerMonthCalendarProps) {
  const t = useTranslations('planner');
  const locale = useLocale();

  // The month on screen starts at the chosen day's and then belongs to the visitor.
  const [month, setMonth] = useState(() => monthOf(value ?? today));

  const cells = useMemo(() => monthMatrix(month), [month]);
  const headers = useMemo(() => weekdayLabels(locale), [locale]);
  const planned = useMemo(() => new Set(plannedDates), [plannedDates]);
  // One cached formatter for the 42 cell labels; `toLocaleDateString` with options builds one per
  // call.
  const dayLabel = getDateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const todayMonth = monthOf(today);
  const maxMonth = maxDate ? monthOf(maxDate) : null;
  const canStepBack = month > todayMonth || planned.size > 0;
  const canStepOn = !maxMonth || month < maxMonth;

  const roomy = size === 'roomy';

  return (
    <div className={cn('select-none', roomy ? 'text-sm' : 'text-xs')}>
      <div className="mb-1 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canStepBack}
          aria-label={t('calendar.prevMonth')}
          className={cn(
            'hover:bg-accent flex items-center justify-center rounded-md transition',
            roomy ? 'size-8' : 'size-7',
            // The phone floor, on both sizes.
            'planner-phone:size-11',
            !canStepBack && 'pointer-events-none opacity-30'
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        {/* `min-w-0 flex-1 truncate`: the box is fixed, and a long month name ends in an ellipsis
            rather than pushing the arrows out. */}
        <span aria-live="polite" className="min-w-0 flex-1 truncate text-center font-medium">
          {monthLabel(month, locale)}
        </span>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canStepOn}
          aria-label={t('calendar.nextMonth')}
          className={cn(
            'hover:bg-accent flex items-center justify-center rounded-md transition',
            roomy ? 'size-8' : 'size-7',
            // The phone floor, on both sizes.
            'planner-phone:size-11',
            !canStepOn && 'pointer-events-none opacity-30'
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {headers.map((header, index) => (
          // Keyed by column: two locales abbreviate two weekdays the same way.
          <span key={index} className="py-0.5">
            {header}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const day = facts?.get(cell.date);
          const tone = toneOf(day);
          const isPlanned = planned.has(cell.date);
          const isPast = cell.date < today;
          const isToday = cell.date === today;
          const isSelected = cell.date === value;
          // A past day only where something was planned on it; past the window, never.
          const disabled = (isPast && !isPlanned) || Boolean(maxDate && cell.date > maxDate);
          const closed = day?.crowdLevel === 'closed';

          return (
            <button
              key={cell.date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.date)}
              aria-current={isSelected ? 'date' : undefined}
              data-planner-day={cell.date}
              // The date in full, or a screen reader announces "17" in a grid of numbers.
              aria-label={dayLabel.format(new Date(`${cell.date}T12:00:00Z`))}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-md border border-transparent tabular-nums transition-colors',
                roomy ? 'h-10' : 'h-8',
                // The height is the half of a cell that can grow without touching the derived
                // 254 px popover width.
                'planner-phone:h-11',
                !cell.inMonth && 'opacity-40',
                disabled && 'text-muted-foreground/50 pointer-events-none',
                closed && 'line-through',
                // The selection replaces the forecast tint rather than sitting on top of it.
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : [tone && CROWD_TILE_CLASS[tone], !disabled && 'hover:bg-accent']
              )}
            >
              <span className={cn(isToday && !isSelected && 'text-primary font-semibold')}>
                {cell.day}
              </span>
              {/* Two markers that never mean the same thing: the ring is "you have entries here",
                  the dot is the crowd forecast for days where the tint is too subtle at 8 px. */}
              {isPlanned && (
                <span
                  className={cn(
                    'absolute inset-0 rounded-md border',
                    isSelected ? 'border-primary-foreground/60' : 'border-primary/70'
                  )}
                  aria-hidden="true"
                />
              )}
              {tone && !isSelected && (
                <span
                  className={cn('mt-0.5 h-1 w-1 rounded-full', CROWD_DOT_CLASS[tone])}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
