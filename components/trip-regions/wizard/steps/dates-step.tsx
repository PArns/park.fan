'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlanDatesStep } from '../../planner/plan-find';
import { useWizardAsk, useWizardFrame, type WizardStepProps } from '../wizard-step';

/**
 * Step 1, the dates, the one answer the plan needs: the planner's date grid with month chips over
 * it, and "No dates yet? Find the best time" under it. Once the arrival is pressed Parky asks for
 * the way home, so the second press is not a guess.
 */
export function DatesStep(_: WizardStepProps) {
  const t = useTranslations('tripPlanner.wizard.ask');
  const { defaultMonth } = useWizardFrame();
  const [pending, setPending] = useState(false);
  useWizardAsk(pending ? t('departure') : null);
  return <PlanDatesStep defaultMonth={defaultMonth} monthChips onPending={setPending} />;
}
