import type { PlannerOpenedSource } from '@/lib/planner/ui-store';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

/**
 * The trip planner's funnel as our own events: `planner_opened` on the closed to open edge,
 * `plan_day_started` when a day gains its first block, `planner_closed_empty` when an opening
 * ends without one. Two of the three need to know what happened in between, so the state lives
 * here, in one module, because the ends sit in different files (`PlannerLauncher` opens and
 * closes, `usePlanner` counts the first block).
 */

/** Whether the panel is up, and whether a day gained its first block since it came up. */
let openingActive = false;
let openingStartedADay = false;

/**
 * Counts `planner_opened` with its `source` on the closed to open edge of the planner panel, the
 * top of the funnel, and starts an opening. `source` is the one property, because which way in
 * earns its place is the decision it answers.
 */
export function trackPlannerOpened(source: PlannerOpenedSource): void {
  openingActive = true;
  openingStartedADay = false;
  trackSiteEvent('planner_opened', { source });
}

/**
 * Counts `planner_closed_empty` when the panel closes and no day gained its first block in that
 * opening, at most once per opening. No property: `planner_opened` already carries the way in.
 */
export function trackPlannerClosed(): void {
  if (!openingActive) return;
  openingActive = false;
  if (openingStartedADay) return;
  trackSiteEvent('planner_closed_empty', {});
}

/**
 * Counts `plan_day_started` when a park and date gain their first block, not on finishing the
 * wizard and not per added ride, and marks the running opening as having started a day. A day
 * started while the panel is closed belongs to no opening. It names no park: the plan is keyed by
 * the park's slug, and the event's entity is a UUID.
 */
export function trackPlanDayStarted(): void {
  if (openingActive) openingStartedADay = true;
  trackSiteEvent('plan_day_started', {});
}
