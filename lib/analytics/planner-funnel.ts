import type { PlannerOpenedSource } from '@/lib/planner/ui-store';
import {
  trackSiteEvent,
  type PlanItemAddSource,
  type PlanItemKind,
  type PlanItemRemoveSource,
  type PlanOptimizeMode,
  type PlannerFitLever,
  type PlannerFitSource,
  type PlannerUndoSource,
  type PlannerWizardStep,
  type SharedPlanResult,
  type SiteEventMap,
} from '@/lib/analytics/site-analytics';
import { parkIdOf, rideIdOf, showIdOf } from '@/lib/planner/entity-ids';
import type { FitLeverKind } from '@/lib/planner/fit';
import type { PlannerEntry } from '@/lib/planner/types';

/**
 * The trip planner's funnel as our own events: `planner_opened` on the closed to open edge,
 * `plan_day_started` when a day gains its first block, `planner_closed_empty` when an opening
 * ends without one, and around them the wizard's steps, what goes into and out of a plan, the
 * optimiser and the fit assistant, sharing and push. Two of the first three need to know what
 * happened in between, so the state lives here, in one module, because the ends sit in different
 * files (`PlannerLauncher` opens and closes, `usePlanner` counts the first block).
 *
 * An event about one park carries the park's UUID as its entity, one about a ride or show that
 * ride's or show's, wherever a page has named it (`lib/planner/entity-ids.ts`); the plan itself
 * knows slugs only, so an id nobody named is left out rather than guessed. See
 * docs/features/trip-planner/analytics.md.
 */

/** Where the events go: `trackSiteEvent` on the page, a recorder in the tests. */
export type PlannerEventSender = <N extends keyof SiteEventMap>(
  name: N,
  props: SiteEventMap[N],
  entity?: string
) => void;

const sendToSite: PlannerEventSender = (name, props, entity) =>
  (trackSiteEvent as (name: string, props: object, entity?: string) => void)(name, props, entity);

/** Whether the panel is up, the way it came up, and whether a day gained its first block since. */
let openingActive = false;
let openingSource: PlannerOpenedSource = 'tab';
let openingStartedADay = false;

/**
 * Counts `planner_opened` with its `source` on the closed to open edge of the planner panel, the
 * top of the funnel, and starts an opening. `source` is the one property, because which way in
 * earns its place is the decision it answers.
 */
