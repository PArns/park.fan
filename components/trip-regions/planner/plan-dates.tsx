'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { monthLabel, monthMatrix, monthOf } from '@/lib/planner/month-grid';
import { getDateTimeFormat, getListFormat } from '@/lib/utils/intl-format';
import { addDays, formatParkDayRange } from '@/lib/utils/park-day';
import { MAX_DAYS_AHEAD, MAX_TRIP_DAYS, setTripDates, tripDates } from '@/lib/trip-regions/plan';
import { ticketWindows } from '@/lib/trip-regions/plan-tickets';
import { dateFigure } from '@/lib/trip-regions/plan-week';
import { usePlanContext } from './plan-context';
import { useTripCalendar } from './use-trip-plan';
import { PlanCheckRow } from './plan-controls';
import { PlanMonthGrid } from './plan-month-grid';
import { useResortWord } from './plan-ticket-words';

/** The bars a date grid draws per ticket, in entry order: the first in brand blue, the rest muted. */
const BAR_ROWS = 3;

/**
 * The trip's dates: a month at a time (`PlanMonthGrid`), the first press the arrival and the second
 * the departure, at most {@link MAX_TRIP_DAYS} days. Under each date the shortest big-ride wait of
 * that day, so dates can be compared before anything is planned; a last-year figure is set apart
 * and the legend says so. The tickets' windows are thin bars along the dates, named in a key. Then
 * whether the travel days hold a park.
 */
export function PlanDates({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('tripPlanner');
  const { state, update, today, locale, headliners, live, tickets: catalog } = usePlanContext();
  const resortWord = useResortWord();

  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const windows = useMemo(() => ticketWindows(state.tickets, catalog), [state.tickets, catalog]);
  const shown =
    month ??
    monthOf(
      state.from ?? windows[0]?.from ?? (defaultMonth ? `${defaultMonth}-01` : (today ?? ''))
    );
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : null;

  const cells = useMemo(() => (shown ? monthMatrix(shown) : []), [shown]);
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

  const dayLabel = getDateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const length = tripDates(state).length;
  const anyLastYear = (calendar.data?.days ?? []).some((d) =>
    headliners.some((s) => d.parks[s]?.basis === 'last_year')
  );
  const shortRange = (from: string, to: string) =>
    formatParkDayRange(locale, from, to, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-3">
      <PlanMonthGrid
        month={shown}
        onMonth={setMonth}
        title={shown && today ? monthLabel(shown, locale) : '\u00a0'}
        locale={locale}
        canPrev={Boolean(today && shown && shown > monthOf(today))}
        canNext={Boolean(last && shown && shown < monthOf(last))}
        prevLabel={t('dates.prevMonth')}
        nextLabel={t('dates.nextMonth')}
        gridLabel={t('dates.gridLabel')}
        preferred={start}
        live={live}
        onPick={choose}
        day={(date) => {
          const day = byDate.get(date);
          const wait = dateFigure(day, headliners);
          const lastYear = headliners.some((s) => day?.parks[s]?.basis === 'last_year');
          const isEdge = date === start || date === end;
          const inRange = Boolean(start && end && date > start && date < end);
          const held = windows.filter((w) => date >= w.from && date <= w.to);
          const resorts = [...new Set(held.map((w) => resortWord(w.resort)))];
          return {
            enabled: selectable(date),
            mark: isEdge ? 'edge' : inRange ? 'range' : null,
            figure: wait !== null ? String(wait) : null,
            italic: lastYear,
            bars: windows
              .slice(0, BAR_ROWS)
              .map((w, row) =>
                date >= w.from && date <= w.to ? (row === 0 ? 'primary' : 'muted') : null
              )
              .filter((b): b is 'primary' | 'muted' => b !== null),
            label: [
              today ? dayLabel.format(new Date(`${date}T12:00:00Z`)) : date,
              wait !== null
                ? t(lastYear ? 'dates.waitLastYear' : 'dates.wait', { minutes: wait })
                : null,
              resorts.length > 0
                ? t('tickets.dates.inTicket', {
                    resorts: list.format(resorts),
                    count: resorts.length,
                  })
                : null,
            ]
              .filter(Boolean)
              .join(', '),
          };
        }}
      />

      {windows.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs" data-plan-ticket-key="">
          {windows.slice(0, BAR_ROWS).map((w, row) => (
            <li key={w.index} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'h-[3px] w-5 shrink-0 rounded-full',
                  row === 0 ? 'bg-primary' : 'bg-foreground/55'
                )}
              />
              <span>
                {today
                  ? t('tickets.dates.key', {
                      resort: resortWord(w.resort),
                      range: shortRange(w.from, w.to),
                    })
                  : '\u00a0'}
              </span>
            </li>
          ))}
        </ul>
      )}

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
