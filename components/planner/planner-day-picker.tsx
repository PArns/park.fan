'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlannerDayPickerProps {
  /** Currently shown date, YYYY-MM-DD. */
  value: string;
  onChange: (date: string) => void;
  /** Dates the plan already has entries for, marked in the list. */
  plannedDates?: readonly string[];
}

/** How far ahead the dropdown offers. The API's day payload reaches further. */
const DAYS_AHEAD = 60;

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Which day the plan is for.
 *
 * A native `<select>` rather than a calendar widget, and that is the right
 * trade here: this sits in a panel that is already a dialog, the choice is one
 * of sixty consecutive days, and a phone renders a native picker that beats
 * anything a scrolling month grid does in a bottom sheet. The park page's
 * calendar remains the place to browse a month and see crowd levels; this is
 * for switching between the days someone is actually planning.
 *
 * The arrows are the reason it is not JUST a select: stepping a day at a time is
 * the common move — "what if we went Saturday instead" — and it should not cost
 * a dropdown, a scroll and a tap.
 */
export function PlannerDayPicker({ value, onChange, plannedDates = [] }: PlannerDayPickerProps) {
  const t = useTranslations('planner');
  const today = todayLocal();
  const planned = useMemo(() => new Set(plannedDates), [plannedDates]);

  const options = useMemo(() => {
    const list: { date: string; label: string }[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = addDays(today, i);
      const weekday = new Date(`${date}T12:00:00Z`).toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      });
      const label = i === 0 ? t('day.today') : i === 1 ? t('day.tomorrow') : weekday;
      list.push({ date, label: planned.has(date) ? `${label} ·` : label });
    }
    // A day already being planned that has scrolled out of the window still has
    // to be selectable, or switching to it from the park list would show a
    // dropdown that disagrees with the panel below it.
    if (!list.some((o) => o.date === value)) {
      list.unshift({ date: value, label: value });
    }
    return list;
  }, [today, value, planned, t]);

  const atStart = value <= today;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(addDays(value, -1))}
        disabled={atStart}
        aria-label={t('day.pick')}
        className={cn(
          'hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors',
          atStart && 'pointer-events-none opacity-30'
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <label className="sr-only" htmlFor="planner-day">
        {t('day.label')}
      </label>
      <select
        id="planner-day"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-accent/40 hover:bg-accent h-7 rounded-md px-2 text-xs transition-colors"
      >
        {options.map((option) => (
          <option key={option.date} value={option.date}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onChange(addDays(value, 1))}
        aria-label={t('day.pick')}
        className="hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
