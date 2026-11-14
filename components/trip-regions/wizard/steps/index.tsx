'use client';

import { PlanOptions } from '../../planner/plan-options';
import { PlanRoute, usePlanRouteSetup } from '../../planner/plan-route';
import { useStatePlan } from '../../planner/use-trip-plan';
import type { WizardStepBodies } from '../wizard-step';
import { DatesStep } from './dates-step';
import { ParksStep } from './parks-step';
import { TicketsStep } from './tickets-step';

/**
 * The Route until its own step is built: the setup's Route as it was, the plan's stays included.
 */
function InterimRouteStep() {
  const plan = useStatePlan();
  return <PlanRoute plan={plan.data} />;
}

/** The hotels per city until their own step is built: the Route's rows of More options. */
function InterimHotelsStep() {
  return usePlanRouteSetup()?.options ?? null;
}

/** Every option of the plan in one step until Hotel, Tempo and Evenings have their own. */
function InterimPaceStep() {
  return <PlanOptions />;
}

/**
 * Each step's body by its key. A step the list has and this registry lacks is left out of the
 * assistant, so a region never shows an empty screen; a new step is a body here and its key in
 * `TRIP_WIZARD_STEPS`. The contract a body keeps: `WizardStepProps` (`wizard-step.tsx`).
 */
export const WIZARD_STEP_BODIES: WizardStepBodies = {
  dates: DatesStep,
  parks: ParksStep,
  route: InterimRouteStep,
  hotels: InterimHotelsStep,
  pace: InterimPaceStep,
  tickets: TicketsStep,
};
