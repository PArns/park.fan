'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  monthLabel,
  monthMatrix,
  monthOf,
  shiftMonth,
  weekdayLabels,
} from '@/lib/planner/month-grid';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { addDays, formatParkDayRange } from '@/lib/utils/park-day';
import { MAX_DAYS_AHEAD, MAX_TRIP_DAYS, setTripDates, tripDates } from '@/lib/orlando/plan';
import type { TripCalendarDay } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { useTripCalendar } from './use-trip-plan';
import { PlanCheckRow } from './plan-controls';

/**
 * The shortest big-ride wait of a day among the parks that are the day's pick per resort, the
 * figure under each date: one number a visitor can compare dates by. `null` where no park of the
 * day has one.
 */
function shortestWait(
  day: TripCalendarDay | undefined,
  headliners: readonly string[]
): number | null {
  if (!day) return null;
  let best: number | null = null;
  for (const slug of headliners) {
    const cell = day.parks[slug];
    if (cell?.status !== 'OPERATING' || cell.headlinerWait == null) continue;
    if (best === null || cell.headlinerWait < best) best = cell.headlinerWait;
  }
  return best;
}

/**
 * The trip's dates: a month at a time (`lib/planner/month-grid.ts`, the day planner's own grid),
 * the first press the arrival and the second the departure, at most {@link MAX_TRIP_DAYS} days.
 * Under each date the shortest big-ride wait of that day, so dates can be compared before anything
 * is planned; a last-year figure is set apart and the legend says so. One tab stop for the grid,
 * arrows move by day and week. Then whether the travel days hold a park.
 */
