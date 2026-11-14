'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripPlan } from '@/lib/trip-regions/plan';
import { planSavings } from '@/lib/trip-regions/plan-copy';
import { shownTotals } from '@/lib/trip-regions/plan-week';
import type { TripCalendar } from '@/lib/trip-regions/types';
import { useTripEvents } from './plan-context';
import { PLAN_FOCUS } from './plan-controls';

/**
 * The peak wait on the planned days as a card: the figure large, how much less it is than the
 * average of the trip's days (or that the order barely matters), the two as bars in primary blue
 * (never crowd colours, which mean something else), the forecast's error per ride and day, and
 * „Wie genau ist das?“ with the average and the error in sentences. The figures are the shown ones
 * (`shownTotals`); whether the order matters stays the API's call (`planSavings`).
 */
export function PlanPeakCard({
  plan,
  calendar,
  className,
}: {
  plan: TripPlan;
  calendar: TripCalendar | undefined;
  className?: string;
}) {
  const t = useTranslations('tripPlanner');
  const track = useTripEvents();
  const savings = planSavings({ ...plan.totals, ...shownTotals(plan, calendar) });
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!savings) return null;
  const top = Math.max(savings.planned, savings.average, 1);
  const bars = [
    { key: 'plan', label: t('result.peak.plan'), value: savings.planned, ink: 'bg-primary' },
    {
      key: 'average',
      label: t('result.peak.average'),
      value: savings.average,
      ink: 'bg-primary/35',
    },
  ];
  return (
    <section
      className={cn(
        'border-border/60 bg-card flex flex-col gap-3 rounded-2xl border p-4',
        className
      )}
      aria-label={t('result.peak.title')}
      data-plan-savings=""
    >
      <h4 className="text-muted-foreground text-xs font-medium">{t('result.peak.title')}</h4>
      <div className="flex items-start gap-3">
        <p className="shrink-0 leading-none">
          <span className="text-4xl font-semibold tabular-nums">{savings.planned}</span>{' '}
          <span className="text-muted-foreground text-lg">{t('result.peak.unit')}</span>
        </p>
        <p className="min-w-0 pt-0.5 text-sm">
          {savings.kind === 'flat'
            ? t('result.peak.flat')
            : t.rich('result.peak.saved', {
                saved: savings.saved,
                strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
              })}
        </p>
      </div>
      <p className="sr-only">
        {t('result.peak.bars', { planned: savings.planned, average: savings.average })}
      </p>
      <div className="flex flex-col gap-1.5" aria-hidden="true">
        {bars.map((bar) => (
          <div key={bar.key} className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground w-16 shrink-0">{bar.label}</span>
            <span className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full">
              <span
                className={cn('block h-full rounded-full', bar.ink)}
                style={{ width: `${(bar.value / top) * 100}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right tabular-nums">
              {t('week.minutes', { minutes: bar.value })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {savings.expectedError !== null && (
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs tabular-nums">
            {t('result.peak.error', { minutes: savings.expectedError })}
          </span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            if (!open) track('trip_accuracy_opened', { surface: 'plan' });
            setOpen(!open);
          }}
          className={cn(
            'text-primary-ink inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm font-medium underline-offset-4 hover:underline lg:min-h-8',
            PLAN_FOCUS
          )}
        >
          {t('answer.accuracy')}
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>
      <p id={id} hidden={!open} className="text-muted-foreground text-sm">
        {t('answer.averageDay', { minutes: savings.average })}
        {savings.expectedError !== null &&
          ` ${t('answer.error', { minutes: savings.expectedError })}`}
      </p>
    </section>
  );
}
