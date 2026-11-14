'use client';

import { PlanParks } from '../../planner/plan-parks';
import type { WizardStepProps } from '../wizard-step';

/** Step 2, the parks: which parks, and how many days each. */
export function ParksStep(_: WizardStepProps) {
  return <PlanParks />;
}
