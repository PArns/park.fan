'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weekdayLabels } from '@/lib/planner/month-grid';
import { CROWD_CHIP_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { formatParkDay } from '@/lib/utils/park-day';
import { parkInitials, tripMonthWeeks } from '@/lib/orlando/plan-week';
import type { TripPlan } from '@/lib/orlando/plan';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayMarker, useDayMarkerText, useDayParks, useTicketDayLabel } from './plan-day-bits';

/**
 * The Month view: the trip in its calendar, whole weeks from Monday. A trip day holds the park's
 * two letters in its crowd tint and the minutes, or a bed for a rest day, and the one marker a day
 * may wear as an icon; the park's full name is in the cell's label. A press opens the day.
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
  const t = useTranslations('orlandoPlanner');
  const { locale, parkBySlug } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const ticketLabel = useTicketDayLabel();
  const weeks = useMemo(
    () => tripMonthWeeks(plan.meta.from, plan.meta.to),
    [plan.meta.from, plan.meta.to]
  );
  const dayBy = useMemo(() => new Map(plan.days.map((d) => [d.date, d])), [plan.days]);
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
          return (
            <li key={cell.date} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenDay(cell.date)}
                aria-label={`${full}: ${[what, ticketDay, marker].filter(Boolean).join(', ')}`}
                className={cn(
                  'border-border/60 bg-muted/20 hover:bg-muted/40 flex min-h-16 w-full flex-col items-start gap-1 rounded-md border p-1 text-left transition-colors',
                  PLAN_FOCUS
                )}
              >
                <span className="text-[11px] font-semibold tabular-nums">{label}</span>
                {isPark ? (
                  <span className="flex min-w-0 flex-wrap items-center gap-1">
                    {day.parks.map((p) => {
                      const level = p.crowdLevel ?? day.crowdLevel;
                      const tone = level && isColoredCrowdLevel(level) ? level : null;
                      return (
                        <span
                          key={p.slug}
                          aria-hidden="true"
                          className={cn(
                            'rounded px-1 text-[11px] leading-4 font-bold',
                            tone ? CROWD_CHIP_CLASS[tone] : 'border-border/60 border border-dashed'
                          )}
                        >
                          {parkInitials(parkBySlug.get(p.slug)?.name ?? p.slug)}
                        </span>
                      );
                    })}
                    {day.headlinerWait != null && (
                      <span className="text-[11px] tabular-nums" aria-hidden="true">
                        {day.headlinerWait}
                      </span>
                    )}
                  </span>
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
      <p className="text-muted-foreground text-xs">{t('month.legend')}</p>
    </div>
  );
}
