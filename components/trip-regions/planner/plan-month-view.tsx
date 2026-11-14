'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weekdayLabels } from '@/lib/planner/month-grid';
import {
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  isColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, holidaySignals } from '@/lib/utils/day-signal-styles';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import { formatParkDay } from '@/lib/utils/park-day';
import { parkInitials, TRIP_DAY_SIGNALS, tripMonthWeeks } from '@/lib/trip-regions/plan-week';
import type { TripPlan } from '@/lib/trip-regions/plan';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayMarker, useDayMarkerText, useDayParks, useTicketDayLabel } from './plan-day-bits';

/**
 * The Month view: the trip in its calendar, whole weeks from Monday, drawn as a park's crowd
 * calendar (`ParkCalendarDay`, `ParkCalendarLegend`): a park day is a tile in its crowd tint with
 * the park's two letters and the minutes, a rest or travel day a plain tile with its icon, and the
 * date's holidays the bar along the top. The one marker a day may wear is an icon; the park's full
 * name is in the cell's label. A press opens the day.
 */
export function PlanMonthView({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const tCrowd = useTranslations('parks.crowdLevels');
  const tCommon = useTranslations('common');
  const { locale, parkBySlug } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const ticketLabel = useTicketDayLabel();
  const weeks = useMemo(
    () => tripMonthWeeks(plan.meta.from, plan.meta.to),
    [plan.meta.from, plan.meta.to]
  );
  const dayBy = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);
  const calendarBy = useMemo(
    () => new Map((calendar?.days ?? []).map((d) => [d.date, d])),
    [calendar?.days]
  );
  const headers = useMemo(() => weekdayLabels(locale), [locale]);

  return (
    <div data-plan-view="month" className="flex flex-col gap-1">
      <div
        className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[11px]"
        aria-hidden="true"
      >
        {headers.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell) => {
          const day = dayBy.get(cell.date);
          const dayNumber = Number(cell.date.slice(8));
          const label =
            dayNumber === 1 || cell === weeks[0][0]
              ? formatParkDay(locale, cell.date, { day: 'numeric', month: 'short' })
              : String(dayNumber);
          if (!cell.inTrip || !day) {
            return (
              <li
                key={cell.date}
                className="text-muted-foreground/50 min-h-16 rounded-md p-1 text-[11px] tabular-nums"
              >
                {label}
              </li>
            );
          }
          const isPark = day.kind === 'park' || day.kind === 'hop';
          const full = formatParkDay(locale, cell.date, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const what = isPark
            ? `${parksOf(day)}${day.headlinerWait != null ? `, ${t('week.minutes', { minutes: day.headlinerWait })}` : ''}`
            : t(`day.${day.kind}`);
          const marker = isPark ? markerText(day, calendar) : null;
          const ticketDay = isPark ? ticketLabel(day, plan.meta) : null;
          const rawLevel = isPark ? (day.crowdLevel ?? day.parks[0]?.crowdLevel) : undefined;
          const level = rawLevel && isColoredCrowdLevel(rawLevel) ? rawLevel : null;
          const ink = level ? CROWD_TEXT_CLASS[level] : 'text-muted-foreground';
          const signals = holidaySignals(calendarBy.get(cell.date) ?? null);
          return (
            <li key={cell.date} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenDay(cell.date)}
                aria-label={`${full}: ${[what, ticketDay, marker].filter(Boolean).join(', ')}`}
                className={cn(
                  'relative flex min-h-16 w-full flex-col items-start gap-1 overflow-hidden rounded-md border p-1 text-left transition hover:shadow-sm lg:min-h-20 lg:p-1.5',
                  level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60',
                  PLAN_FOCUS
                )}
              >
                {signals.length > 0 && (
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[3px]">
                    {signals.map((signal) => (
                      <span
                        key={signal}
                        className={cn('h-full flex-1', DAY_SIGNAL_CLASS[signal])}
                      />
                    ))}
                  </span>
                )}
                <span className={cn('text-[13px] leading-none font-bold tabular-nums', ink)}>
                  {label}
                </span>
                {isPark ? (
                  <>
                    <span
                      className={cn(
                        'flex min-w-0 flex-wrap items-baseline gap-x-1 text-[11px] lg:text-[13px]',
                        ink
                      )}
                      aria-hidden="true"
                    >
                      <span className="font-bold">
                        {day.parks
                          .map((p) => parkInitials(parkBySlug.get(p.slug)?.name ?? p.slug))
                          .join(' + ')}
                      </span>
                      {day.headlinerWait != null && (
                        <span className="font-semibold whitespace-nowrap tabular-nums">
                          {day.headlinerWait}
                          <span className="hidden lg:inline"> {tCommon('min')}</span>
                        </span>
                      )}
                    </span>
                    {/* The tier in words, as a park's crowd calendar writes it; a phone's
                        seventh of the width leaves room for the tint alone. */}
                    {level && (
                      <span
                        className={cn(
                          'hidden truncate text-[10px] font-bold tracking-wider uppercase lg:block',
                          ink
                        )}
                        aria-hidden="true"
                      >
                        {tCrowd(level)}
                      </span>
                    )}
                  </>
                ) : day.kind === 'rest' ? (
                  <BedDouble className="text-muted-foreground size-4" aria-hidden="true" />
                ) : day.kind === 'arrival' ? (
                  <PlaneLanding className="text-muted-foreground size-4" aria-hidden="true" />
                ) : (
                  <PlaneTakeoff className="text-muted-foreground size-4" aria-hidden="true" />
                )}
                {isPark && <PlanDayMarker day={day} calendar={calendar} compact />}
              </button>
            </li>
          );
        })}
      </ol>
      <ParkCalendarLegend signals={TRIP_DAY_SIGNALS} className="mt-2" />
      <p className="text-muted-foreground text-xs">{t('month.legend')}</p>
    </div>
  );
}
