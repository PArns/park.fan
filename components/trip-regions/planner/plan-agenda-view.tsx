'use client';

import { DayWeather } from '@/components/common/day-weather';
import { dayWeatherOf } from '@/lib/trip-regions/plan-copy';
import { Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, ChevronRight, Lock, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { lockOn, withSpareRuns, type PlanDay, type TripPlan } from '@/lib/trip-regions/plan';
import { movesBetweenStays, staySections } from '@/lib/trip-regions/plan-stays';
import type { SpareSuggestion } from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayCard } from './plan-day-card';
import { PlanDayGlow } from './plan-day-glow';
import { PlanMoveCard } from './plan-move-card';
import { useBaseName } from './plan-place-words';
import { PlanSpareRun } from './plan-spare-run';
import { PlanStayHeader } from './plan-stay-band';

/** What the Days view hands each park day's card: the editing controls and a line under it. */
export interface PlanDaySlots {
  /** The card's `actions` row for a park day; `null` leaves the row out. */
  dayActions?: (day: PlanDay) => ReactNode;
  /** The card's `hint` line for a park day; `null` leaves it out. */
  dayHint?: (day: PlanDay) => ReactNode;
}

/**
 * The Days view: each park day as a `PlanDayCard`, each run of free days as one `PlanSpareRun`
 * that offers parks to add, a day that is only a move as a `PlanMoveCard`, and the travel days and
 * rest days the visitor's rule set as one quiet row each. A trip across cities is one section per
 * stay, its head with the stay's nights stepper (`PlanStayHeader`), opened by the move that reaches
 * it; a day is listed where it is spent (`staySections`). In a region without bases the cards stand
 * two to a row at a desk.
 */
export function PlanAgendaView({
  plan,
  calendar,
  onOpenDay,
  onFill,
  added,
  dayActions,
  dayHint,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  onOpenDay: (date: string) => void;
  onFill: (suggestion: SpareSuggestion) => void;
  /** The park and date the visitor just put on a free day, whose card reads „neu“. */
  added: { slug: string; date: string } | null;
} & PlanDaySlots) {
  const sections = staySections(plan);
  const cities = movesBetweenStays(plan);
  return (
    <div
      data-plan-view="agenda"
      className={cn('flex flex-col gap-3', cities ? 'lg:max-w-2xl' : 'lg:grid lg:grid-cols-2')}
    >
      {sections.map((section) => (
        <Fragment key={section.stay?.base ?? 'trip'}>
          {section.arrival?.kind === 'travel' && (
            <div className="lg:col-span-2">
              <PlanMoveCard
                day={section.arrival}
                buffer={plan.meta.moveBuffer}
                onOpen={onOpenDay}
              />
            </div>
          )}
          {section.stay && (
            <div className="lg:col-span-2">
              <PlanStayHeader stay={section.stay} />
            </div>
          )}
          {withSpareRuns(
            section.days.filter((d) => d !== section.arrival || d.kind !== 'travel')
          ).map((entry) =>
            entry.type === 'spare' ? (
              <div key={entry.days[0].date} className="lg:col-span-2">
                <PlanSpareRun
                  days={entry.days}
                  plan={plan}
                  calendar={calendar}
                  onOpenDay={onOpenDay}
                  onFill={onFill}
                />
              </div>
            ) : entry.day.kind === 'park' || entry.day.kind === 'hop' ? (
              <PlanDayCard
                key={entry.day.date}
                day={entry.day}
                plan={plan}
                calendar={calendar}
                onOpen={onOpenDay}
                added={
                  added !== null &&
                  added.date === entry.day.date &&
                  entry.day.parks.some((p) => p.slug === added.slug)
                }
                actions={dayActions?.(entry.day)}
                hint={dayHint?.(entry.day)}
              />
            ) : entry.day.kind === 'travel' ? (
              <div key={entry.day.date} className="lg:col-span-2">
                <PlanMoveCard day={entry.day} buffer={plan.meta.moveBuffer} onOpen={onOpenDay} />
              </div>
            ) : (
              <QuietDayRow key={entry.day.date} day={entry.day} onOpenDay={onOpenDay} />
            )
          )}
        </Fragment>
      ))}
    </div>
  );
}

const QUIET_ICON = { arrival: PlaneLanding, departure: PlaneTakeoff, rest: BedDouble } as const;

/**
 * A day without a park and without a run of its own, as one row: the arrival, the departure, and a
 * rest day the visitor's rule set or pinned, which keeps its bed. In a region with bases the
 * arrival and departure name the city. The day's weather at its end, as on a park day's card.
 */
function QuietDayRow({ day, onOpenDay }: { day: PlanDay; onOpenDay: (date: string) => void }) {
  const t = useTranslations('tripPlanner');
  const { locale, region, state } = usePlanContext();
  const baseName = useBaseName();
  const kind = day.kind === 'arrival' || day.kind === 'departure' ? day.kind : 'rest';
  const Icon = QUIET_ICON[kind];
  const city = (region.bases?.length ?? 0) > 0 && day.base ? baseName(day.base) : null;
  const pinned = lockOn(state, day.date) !== null;
  const what =
    city && kind === 'arrival'
      ? t('result.arrivalIn', { city })
      : city && kind === 'departure'
        ? t('result.departureFrom', { city })
        : t(`day.${kind}`);
  const date = formatParkDay(locale, day.date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return (
    <button
      type="button"
      onClick={() => onOpenDay(day.date)}
      aria-label={[
        formatParkDay(locale, day.date, { weekday: 'long', day: 'numeric', month: 'long' }),
        what,
        pinned ? t('marker.pinned') : null,
      ]
        .filter(Boolean)
        .join(', ')}
      data-plan-day={day.kind}
      className={cn(
        'hover:bg-accent/40 relative flex min-h-11 w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-sm transition-colors lg:col-span-2',
        PLAN_FOCUS
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span aria-hidden="true" className="w-28 shrink-0 font-semibold tabular-nums">
        {date}
      </span>
      <span aria-hidden="true" className="text-muted-foreground min-w-0 flex-1 truncate">
        {what}
      </span>
      <DayWeather weather={dayWeatherOf(day)} className="shrink-0 text-xs" />
      {pinned && <Lock className="text-primary-ink size-3.5 shrink-0" aria-hidden="true" />}
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <PlanDayGlow date={day.date} />
    </button>
  );
}
