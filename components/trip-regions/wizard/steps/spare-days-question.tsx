'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDays, CalendarMinus, Plus, Sparkles, Sun } from 'lucide-react';
import { getListFormat } from '@/lib/utils/intl-format';
import type { TripPlan, TripPlanState } from '@/lib/trip-regions/plan';
import {
  answerSpare,
  spareQuestion,
  type SpareChoice,
  type SpareQuestion,
} from '@/lib/trip-regions/spare-days';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext, useTripEvents } from '../../planner/plan-context';
import { useStatePlan } from '../../planner/use-trip-plan';

/** The question as first asked, with the plan and the state it was asked for. */
interface Asked {
  question: SpareQuestion;
  plan: TripPlan;
  state: TripPlanState;
}

/**
 * "8 days without a park": asked in the Parks step once a trip has more free days than park days,
 * or more than three in a row (`spareQuestion`), with four answers, each with its effect on the
 * right: more parks (the API's `spareDayParks`), more days in the chosen parks, free days spread
 * over the trip (what the plan does already, so chosen to start with), or a shorter trip, last
 * because it changes the dates. An answer writes the plan's state at once and the ribbon shows it;
 * another answer starts again from the state the question was asked for. The figures stay those of
 * that plan while the step is open, so the cards do not change under the press.
 */
export function SpareDaysQuestion() {
  const t = useTranslations('tripPlanner.wizard.spare');
  const tRibbon = useTranslations('tripPlanner.wizard.ribbon');
  const { update, regionOrder, headliners, locale, parkName, state } = usePlanContext();
  const track = useTripEvents();
  const plan = useStatePlan();
  const titleId = useId();
  const [asked, setAsked] = useState<Asked | null>(null);
  const [choice, setChoice] = useState<SpareChoice>('free');

  const fresh = plan.data && plan.current ? spareQuestion(plan.data, regionOrder) : null;
  if (!asked && fresh && plan.data) setAsked({ question: fresh, plan: plan.data, state });
  if (!asked) return null;
  const { question: q } = asked;
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });

  const pick = (next: SpareChoice) => {
    if (next === choice) return;
    track('trip_spare_choice', { choice: next });
    setChoice(next);
    update(() => answerSpare(asked.state, next, q, asked.plan, regionOrder, headliners));
  };

  return (
    <section
      aria-labelledby={titleId}
      className="border-primary/25 bg-primary/5 flex flex-col gap-3 rounded-2xl border p-3 sm:p-4"
      data-wizard-spare=""
    >
      <div className="flex gap-3">
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id={titleId} className="text-base font-semibold">
            {t('title', { count: q.free })}
          </h3>
          <p className="text-muted-foreground text-sm">
            {[
              t('need', { parks: q.parks, parkDays: q.parkDays, days: q.days }),
              q.others > 0 ? t('planned', { count: q.others }) : null,
              t('ask', { free: q.free }),
            ]
              .filter(Boolean)
              .join(' ')}
          </p>
        </div>
      </div>
      <WizardOptionGroup labelledBy={titleId} className="sm:grid-cols-2">
        {q.moreParks.length > 0 && (
          <WizardOptionCard
            checked={choice === 'more_parks'}
            onSelect={() => pick('more_parks')}
            icon={Plus}
            title={t('moreParks')}
            aside={t('parkDays', { count: q.moreParks.length })}
            hint={t('moreParksHint', {
              parks: list.format(q.moreParks.map(parkName)),
              count: q.moreParks.length,
            })}
          />
        )}
        {q.moreDays.length > 0 && (
          <WizardOptionCard
            checked={choice === 'more_days'}
            onSelect={() => pick('more_days')}
            icon={Sparkles}
            title={t('moreDays')}
            aside={t('parkDays', { count: q.moreDays.length })}
            hint={t('moreDaysHint', {
              parks: list.format(q.moreDays.map(parkName)),
              count: q.moreDays.length,
            })}
          />
        )}
        <WizardOptionCard
          checked={choice === 'free'}
          onSelect={() => pick('free')}
          icon={Sun}
          title={t('free')}
          aside={tRibbon('free', { count: q.free })}
          hint={t('freeHint')}
        />
        {q.shorter !== null && (
          <WizardOptionCard
            checked={choice === 'shorter'}
            onSelect={() => pick('shorter')}
            icon={CalendarMinus}
            title={t('shorter')}
            aside={t('days', { count: q.shorter })}
            hint={t('shorterHint', { parks: q.parks, days: q.shorter })}
          />
        )}
      </WizardOptionGroup>
    </section>
  );
}
