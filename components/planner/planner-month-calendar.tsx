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
   * What we know about each day, keyed by date: the crowd forecast, whether the
   * park is open at all, its hours. From the park's own best-days snapshot —
   * which reaches ninety days out, so most of the grid is genuinely unknown and
   * a cell without an entry here simply says nothing.
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
 * A month at a time, which is how somebody picks a day for a trip.
 *
 * It replaces a native `<select>` with sixty consecutive options. That control
 * was defended in its own docstring — a phone renders a native picker, the
 * choice is one of sixty days — and the defence was wrong about the thing that
 * matters: sixty options is a list two screens tall with no weekday columns and
 * no way to see that the 12th is a Saturday without reading every row. Picking
 * "the Saturday after next" is the actual task, and a grid answers it in one
 * glance.
 *
 * What the cells carry beyond the number is the park's own forecast: the crowd
 * tint straight off `CROWD_TILE_CLASS`, so a quiet Tuesday and a full Saturday
 * look here exactly as they look in the park's wait-time calendar. That is the
 * one thing this control can say that a dropdown cannot, and it is the reason
 * the grid is worth its extra markup.
 *
 * Days before today are drawn and NOT selectable, except where the plan already
 * has entries for one: a finished day is a record somebody may want to look at
 * again, and it is the one date the sixty-day window never covered.
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

  // The month on screen, which starts at the chosen day's and then belongs to
  // the visitor: stepping to November and picking nothing must not snap back.
  const [month, setMonth] = useState(() => monthOf(value ?? today));

  const cells = useMemo(() => monthMatrix(month), [month]);
  const headers = useMemo(() => weekdayLabels(locale), [locale]);
  const planned = useMemo(() => new Set(plannedDates), [plannedDates]);

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
            'hover:bg-accent flex items-center justify-center rounded-md transition-colors',
            roomy ? 'size-8' : 'size-7',
            !canStepBack && 'pointer-events-none opacity-30'
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        {/* `min-w-0 flex-1 truncate`, because the box is fixed now and the
            caption is the one thing in this header whose width is a locale's
            business: it may shrink below its content and, in a language that
            writes a very long month, end in an ellipsis rather than push the
            two arrows out of the popover. */}
        <span aria-live="polite" className="min-w-0 flex-1 truncate text-center font-medium">
          {monthLabel(month, locale)}
        </span>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canStepOn}
          aria-label={t('calendar.nextMonth')}
          className={cn(
            'hover:bg-accent flex items-center justify-center rounded-md transition-colors',
            roomy ? 'size-8' : 'size-7',
            !canStepOn && 'pointer-events-none opacity-30'
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {headers.map((header, index) => (
          // The label is the reader's own abbreviation and the position is what
          // carries the meaning, so the key is the column rather than the text —
          // two locales abbreviate two weekdays the same way.
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
          // A past day is reachable only where something was planned on it; a
          // day past the window is not a day this plan can hold.
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
              // The date in full, because the cell shows a number: a screen
              // reader would otherwise announce "17" in a grid of numbers.
              aria-label={new Date(`${cell.date}T12:00:00Z`).toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-md border border-transparent tabular-nums transition-colors',
                roomy ? 'h-10' : 'h-8',
                !cell.inMonth && 'opacity-40',
                disabled && 'text-muted-foreground/50 pointer-events-none',
                closed && 'line-through',
                // The tint is the park's forecast and the selection is the
                // visitor's own choice, so the second replaces the first
                // outright rather than sitting on top of it.
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : [tone && CROWD_TILE_CLASS[tone], !disabled && 'hover:bg-accent']
              )}
            >
              <span className={cn(isToday && !isSelected && 'text-primary font-semibold')}>
                {cell.day}
              </span>
              {/* Two markers, and they never mean the same thing: the ring says
                  "you have entries on this day", the dot is the crowd forecast
                  in the same palette the tint uses, for the days where a tint
                  alone is too subtle to read at 8 px. */}
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
