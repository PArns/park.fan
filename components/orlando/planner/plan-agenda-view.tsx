'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_TILE_CLASS,
  isColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { formatParkDay } from '@/lib/utils/park-day';
import { dayMarker } from '@/lib/orlando/plan-copy';
import type { TripPlan } from '@/lib/orlando/plan';
import type { TripCalendar } from '@/lib/orlando/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayMarker, useDayMarkerText, useDayParks, useEveningName } from './plan-day-bits';

/**
 * The Agenda view: one card per day, at Level 1, which is three facts at most: the park, its
 * minutes and one marker (an early close, a rest day, the hotel's early slot). Everything else is
 * one press away in the day's sheet. The travel days are a quiet line.
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
  const t = useTranslations('orlandoPlanner');
  const tLevel = useTranslations('parks.crowdLevels');
  const { locale } = usePlanContext();
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const eveningOf = useEveningName();

  return (
    <ol data-plan-view="agenda" className="flex flex-col gap-2">
      {plan.days.map((day) => {
        const isPark = day.kind === 'park' || day.kind === 'hop';
        const tone = day.crowdLevel && isColoredCrowdLevel(day.crowdLevel) ? day.crowdLevel : null;
        const weekday = formatParkDay(locale, day.date, { weekday: 'short' });
        const number = formatParkDay(locale, day.date, { day: 'numeric' });
        const month = formatParkDay(locale, day.date, { month: 'short' });
        const full = formatParkDay(locale, day.date, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        const title = isPark ? parksOf(day) : t(`day.${day.kind}`);
        const minutes =
          day.headlinerWait != null ? t('week.minutes', { minutes: day.headlinerWait }) : null;
        const marker = markerText(day, calendar);
        const evening = eveningOf(day);
        const label = [
          full,
          title,
          minutes,
          tone ? tLevel(tone) : null,
          marker,
          evening ? t('evening.plus', { name: evening }) : null,
        ]
          .filter(Boolean)
          .join(', ');

        if (day.kind === 'arrival' || day.kind === 'departure') {
          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onOpenDay(day.date)}
                aria-label={label}
                className={cn(
                  'text-muted-foreground hover:bg-accent/40 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors',
                  PLAN_FOCUS
                )}
              >
                <span className="w-14 shrink-0 text-xs tabular-nums">{`${weekday} ${number}`}</span>
                <span>{title}</span>
              </button>
            </li>
          );
        }

        return (
          <li key={day.date}>
            <button
              type="button"
              onClick={() => onOpenDay(day.date)}
              aria-label={label}
              className={cn(
                'relative flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-xl border py-2 pr-3 pl-4 text-left transition-colors',
                tone ? CROWD_TILE_CLASS[tone] : 'border-border/60 bg-muted/30',
                'hover:brightness-110',
                PLAN_FOCUS
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  tone ? CROWD_DOT_CLASS[tone] : 'bg-border'
                )}
                aria-hidden="true"
              />
              <span
                className="flex w-11 shrink-0 flex-col items-center leading-tight"
                aria-hidden="true"
              >
                <span className="text-muted-foreground text-[11px] uppercase">{weekday}</span>
                <span className="text-lg font-semibold tabular-nums">{number}</span>
                <span className="text-muted-foreground text-[11px]">{month}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5" aria-hidden="true">
                <span className="truncate text-sm font-semibold">{title}</span>
                {evening && (
                  <span className="text-muted-foreground truncate text-xs">
                    {t('evening.plus', { name: evening })}
                  </span>
                )}
                <PlanDayMarker day={day} calendar={calendar} />
              </span>
              {minutes && (
                <span
                  className={cn(
                    'shrink-0 text-right text-sm font-semibold tabular-nums',
                    // A day the ticket does not cover leads with that, not with its wait.
                    dayMarker(day) === 'outside_ticket' && 'text-muted-foreground font-normal'
                  )}
                  aria-hidden="true"
                >
                  {minutes}
                </span>
              )}
              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
