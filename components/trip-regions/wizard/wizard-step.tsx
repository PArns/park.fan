'use client';

import { createContext, useContext, useLayoutEffect, type ComponentType } from 'react';
import type { TripWizardQuestion, TripWizardStepKey } from '@/lib/trip-regions/wizard-steps';
import type { TicketStep } from '../planner/plan-tickets';

/**
 * What the assistant's frame hands every step body. A body draws only the questions it is given
 * (`tripWizardSteps` decides them per region), writes every answer through `usePlanContext().update`
 * as the rest of the planner does, and owns nothing else: no footer, no title, no focus on open.
 */
export interface WizardStepProps {
  /** This step's questions for the region and the trip, in the order they are drawn. */
  questions: readonly TripWizardQuestion[];
  /**
   * Drawn inside another step, because its one question went there (Japan's evenings in Tempo):
   * no lead line of its own, the host's question is Parky's.
   */
  merged: boolean;
  /** The id of Parky's question, the dialog's title: `aria-labelledby` of a step's radiogroup. */
  askId: string;
}

/** A step body, as `WIZARD_STEP_BODIES` registers it under its key. */
export type WizardStepBody = ComponentType<WizardStepProps>;

/** The frame's side of {@link useWizardAsk}: sets the line Parky asks, `null` for the step's own. */
export const WizardAskContext = createContext<((ask: string | null) => void) | null>(null);

/**
 * Parky's question in the bubble, where a step words it from what it knows: "And when do you fly
 * back?" once the arrival is picked, the cities of the Hotels step, a conflict in Parks. `null`
 * keeps the step's own (`tripPlanner.wizard.ask.<step>`). The bubble is the dialog's title, so a
 * screen reader hears the change.
 */
export function useWizardAsk(ask: string | null): void {
  const set = useContext(WizardAskContext);
  useLayoutEffect(() => {
    if (!set) return;
    set(ask);
    return () => set(null);
  }, [set, ask]);
}

/** What the planner hands the assistant beside the plan's context, for the steps that need it. */
export interface WizardFrameValue {
  /** The ticket step's drafts and edits, shared with the result's ticket card. */
  ticketStep: TicketStep;
  /** `YYYY-MM`: the month a month page's date grid opens on. */
  defaultMonth?: string;
  /** Close the assistant and show the plan, as "Show the plan now" does. */
  showPlan: () => void;
}

/** Provides {@link WizardFrameValue} to the step bodies. */
export const WizardFrameContext = createContext<WizardFrameValue | null>(null);

/** The assistant's shared values; only inside `TripWizard`. */
export function useWizardFrame(): WizardFrameValue {
  const value = useContext(WizardFrameContext);
  if (!value) throw new Error('useWizardFrame outside TripWizard');
  return value;
}

/** A step's key and its body, the registry's entry type. */
export type WizardStepBodies = Partial<Record<TripWizardStepKey, WizardStepBody>>;
