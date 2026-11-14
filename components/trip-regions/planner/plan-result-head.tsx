'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { formatParkDayRange } from '@/lib/utils/park-day';
import type { TripPlan } from '@/lib/trip-regions/plan';
import { tripCounts } from '@/lib/trip-regions/plan-copy';
import { planStays } from '@/lib/trip-regions/plan-stays';
import { usePlanContext } from './plan-context';
import { useBaseName } from './plan-place-words';
import { MoveIcon, StayMarker } from './plan-stay-band';

/**
 * The trip's head: its dates as the heading, its figures in one line („17 Tage · 6 Parktage ·
 * 8 Tage frei · 2 Städte“; a rest day the visitor's rule set is counted apart from the free ones),
 * and on a trip across cities the route strip: the arrival, each stay with its number, city and
 * nights, the mode of each move between them, the departure. The strip is a picture of the line
 * read out before it.
 */
export function PlanResultHead({ plan }: { plan: TripPlan }) {
  const t = useTranslations('tripPlanner');
  const { locale } = usePlanContext();
  const baseName = useBaseName();
  const counts = tripCounts(plan);
  const stays = planStays(plan);
  const figures = [
    t('result.head.days', { count: counts.days }),
    t('result.head.parkDays', { count: counts.parkDays }),
    counts.freeDays > 0 ? t('result.head.freeDays', { count: counts.freeDays }) : null,
    counts.restDays > 0 ? t('result.head.restDays', { count: counts.restDays }) : null,
    stays.length > 1 ? t('result.head.cities', { count: stays.length }) : null,
  ].filter(Boolean);
  const modeTo = (from: string, to: string) =>
    plan.days.find((d) => d.move?.from === from && d.move.to === to)?.move?.mode ?? 'rail';

  return (
    <div className="flex flex-col gap-2" data-plan-head="">
      <h3 className="text-xl font-semibold tracking-tight lg:text-2xl">
        {formatParkDayRange(locale, plan.meta.from, plan.meta.to, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </h3>
      <p className="text-muted-foreground text-sm">{figures.join(' · ')}</p>
      {stays.length > 1 && (
        <div className="border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-2">
          <span className="sr-only">
            {t('result.head.routeLabel', {
              stays: stays
                .map((s) => t('route.stayShort', { city: baseName(s.base), count: s.nights }))
                .join(', '),
            })}
          </span>
          <PlaneLanding className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {stays.map((stay, i) => (
            <Fragment key={stay.base}>
              {i > 0 && (
                <span aria-hidden="true" className="flex min-w-4 flex-1 items-center gap-1">
                  <span className="bg-primary/40 h-px flex-1" />
                  <MoveIcon
                    mode={modeTo(stays[i - 1].base, stay.base)}
                    className="text-primary-ink size-4 shrink-0"
                  />
                  <span className="bg-primary/40 h-px flex-1" />
                </span>
              )}
              <span aria-hidden="true" className="flex min-w-0 shrink items-center gap-1.5">
                <StayMarker number={stay.number} />
                <span className="truncate text-sm font-medium">{baseName(stay.base)}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{stay.nights}</span>
              </span>
            </Fragment>
          ))}
          <PlaneTakeoff className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