export function trackPlannerOpened(source: PlannerOpenedSource): void {
  openingActive = true;
  openingSource = source;
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
 * wizard and not per added ride, and marks the running opening as having started a day. Its
 * `source` is that opening's way in, which tells the admin which way in leads to a plan; a day
 * started while the panel is closed belongs to no opening and says `none`. The park's UUID goes
 * with it where a page named one, which is what ranks the most planned parks.
 */
export function trackPlanDayStarted(parkSlug?: string): void {
  if (openingActive) openingStartedADay = true;
  sendToSite(
    'plan_day_started',
    { source: openingActive ? openingSource : 'none' },
    parkIdOf(parkSlug)
  );
}

/** What a stored block is, and the slug its entity is looked up by. */
export function planItemOf(entry: Pick<PlannerEntry, 'attractionSlug' | 'showSlug'>): {
  kind: PlanItemKind;
  slug?: string;
} {
  if (entry.showSlug) return { kind: 'show', slug: entry.showSlug };
  if (entry.attractionSlug) return { kind: 'ride', slug: entry.attractionSlug };
  return { kind: 'block' };
}

/** The UUID an item event names: the ride's or the show's, never the park's. */
function itemEntity(kind: PlanItemKind, parkSlug: string, slug?: string): string | undefined {
  if (!slug) return undefined;
  if (kind === 'ride') return rideIdOf(parkSlug, slug);
  if (kind === 'show') return showIdOf(parkSlug, slug);
  return undefined;
}

/** Counts `plan_item_added`: one block into a plan, from `source`. */
export function trackPlanItemAdded(
  kind: PlanItemKind,
  source: PlanItemAddSource,
  parkSlug: string,
  slug?: string,
  send: PlannerEventSender = sendToSite
): void {
  send('plan_item_added', { kind, source }, itemEntity(kind, parkSlug, slug));
}

/** Counts `plan_item_removed`: one block out of a plan, through `source`. */
export function trackPlanItemRemoved(
  kind: PlanItemKind,
  source: PlanItemRemoveSource,
  parkSlug: string,
  slug?: string,
  send: PlannerEventSender = sendToSite
): void {
  send('plan_item_removed', { kind, source }, itemEntity(kind, parkSlug, slug));
}

/** Counts `plan_optimized` for a re-plan that changed the day, with what did it. */
export function trackPlanOptimized(
  mode: PlanOptimizeMode,
  parkSlug: string,
  send: PlannerEventSender = sendToSite
): void {
  send('plan_optimized', { mode }, parkIdOf(parkSlug));
}

/** Counts `planner_fit_opened`: the fit assistant asked its question. */
export function trackPlannerFitOpened(
  source: PlannerFitSource,
  parkSlug: string,
  send: PlannerEventSender = sendToSite
): void {
  send('planner_fit_opened', { source }, parkIdOf(parkSlug));
}

const LEVER_NAMES: Record<FitLeverKind, PlannerFitLever> = {
  'drop-block': 'drop_block',
  'shorten-block': 'shorten_block',
  'drop-all-blocks': 'drop_all_blocks',
};

/** Counts `planner_fit_lever` when a lever is switched on; switching it off counts nothing. */
export function trackPlannerFitLever(
  lever: FitLeverKind,
  send: PlannerEventSender = sendToSite
): void {
  send('planner_fit_lever', { lever: LEVER_NAMES[lever] });
}

/** Counts `planner_undo`: a day put back from `source`'s snapshot. */
export function trackPlannerUndo(
  source: PlannerUndoSource,
  parkSlug: string,
  send: PlannerEventSender = sendToSite
): void {
  send('planner_undo', { source }, parkIdOf(parkSlug));
}

/** Counts `planner_day_cleared`: a whole day dropped. */
export function trackPlannerDayCleared(
  parkSlug: string,
  send: PlannerEventSender = sendToSite
): void {
  send('planner_day_cleared', {}, parkIdOf(parkSlug));
}

/** Counts `planner_shared_opened` once the shared plan's answer is in. */
export function trackSharedPlanOpened(
  result: SharedPlanResult,
  send: PlannerEventSender = sendToSite
): void {
  send('planner_shared_opened', { outcome: result });
}

/** Counts `planner_shared_adopted`: the shared plan taken over. */
export function trackSharedPlanAdopted(send: PlannerEventSender = sendToSite): void {
  send('planner_shared_adopted', {});
}

/** Counts `planner_push_on`: push for the plan on, with the API's acceptance. */
export function trackPlannerPushOn(send: PlannerEventSender = sendToSite): void {
  send('planner_push_on', {});
}

/**
 * One wizard opening's events, counted so the steps can be divided: each step once, the first time
 * it is on screen (going back and forth again counts nothing), the inline fit assistant once, and
 * the finish. A completed step is the next one reached, and the last one is the finish. One session
 * per opening: the dialog is mounted per opening and makes its own.
 */
export interface PlannerWizardSession {
  /** `step` is on screen; `parkSlug` once a park is chosen, for the entity. */
  step(step: PlannerWizardStep, parkSlug?: string | null): void;
  /** The last step shows the fit assistant inline. Once per opening. */
  fitShown(parkSlug: string): void;
  /** The finish was pressed; `headliners` says whether it planned them. */
  finished(headliners: boolean, parkSlug: string): void;
}

/** A {@link PlannerWizardSession} sending through `send`. Plain state: nothing renders from it. */
export function createPlannerWizardSession(
  send: PlannerEventSender = sendToSite
): PlannerWizardSession {
  const seen = new Set<PlannerWizardStep>();
  let fitCounted = false;
  return {
    step(step, parkSlug) {
      if (seen.has(step)) return;
      seen.add(step);
      send('planner_wizard_step', { step }, parkIdOf(parkSlug));
    },
    fitShown(parkSlug) {
      if (fitCounted) return;
      fitCounted = true;
      send('planner_fit_opened', { source: 'wizard' }, parkIdOf(parkSlug));
    },
    finished(headliners, parkSlug) {
      send('planner_wizard_finished', { headliners }, parkIdOf(parkSlug));
    },
  };
}
