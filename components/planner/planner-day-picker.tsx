'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';
import { addDays, todayInZone } from '@/lib/planner/park-time';
import { PlannerMonthCalendar } from './planner-month-calendar';
import type { CalendarDay } from '@/lib/api/types';

interface PlannerDayPickerProps {
  /** Currently shown date, YYYY-MM-DD. */
  value: string;
  onChange: (date: string) => void;
  /** Dates the plan already has entries for, marked in the calendar. */
  plannedDates?: readonly string[];
  /** The active park's IANA zone — "Heute" means today THERE, not here. */
  timezone?: string;
  /** The park's own forecast per day, which is what tints the cells. */
  facts?: ReadonlyMap<string, CalendarDay> | null;
  /** The last day the forecast reaches. Past it there is nothing to show. */
  maxDate?: string;
}

/**
 * Which day the plan is for: a month grid in a popover, tinted with the park's crowd forecast like
 * the park's own calendar, because people pick "the Saturday after next", not the 43rd day. The ‹ ›
 * arrows stay for the common move, one day at a time.
 */
export function PlannerDayPicker({
  value,
  onChange,
  plannedDates = [],
  timezone,
  facts,
  maxDate,
}: PlannerDayPickerProps) {
  const t = useTranslations('planner');
  // The reader's locale, never a hard-coded `de-DE`.
  const locale = useLocale();
  const today = todayInZone(timezone);
  const [open, setOpen] = useState(false);

  const atStart = value <= today;
  const atEnd = Boolean(maxDate && value >= maxDate);

  return (
    /* Every control in this bar is 44 px on a phone, the touch floor, so it cannot be shorter. The
       chevrons are 32 px wide so the park name in the same row keeps its room: 148 px in all
       (32 + 2 + 80 + 2 + 32). */
    <div className="planner-phone:gap-0.5 flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(addDays(value, -1))}
        disabled={atStart}
        aria-label={t('calendar.prevDay')}
        className={cn(
          // 32 × 44 on a phone, like its twin below: stepping a day is the most-pressed control in
          // the panel.
          'hover:bg-accent planner-phone:w-8 flex size-7 items-center justify-center rounded-md transition',
          PHONE_TARGET_32,
          atStart && 'pointer-events-none opacity-30'
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-planner-day-trigger=""
            aria-label={t('day.pick')}
            className={cn(
              'bg-accent/40 hover:bg-accent planner-phone:min-w-20 planner-phone:justify-center flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors',
              PHONE_TARGET_32
            )}
          >
            {/* Not on a phone, where the icon's 20 px would come off the park name; the date and
                the chevrons say what this is. */}
            <CalendarDays className="planner-phone:hidden size-3.5 shrink-0" aria-hidden="true" />
            {dayLabel(value, today, locale, t)}
          </button>
        </PopoverTrigger>
        {/* A derived width: with `w-auto` the popover took the width of the month's name. 254 px is
            7 × 32 (the compact cell's `h-8`) + 6 × 2 (`gap-0.5`) + 2 × 8 (`p-2`) + 2 × 1 (border),
            so the columns are exactly 32 px. `align="end"`, or the calendar hangs off the sheet.
            `z-[80]` above the sheet's `z-[70]`, set here because every other popover on the site is
            right at 50. */}
        <PopoverContent align="end" className="z-[80] w-[254px] p-2">
          <PlannerMonthCalendar
            value={value}
            onChange={(date) => {
              onChange(date);
              setOpen(false);
            }}
            today={today}
            plannedDates={plannedDates}
            facts={facts}
            maxDate={maxDate}
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => onChange(addDays(value, 1))}
        disabled={atEnd}
        aria-label={t('calendar.nextDay')}
        className={cn(
          // 32 × 44 on a phone, like its twin above.
          'hover:bg-accent planner-phone:w-8 flex size-7 items-center justify-center rounded-md transition',
          PHONE_TARGET_32,
          atEnd && 'pointer-events-none opacity-30'
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/**
 * What the trigger says: `Heute`, `Morgen`, or `Mi., 02.09.` Noon UTC, never midnight, which is
 * the previous day west of Greenwich.
 */
function dayLabel(date: string, today: string, locale: string, t: (key: string) => string): string {
  if (date === today) return t('day.today');
  if (date === addDays(today, 1)) return t('day.tomorrow');
  return getDateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit' }).format(
    new Date(`${date}T12:00:00Z`)
  );
}
