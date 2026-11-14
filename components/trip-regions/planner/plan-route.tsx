'use client';

import type { PlanSetupRoute } from './plan-setup';
import { usePlanContext } from './plan-context';

/**
 * The setup's Route in a region with bases (Japan, Paris): `null` everywhere else, where the
 * planner is the one-city planner it always was.
 */
export function usePlanRouteSetup(): PlanSetupRoute | null {
  const { region } = usePlanContext();
  if (!region.bases?.length) return null;
  return null;
}
