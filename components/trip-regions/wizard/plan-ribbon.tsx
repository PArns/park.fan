'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatParkDay } from '@/lib/utils/park-day';
import { CROWD_SOLID_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import type { PlanDay, TripPlan } from '@/lib/trip-regions/plan';
import { planSavings } from '@/lib/trip-regions/plan-copy';
import { parkLabel, shownTotals } from '@/lib/trip-regions/plan-week';
import { usePlanContext } from '../planner/plan-context';
import { PLAN_FOCUS } from '../planner/plan-controls';
import { useStatePlan, useTripCalendar } from '../planner/use-trip-plan';

/**
 * The plan in one row while the assistant asks: a field per trip day, a park day in its crowd colour
 * with the park's code, a free day empty, a travel day dashed, and under it the plan's park days,
 * free days and peak wait. Every answer redraws it, which is how the visitor sees what an answer
 * did. The row is a picture (`aria-hidden`); the line beside it is what a screen reader hears, and
 * it changes only once the API has answered, not on every press. "Show the plan now" (`onShow`)
 * leaves the assistant for the result; the finale passes `ends` for the first and last date under
 * the row instead of the line, which its own heading says.
 */
export function PlanRibbon({
  onShow,
  ends = false,
  className,
}: {
  onShow?: () => void;
  ends?: boolean;
  className?: string;
}) {
  const t = useTranslations('tripPlanner.wizard.ribbon');
  const tResult = useTranslations('tripPlanner.result');
  const { state, locale } = usePlanContext();
  const plan = useStatePlan();
  const calendar = useTripCalendar(state.from, state.to);
  const data = plan.data;
  if (!state.from || !state.to) return null;
  const savings = data
    ? planSavings({ ...data.totals, ...shownTotals(data, calendar.data) })
    : null;
  const day = (date: string) =>
    formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div
      className={cn('flex flex-col gap-1.5', plan.waiting && 'opacity-60', className)}
      data-plan-ribbon=""
    >
      <RibbonCells plan={data} />
      {ends && (
        <p className="text-muted-foreground flex justify-between text-xs" aria-hidden="true">
          <span>{day(state.from)}</span>
          <span>{day(state.to)}</span>
        </p>
      )}
      {!ends && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 text-sm" aria-live="polite">
            {data && plan.current ? (
              <>
                <span className="font-semibold">
                  {t('parkDays', { count: data.totals.parkDays })}
                  {data.totals.restDays > 0 && `, ${t('free', { count: data.totals.restDays })}`}
                </span>
                {savings && (
                  <span className="text-muted-foreground">
                    {' · '}
                    {t('peak', { minutes: savings.planned })}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{tResult('loading')}</span>
            )}
          </p>
          {onShow && (
            <button
              type="button"
              onClick={onShow}
              data-wizard-show-plan=""
              className={cn(
                'text-primary-ink -mr-1 inline-flex min-h-11 items-center gap-0.5 rounded-md px-1 text-sm font-medium underline-offset-4 hover:underline lg:min-h-8',
                PLAN_FOCUS
              )}
            >
              {t('show')}
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** The row of fields, one per day of the plan; a muted row of the same height before the first. */
function RibbonCells({ plan }: { plan: TripPlan | undefined }) {
  const { parkBySlug, config } = usePlanContext();
  const code = (slug: string) => {
    const park = parkBySlug.get(slug);
    return park ? parkLabel(park, config.parkShortNames, 'tight') : '';
  };
  const days = plan?.days ?? [];
  return (
    <div
      aria-hidden="true"
      className="grid h-7 gap-0.5 sm:h-8 sm:gap-1"
      style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}
    >
      {days.length === 0 ? (
        <span className="bg-muted/60 rounded-sm" />
      ) : (
        days.map((day) => (
          <span
            key={day.date}
            className={cn(
              'flex min-w-0 items-center justify-center overflow-hidden rounded-sm text-[10px] leading-none font-bold transition-colors duration-300',
              cellClass(day)
            )}
          >
            {(day.kind === 'park' || day.kind === 'hop') && day.parks[0]
              ? code(day.parks[0].slug)
              : null}
          </span>
        ))
      )}
    </div>
  );
}

/** A day's field: its crowd colour on a park day, the muted ground on a travel day's ends. */
function cellClass(day: PlanDay): string {
  if (day.kind === 'park' || day.kind === 'hop') {
    const level = day.crowdLevel ?? day.parks[0]?.crowdLevel;
    return level && isColoredCrowdLevel(level)
      ? CROWD_SOLID_CLASS[level]
      : 'bg-muted text-foreground border-border border';
  }
  if (day.kind === 'travel') return 'border-primary/60 border border-dashed';
  if (day.kind === 'arrival' || day.kind === 'departure') return 'bg-muted';
  return 'border-border/70 border';
}
