'use client';

import type { TripWizardStepKey } from './wizard-steps';

/**
 * Opening the trip planner's assistant, as a signal from outside the planner: the hub's hero and
 * landing ask, the result's answers ask for one step, the mounted `TripRegionPlanner` answers. A
 * queue of one rather than state, like the day planner's `plannerUi`, so two presses are two
 * requests; one made before the planner is on screen waits for it.
 */
type Listener = () => void;

/** Where a start came from, as `trip_planner_started` counts it. */
export type TripPlannerStartSource = 'hero' | 'landing' | 'restart';

/**
 * A request to open the assistant: on its first step with the start's source, or on one step from
 * the result's answers (`answers`), which is a way back in rather than a start.
 */
export type TripPlannerRequest =
  | { kind: 'start'; source: TripPlannerStartSource }
  | { kind: 'step'; step: TripWizardStepKey };

let pending: TripPlannerRequest | null = null;
const listeners = new Set<Listener>();

function ask(request: TripPlannerRequest): void {
  pending = request;
  for (const listener of listeners) listener();
}

/** The trip planner's open signal. */
export const tripPlannerUi = {
  /**
   * Open the assistant on its first step: the hub's hero (`hero`), the landing's "Reise planen"
   * (`landing`), or "Neu starten" once the answers are cleared (`restart`).
   */
  openStart(source: TripPlannerStartSource = 'hero'): void {
    ask({ kind: 'start', source });
  },
  /** Open the assistant on one step, from an answer in the result ("Hotel: Disney-Hotel"). */
  openStep(step: TripWizardStepKey): void {
    ask({ kind: 'step', step });
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The request waiting for the planner, consumed by the planner when it answers. */
  take(): TripPlannerRequest | null {
    const request = pending;
    pending = null;
    return request;
  },
};
