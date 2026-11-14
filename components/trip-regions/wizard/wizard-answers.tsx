'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';
import { usePlanContext } from '../planner/plan-context';
import { PLAN_FOCUS, PLAN_PILL, PLAN_PILL_IDLE } from '../planner/plan-controls';
import { useWizardSteps } from './trip-wizard';

/**
 * "Your answers" over the result: a chip per step of the assistant, by the rail's own list and
 * words (`useWizardSteps`), so a region shows the steps it asks and a merged step none of its own.
 * A press opens the assistant on that step (`tripPlannerUi.openStep`), counted as
 * `trip_wizard_step` with `via: answers`.
 */
export function WizardAnswers() {
  const t = useTranslations('tripPlanner');
  const { live } = usePlanContext();
  const steps = useWizardSteps();
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2" data-plan-answers="">
      <p id={id} className="text-muted-foreground text-xs font-medium">
        {t('result.answers.title')}
      </p>
      <div className="flex flex-wrap gap-2">
        {steps.map(({ key }) => {
          const label = t(`wizard.steps.${key}`);
          return (
            <button
              key={key}
              type="button"
              disabled={!live}
              onClick={() => tripPlannerUi.openStep(key)}
              aria-label={t('result.answers.edit', { step: label })}
              className={cn(
                PLAN_PILL,
                PLAN_PILL_IDLE,
                'inline-flex items-center gap-1.5 disabled:opacity-40',
                PLAN_FOCUS
              )}
            >
              <Pencil className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
