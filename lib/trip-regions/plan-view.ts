'use client';

import { localChoice, type LocalChoice } from './local-choice';

/**
 * Which view of the trip result this browser chose last: the day cards (Agenda), the Outlook-style
 * week, or the month grid. `null` until somebody chooses: the result then picks by the width of the
 * window.
 */

/** The result's three views. */
export const PLAN_VIEWS = ['agenda', 'week', 'month'] as const;
/** One of {@link PLAN_VIEWS}. */
export type PlanView = (typeof PLAN_VIEWS)[number];

const views = new Map<string, LocalChoice<PlanView>>();

/**
 * The view chosen in a region's planner, as an external store (`parkfan_<region>_view`), one per
 * region so each keeps the key its browsers already hold.
 */
export function tripPlanView(region: string): LocalChoice<PlanView> {
  let store = views.get(region);
  if (!store) {
    store = localChoice<PlanView>(`parkfan_${region}_view`, PLAN_VIEWS);
    views.set(region, store);
  }
  return store;
}
