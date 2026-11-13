'use client';

import { localChoice } from './local-choice';

/**
 * Which view of the trip result this browser chose last: the day cards (Agenda), the Outlook-style
 * week, or the month grid. `null` until somebody chooses: the result then picks by the width of the
 * window.
 */

/** The result's three views. */
export const PLAN_VIEWS = ['agenda', 'week', 'month'] as const;
/** One of {@link PLAN_VIEWS}. */
export type PlanView = (typeof PLAN_VIEWS)[number];

/** The chosen view as an external store (`parkfan_orlando_view`). */
export const orlandoPlanView = localChoice<PlanView>('parkfan_orlando_view', PLAN_VIEWS);
