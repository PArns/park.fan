'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CROWD_DOT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { formatParkDay } from '@/lib/utils/park-day';
import { dayMarker } from '@/lib/trip-regions/plan-copy';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayMarker, useDayMarkerText, useDayParks, useEveningName } from './plan-day-bits';

/**
 * The list view, the days once: one row per day with three facts at most, the park, its minutes and
 * one marker (an early close, the hotel's early slot, its evening), and a thin bar in the day's
 * crowd tint. A rest or travel day is its name alone. Everything else is one press away in the
 * day's sheet.
 */
export function PlanAgendaView({
  plan,
  calendar,
  onOpenDay,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  return (
    <ol data-plan-view="agenda" className="flex flex-col lg:max-w-2xl">
      {plan.days.map((day) => (
        <PlanListRow key={day.date} day={day} calendar={calendar} onOpenDay={onOpenDay} />
      ))}
    </ol>
  );
}

/** One day of the list view. */
export function PlanListRow({
  day,
  calendar,
  onOpenDay,
}: {
  day: PlanDay;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
}) {
  const t = useTranslations('tripPlanner');
  const tLevel = useTranslations('parks.crowdLevels');
  const { locale } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const eveningOf = useEveningName();
  const isPark = day.kind === 'park' || day.kind === 'hop';
  const tone = day.crowdLevel && isColoredCrowdLevel(day.crowdLevel) ? day.crowdLevel : null;
  const title = isPark ? parksOf(day) : t(`day.${day.kind}`);
  const minutes =
    day.headlinerWait != null ? t('answer.about', { minutes: day.headlinerWait }) : null;
  // A rest day is said by its name; its marker would say it a second time.
  const marker = day.kind === 'rest' ? null : markerText(day, calendar);
  const evening = eveningOf(day);
  const label = [
    formatParkDay(locale, day.date, { weekday: 'long', day: 'numeric', month: 'long' }),
    title,
    minutes,
    tone ? tLevel(tone) : null,
    marker,
    evening ? t('evening.plus', { name: evening }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenDay(day.date)}
        aria-label={label}
        data-plan-day={day.kind}
        className={cn(
          'hover:bg-accent/40 flex min-h-11 w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-sm transition-colors',
          PLAN_FOCUS
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-7 w-1 shrink-0 rounded-full',
            tone ? CROWD_DOT_CLASS[tone] : isPark ? 'bg-border' : 'bg-transparent'
          )}
        />
        <span aria-hidden="true" className="text-muted-foreground w-16 shrink-0 tabular-nums">
          {formatParkDay(locale, day.date, { weekday: 'short', day: 'numeric' })}
        </span>
        <span
          aria-hidden="true"
          className={cn('min-w-0 flex-1 truncate', !isPark && 'text-muted-foreground')}
        >
          {title}
          {evening && (
            <span className="text-muted-foreground"> {t('evening.plus', { name: evening })}</span>
          )}
        </span>
        {marker && (
          <PlanDayMarker
            day={day}
            calendar={calendar}
            className="hidden max-w-40 shrink-0 sm:inline-flex"
          />
        )}
        {minutes && (
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 tabular-nums',
              // A day the ticket does not cover leads with that, not with its wait.
              dayMarker(day) === 'outside_ticket' ? 'text-muted-foreground' : 'font-medium'
            )}
          >
            {minutes}
          </span>
        )}
        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </button>
    </li>
  );
}
