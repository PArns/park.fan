'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
 * Which day the plan is for.
 *
 * A month grid in a popover, and it replaced a native `<select>` carrying sixty
 * consecutive days. That control had a written defence — a phone renders a
 * native picker, the choice is one of sixty consecutive days — and it missed the
 * task: nobody picks "the 43rd day from now", they pick the Saturday after next.
 * Sixty options is a list two screens tall with no columns, so the weekday of
 * each row has to be read off its label one at a time, and the days that are
 * already planned are marked with a trailing `·` that means nothing to anyone
 * who has not been told. The grid answers all of it at a glance, and it carries
 * the park's crowd forecast in the same colours as the park's own calendar.
 *
 * The arrows stay, and they are still the reason this is not just a calendar:
 * stepping a day at a time is the common move — "what if we went Saturday
 * instead" — and it should not cost a popover, a scan and a tap.
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
  // The reader's locale, not a hard-coded `de-DE`: this shipped German weekday
  // abbreviations into a control that is otherwise fully translated.
  const locale = useLocale();
  const today = todayInZone(timezone);
  const [open, setOpen] = useState(false);

  const atStart = value <= today;
  const atEnd = Boolean(maxDate && value >= maxDate);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(addDays(value, -1))}
        disabled={atStart}
        aria-label={t('calendar.prevDay')}
        className={cn(
          'hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors',
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
            className="bg-accent/40 hover:bg-accent flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors"
          >
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {dayLabel(value, today, locale, t)}
          </button>
        </PopoverTrigger>
        {/* A DERIVED width, not `w-auto` and not one picked by eye.
            `w-auto` made the popover shrink-to-fit, and what it fitted was its
            widest ROW — which is never the day grid (`grid-cols-7` is
            `minmax(0,1fr)` and takes whatever it is given) but the caption,
            whose text is `toLocaleDateString(locale, {month:'long'})`. So the
            calendar was as wide as the month's name: measured in de-DE,
            Juli 144.8 px, August 155.5, September 177.9, Oktober 161.6,
            November 173.4 — the popover coming out at caption + 82 px every
            time, and the seven columns silently redistributing the difference.
            254 px is 7 × 32 (the compact cell's `h-8`) + 6 × 2 (`gap-0.5`)
            + 2 × 8 (`p-2`) + 2 × 1 (border), so the columns land on exactly
            32.000 px and the box no longer depends on the calendar.
            `align="end"` because this sits at the right edge of the panel
            header — centred on it, the calendar hangs off the sheet. */}
        {/* ABOVE the panel. Both this and `SheetContent` are portalled to
          `<body>`, and the shared popover is `z-50` against the sheet's
          `z-[70]` — so inside the planner this opened BEHIND the panel that
          triggered it, which from the outside is a button that does nothing.
          Fixed at the call site rather than in `components/ui/popover.tsx`:
          every other popover on the site is correct at 50, and raising the
          primitive would put a park page's popover over the header. */}
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
          'hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors',
          atEnd && 'pointer-events-none opacity-30'
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/**
 * What the trigger says: `Heute`, `Morgen`, or `Mi., 02.09.`
 *
 * Noon UTC, never midnight: `new Date('2026-09-02')` is midnight UTC, which is
 * the previous day for every reader west of Greenwich — the label would name a
 * different day from the value it sits on.
 */
function dayLabel(date: string, today: string, locale: string, t: (key: string) => string): string {
  if (date === today) return t('day.today');
  if (date === addDays(today, 1)) return t('day.tomorrow');
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}
