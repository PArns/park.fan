'use client';

import type { WizardStepBodies } from '../wizard-step';
import { DatesStep } from './dates-step';
import { EveningsStep } from './evenings-step';
import { HotelStep } from './hotel-step';
import { HotelsStep } from './hotels-step';
import { PaceStep } from './pace-step';
import { ParksStep } from './parks-step';
import { RouteStep } from './route-step';
import { TicketsStep } from './tickets-step';

/**
 * Each step's body by its key. A step the list has and this registry lacks is left out of the
 * assistant, so a region never shows an empty screen; a new step is a body here and its key in
 * `TRIP_WIZARD_STEPS`. The contract a body keeps: `WizardStepProps` (`wizard-step.tsx`).
 */
export const WIZARD_STEP_BODIES: WizardStepBodies = {
  dates: DatesStep,
  parks: ParksStep,
  hotel: HotelStep,
  route: RouteStep,
  hotels: HotelsStep,
  pace: PaceStep,
  evenings: EveningsStep,
  tickets: TicketsStep,
};
