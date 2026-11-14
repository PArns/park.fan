'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CROWD_DOT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { formatParkDay } from '@/lib/utils/park-day';
import { dayMarker } from '@/lib/trip-regions/plan-copy';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import { staySections } from '@/lib/trip-regions/plan-stays';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';
import { PlanDayMarker, useDayMarkerText, useDayParks, useEveningName } from './plan-day-bits';
import { MoveIcon, PlanMoveRow, PlanStayHeader, useMoveWords } from './plan-stay-band';
import { useBaseName } from './plan-place-words';

/**
 * The list view, the days once: one row per day with three facts at most, the park, its minutes and
 * one marker (an early close, the hotel's early slot, its evening), and a thin bar in the day's
 * crowd tint. A rest or travel day is its name alone. Everything else is one press away in the
 * day's sheet. A trip across cities is one section per stay, each opening on the move that reaches
 * it, and a day is listed where it is spent: a morning move's park day in the city reached, an
 * evening move's in the city left.
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
  const sections = staySections(plan);
  return (
    <ol data-plan-view="agenda" className="flex flex-col lg:max-w-2xl">
      {sections.map((section) => (
        <Fragment key={section.stay?.base ?? 'trip'}>
          {section.arrival && <PlanMoveRow day={section.arrival} onOpenDay={onOpenDay} />}
          {section.stay && (
            <li>
              <PlanStayHeader stay={section.stay} />
            </li>
          )}
          {section.days.map((day) => (
            <PlanListRow key={day.date} day={day} calendar={calendar} onOpenDay={onOpenDay} />
          ))}
        </Fragment>
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
  const { locale, state } = usePlanContext();
  const pinned = state.locks.some((l) => l.date === day.date);
  const parksOf = useDayParks();
  const markerText = useDayMarkerText();
  const eveningOf = useEveningName();
  const moveWords = useMoveWords();
  const baseName = useBaseName();
  const isPark = day.kind === 'park' || day.kind === 'hop';
  const tone = day.crowdLevel && isColoredCrowdLevel(day.crowdLevel) ? day.crowdLevel : null;
  const title = isPark
    ? parksOf(day)
    : day.kind === 'travel' && day.move
      ? `${t('day.travel')} · ${t('move.toCity', { city: baseName(day.move.to) })}`
      : t(`day.${day.kind}`);
  // A park day with a move says when the park starts or when the move leaves, in place of its marker.
  const moveLine =
    isPark && day.move?.when === 'morning' && day.startAt
      ? t('move.after', { time: moveWords.time(day.startAt) })
      : isPark && day.move?.when === 'evening'
        ? t('move.then', { city: baseName(day.move.to), time: moveWords.time(day.move.departAt) })
        : null;
  const minutes =
    day.headlinerWait != null ? t('answer.about', { minutes: day.headlinerWait }) : null;
  // A rest day is said by its name; its marker would say it a second time.
  const marker = day.kind === 'rest' || moveLine ? null : markerText(day, calendar);
  const evening = eveningOf(day);
  const label = [
    formatParkDay(locale, day.date, { weekday: 'long', day: 'numeric', month: 'long' }),
    title,
    minutes,
    tone ? tLevel(tone) : null,
    marker ?? moveLine,
    evening ? t('evening.plus', { name: evening }) : null,
    pinned ? t('marker.pinned') : null,
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
        {moveLine && day.move && (
          <span
            aria-hidden="true"
            className="text-primary-ink hidden max-w-48 shrink-0 items-center gap-1 text-xs sm:inline-flex"
          >
            <MoveIcon mode={day.move.mode} className="size-3.5 shrink-0" />
            <span className="truncate">{moveLine}</span>
          </span>
        )}
        {pinned && (
          <Lock
            className="text-primary-ink size-3.5 shrink-0"
            aria-hidden="true"
            data-plan-pinned=""
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
