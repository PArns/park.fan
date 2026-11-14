'use client';

import { PlanTickets } from '../../planner/plan-tickets';
import { useWizardFrame, type WizardStepProps } from '../wizard-step';

/** The last step, the tickets: the planner's ticket step. */
export function TicketsStep(_: WizardStepProps) {
  const { ticketStep, defaultMonth } = useWizardFrame();
  return <PlanTickets step={ticketStep} defaultMonth={defaultMonth} />;
}
