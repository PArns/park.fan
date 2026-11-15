'use client';

import { Fragment, useId, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, ThermometerSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tripPlannerUi } from '@/lib/trip-regions/planner-ui';
import { usePlanContext } from '../planner/plan-context';
import { PLAN_FOCUS, PLAN_PILL, PLAN_PILL_IDLE } from '../planner/plan-controls';
import { useWizardSteps } from './trip-wizard';

/**
 * "Your answers" over the result: a chip per step of the assistant, by the rail's own list and
 * words (`useWizardSteps`), so a region shows the steps it asks and a merged step none of its own.
 * A press opens the assistant on that step (`tripPlannerUi.openStep`), counted as
 * `trip_wizard_step` with `via: answers`. With „Extremes Wetter vermeiden“ on, a pill of its own
 * after Parks opens the Parks step, where the switch is.
 */
export function WizardAnswers() {
  const t = useTranslations('tripPlanner');
  const { live, state } = usePlanContext();
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
            <Fragment key={key}>
              <AnswerPill
                label={label}
                icon={
                  <Pencil className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                }
                disabled={!live}
                onClick={() => tripPlannerUi.openStep(key)}
              />
              {key === 'parks' && state.weather === 'avoid' && (
                <AnswerPill
                  label={t('wizard.parks.weather.label')}
                  icon={
                    <ThermometerSun
                      className="text-signal-heat size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                  }
                  disabled={!live}
                  onClick={() => tripPlannerUi.openStep('parks')}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** One answer as a pill that opens its step: „Antwort ändern“ in its accessible name. */
function AnswerPill({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('tripPlanner');
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={t('result.answers.edit', { step: label })}
      className={cn(
        PLAN_PILL,
        PLAN_PILL_IDLE,
        'inline-flex items-center gap-1.5 disabled:opacity-40',
        PLAN_FOCUS
      )}
    >
      {icon}
      {label}
    </button>
  );
}
