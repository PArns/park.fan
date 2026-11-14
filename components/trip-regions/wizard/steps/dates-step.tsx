'use client';

import { PlanDatesStep } from '../../planner/plan-find';
import { useWizardFrame, type WizardStepProps } from '../wizard-step';

/** Step 1, the dates: the planner's date grid, the one answer the plan needs. */
export function DatesStep(_: WizardStepProps) {
  const { defaultMonth } = useWizardFrame();
  return <PlanDatesStep defaultMonth={defaultMonth} />;
}
