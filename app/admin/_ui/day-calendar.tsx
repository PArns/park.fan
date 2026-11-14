'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { monthLabel, monthMatrix, shiftMonth, weekdayLabels } from '@/lib/planner/month-grid';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays } from '@/lib/utils/park-day';

const LOCALE = 'de-DE';
const DAY_NAME = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' } as const;

/** Every `YYYY-MM` from the month of `start` to the month of `end`. */
function monthsBetween(start: string, end: string): string[] {
  const months: string[] = [];
  for (let month = start.slice(0, 7); month <= end.slice(0, 7); month = shiftMonth(month, 1)) {
    months.push(month);
  }
  return months;
}

/**
 * Many days picked inside a range, every month of it at once: two or three months side by side as
 * the space allows, small cells, a picked day a filled pill, the padding days of a month left
 * blank so no day shows twice. The grids are the planner's (`lib/planner/month-grid.ts`), Monday
 * first. A click toggles a day, a Shift-click sets every day since the last click the same way,
 * and a month's name toggles the whole month. One tab stop; the arrows move by day and week.
 */
export function DayCalendar({
  start,
  end,
  value,
  onChange,
  label,
  disabled,
}: {
  /** The first and last day that can be picked, `YYYY-MM-DD`. */
  start: string;
  end: string;
  value: readonly string[];
  onChange: (days: string[]) => void;
  /** Names the grid for a screen reader. */
  label: string;
  disabled?: boolean;
}) {
  const months = useMemo(() => monthsBetween(start, end), [start, end]);
  const weekdays = useMemo(() => weekdayLabels(LOCALE), []);
  const picked = new Set(value);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const lastClick = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const tabDay = focusDay && focusDay >= start && focusDay <= end ? focusDay : (value[0] ?? start);

  const write = (days: Set<string>) => onChange([...days].sort());

  function toggle(day: string, event: MouseEvent) {
    const next = new Set(picked);
    const on = !picked.has(day);
    const from = event.shiftKey && lastClick.current ? lastClick.current : day;
    const [low, high] = from < day ? [from, day] : [day, from];
    for (let d = low; d <= high; d = addDays(d, 1)) {
      if (on) next.add(d);
      else next.delete(d);
    }
    lastClick.current = day;
    write(next);
  }

  function toggleMonth(month: string) {
    const days = monthMatrix(month)
      .filter((cell) => cell.inMonth && cell.date >= start && cell.date <= end)
      .map((cell) => cell.date);
    const next = new Set(picked);
    const all = days.every((day) => picked.has(day));
    for (const day of days) {
      if (all) next.delete(day);
      else next.add(day);
    }
    write(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = addDays(tabDay, step);
    if (next < start || next > end) return;
    setFocusDay(next);
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus()
    );
  }

  return (
    <div ref={root} role="group" aria-label={label} onKeyDown={onKeyDown} className="@container">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 @sm:grid-cols-2 @xl:grid-cols-3">
        {months.map((month) => {
          const cells = monthMatrix(month);
          const inRange = cells.filter((c) => c.inMonth && c.date >= start && c.date <= end);
          const count = inRange.filter((c) => picked.has(c.date)).length;
          return (
            <section key={month} aria-label={monthLabel(month, LOCALE)} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleMonth(month)}
                  title="Ganzen Monat wählen oder abwählen"
                  className="hover:text-primary-ink truncate text-xs font-semibold disabled:pointer-events-none"
                >
                  {monthLabel(month, LOCALE)}
                </button>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {count > 0 ? `${count}/${inRange.length}` : ''}
                </span>
              </div>
              <div
                className="text-muted-foreground grid grid-cols-7 text-center text-[10px]"
                aria-hidden="true"
              >
                {weekdays.map((weekday, index) => (
                  <span key={index} className="py-0.5">
                    {weekday.slice(0, 2)}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((cell) => {
                  if (!cell.inMonth) return <span key={cell.date} aria-hidden="true" />;
                  const open = cell.date >= start && cell.date <= end;
                  const on = open && picked.has(cell.date);
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      data-day={cell.date}
                      disabled={disabled || !open}
                      tabIndex={cell.date === tabDay ? 0 : -1}
                      aria-pressed={on}
                      aria-label={getDateTimeFormat(LOCALE, DAY_NAME).format(
                        Date.parse(`${cell.date}T12:00:00Z`)
                      )}
                      onClick={(event) => toggle(cell.date, event)}
                      onFocus={() => setFocusDay(cell.date)}
                      className={cn(
                        'focus-visible:ring-ring mx-auto flex h-8 w-full max-w-9 items-center justify-center rounded-md text-xs tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none sm:h-7',
                        on
                          ? 'bg-primary/20 text-primary-ink font-medium'
                          : open
                            ? 'text-foreground/85 hover:bg-white/[0.06]'
                            : 'text-muted-foreground/30',
                        disabled && open && !on && 'hover:bg-transparent'
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
