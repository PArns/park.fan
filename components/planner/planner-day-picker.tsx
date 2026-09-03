'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, todayInZone } from '@/lib/planner/park-time';

interface PlannerDayPickerProps {
  /** Currently shown date, YYYY-MM-DD. */
  value: string;
  onChange: (date: string) => void;
  /** Dates the plan already has entries for, marked in the list. */
  plannedDates?: readonly string[];
  /** The active park's IANA zone — "Heute" means today THERE, not here. */
  timezone?: string;
}

/** How far ahead the dropdown offers. The API's day payload reaches further. */
const DAYS_AHEAD = 60;

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
export function PlannerDayPicker({
  value,
  onChange,
  plannedDates = [],
  timezone,
}: PlannerDayPickerProps) {
  const t = useTranslations('planner');
  // The reader's locale, not a hard-coded `de-DE`: this shipped German weekday
  // abbreviations into a list that is otherwise fully translated.
  const locale = useLocale();
  const today = todayInZone(timezone);
  const planned = useMemo(() => new Set(plannedDates), [plannedDates]);

  const options = useMemo(() => {
    const list: { date: string; label: string }[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = addDays(today, i);
      const label =
        i === 0 ? t('day.today') : i === 1 ? t('day.tomorrow') : formatDay(date, locale);
      list.push({ date, label: planned.has(date) ? `${label} ·` : label });
    }
    // A day already being planned that has scrolled out of the window still has
    // to be selectable, or switching to it from the park list would show a
    // dropdown that disagrees with the panel below it. That is every day in the
    // PAST, which the window never covers.
    //
    // Formatted like the rest of the list rather than dropped in as `value`,
    // which is what it was: a raw `2026-09-02` in a control whose every other
    // entry reads "Mi., 02.09." — and beside an overview calling the same day
    // "Mi., 02. September". Machine text in a UI that is otherwise fully
    // translated, and it only ever showed up on a finished day, which is the
    // one nobody re-checks.
    if (!list.some((o) => o.date === value)) {
      list.unshift({ date: value, label: formatDay(value, locale) });
    }
    return list;
  }, [today, value, planned, locale, t]);

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

/**
 * One date as this control writes them: `Mi., 02.09.`
 *
 * Noon UTC, never midnight: `new Date('2026-09-02')` is midnight UTC, which is
 * the previous day for every reader west of Greenwich — the label would name a
 * different day from the value it sits on.
 */
function formatDay(date: string, locale: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}