export function PlanDates({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('orlandoPlanner');
  const { state, update, today, locale, headliners, live } = usePlanContext();

  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const shown =
    month ?? monthOf(state.from ?? (defaultMonth ? `${defaultMonth}-01` : (today ?? '')));
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : null;

  const cells = useMemo(() => (shown ? monthMatrix(shown) : []), [shown]);
  const headers = useMemo(() => weekdayLabels(locale), [locale]);

  const windowFrom = cells.length && today ? (cells[0].date < today ? today : cells[0].date) : null;
  const windowTo =
    cells.length && last ? (cells.at(-1)!.date > last ? last : cells.at(-1)!.date) : null;
  const calendar = useTripCalendar(
    windowFrom && windowTo && windowFrom <= windowTo ? windowFrom : null,
    windowFrom && windowTo && windowFrom <= windowTo ? windowTo : null
  );
  const byDate = useMemo(
    () => new Map((calendar.data?.days ?? []).map((d) => [d.date, d])),
    [calendar.data]
  );

  const start = pendingFrom ?? state.from;
  const end = pendingFrom ? null : state.to;
  const selectable = (date: string) => {
    if (!today || !last || date < today || date > last) return false;
    if (pendingFrom && date > addDays(pendingFrom, MAX_TRIP_DAYS - 1)) return false;
    return true;
  };

  const choose = (date: string) => {
    if (!pendingFrom || date < pendingFrom) {
      setPendingFrom(date);
      return;
    }
    setPendingFrom(null);
    update((s) => setTripDates(s, pendingFrom, date));
  };

  const [focusDate, setFocusDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabDate =
    (focusDate && cells.some((c) => c.date === focusDate) && focusDate) ||
    (start && cells.some((c) => c.date === start) && start) ||
    cells.find((c) => c.inMonth && selectable(c.date))?.date ||
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
    if (monthOf(next) !== shown) setMonth(monthOf(next));
    setFocusDate(next);
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-plan-date="${next}"]`)?.focus()
    );
  };

  const dayLabel = getDateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const length = tripDates(state).length;
  const anyLastYear = (calendar.data?.days ?? []).some((d) =>
    headliners.some((s) => d.parks[s]?.basis === 'last_year')
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => shown && setMonth(shiftMonth(shown, -1))}
          disabled={!live || !today || !shown || shown <= monthOf(today)}
          aria-label={t('dates.prevMonth')}
          className="hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30 lg:size-9"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-center text-sm font-semibold"
        >
          {shown && today ? monthLabel(shown, locale) : '\u00a0'}
        </span>
        <button
          type="button"
          onClick={() => shown && setMonth(shiftMonth(shown, 1))}
          disabled={!live || !last || !shown || shown >= monthOf(last)}
          aria-label={t('dates.nextMonth')}
          className="hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none disabled:opacity-30 lg:size-9"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        className="text-muted-foreground grid grid-cols-7 gap-0.5 text-center text-[11px]"
        aria-hidden="true"
      >
        {headers.map((header, index) => (
          <span key={index}>{header}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="group"
        aria-label={t('dates.gridLabel')}
        onKeyDown={onKeyDown}
        // Six rows whatever the month, so the panel keeps its height from month to month.
        className="grid min-h-[17.5rem] grid-cols-7 gap-0.5"
      >
        {cells.map((cell) => {
          const enabled = live && cell.inMonth && selectable(cell.date);
          const day = byDate.get(cell.date);
          const wait = shortestWait(day, headliners);
          const lastYear = headliners.some((s) => day?.parks[s]?.basis === 'last_year');
          const isStart = cell.date === start;
          const isEnd = cell.date === end;
          const inRange = Boolean(start && end && cell.date > start && cell.date < end);
          const label = [
            today ? dayLabel.format(new Date(`${cell.date}T12:00:00Z`)) : cell.date,
            wait !== null
              ? t(lastYear ? 'dates.waitLastYear' : 'dates.wait', { minutes: wait })
              : null,
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={cell.date}
              type="button"
              data-plan-date={cell.date}
              disabled={!enabled}
              tabIndex={cell.date === tabDate ? 0 : -1}
              aria-label={label}
              aria-pressed={isStart || isEnd || inRange}
              onClick={() => choose(cell.date)}
              onFocus={() => setFocusDate(cell.date)}
              className={cn(
                'focus-visible:ring-ring flex h-11 flex-col items-center justify-center rounded-md text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none',
                !cell.inMonth && 'invisible',
                !enabled && 'text-muted-foreground/40',
                enabled && !isStart && !isEnd && 'hover:bg-accent',
                inRange && 'bg-primary/15',
                (isStart || isEnd) && 'bg-primary text-primary-foreground font-semibold'
              )}
            >
              <span className="leading-4">{cell.day}</span>
              <span
                className={cn(
                  'h-3.5 text-[10px] leading-3.5',
                  isStart || isEnd ? 'text-primary-foreground/85' : 'text-muted-foreground',
                  lastYear && 'italic'
                )}
                aria-hidden="true"
              >
                {enabled && wait !== null ? wait : ''}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs leading-snug">
        {t('dates.legend')}
        {anyLastYear ? ` ${t('dates.legendLastYear')}` : ''}
      </p>

      <p className="min-h-5 text-sm font-medium" aria-live="polite">
        {!today
          ? '\u00a0'
          : pendingFrom
            ? t('dates.pickDeparture')
            : state.from && state.to
              ? `${formatParkDayRange(locale, state.from, state.to, { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('dates.dayCount', { count: length })}`
              : t('dates.pickArrival')}
      </p>

      <div className="flex flex-col">
        <PlanCheckRow
          checked={state.arrival === 'park'}
          disabled={!live}
          onChange={(on) => update((s) => ({ ...s, arrival: on ? 'park' : 'free' }))}
          label={t('dates.arrivalPark')}
          hint={t('dates.arrivalParkHint')}
        />
        <PlanCheckRow
          checked={state.departure === 'park'}
          disabled={!live}
          onChange={(on) => update((s) => ({ ...s, departure: on ? 'park' : 'free' }))}
          label={t('dates.departurePark')}
          hint={t('dates.departureParkHint')}
        />
      </div>
      {pendingFrom && (
        <p className="text-muted-foreground text-xs">
          {t('dates.maxLength', { days: MAX_TRIP_DAYS })}
        </p>
      )}
    </div>
  );
}
