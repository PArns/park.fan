import { isUuid } from '@/lib/utils';

/**
 * The UUIDs behind the slugs a plan is filed under, for the planner's events and nothing else: the
 * plan keys parks, rides and shows by slug, and an event names its subject by UUID. Learned where a
 * page already holds one (the page's park, a ride page's button, the wizard's search hit, a
 * `/plan/day` answer that carries them) and kept in memory for the tab, never stored. A slug no page
 * has named an id for has none, and its event goes without an entity rather than with a guess.
 */
const parkIds = new Map<string, string>();
const rideIds = new Map<string, string>();
const showIds = new Map<string, string>();

const key = (parkSlug: string, slug: string) => `${parkSlug}/${slug}`;

function remember(into: Map<string, string>, at: string, id: string | null | undefined): void {
  if (id && isUuid(id)) into.set(at, id.toLowerCase());
}

/** Note a park's UUID; anything that is not one is ignored. */
export function rememberParkId(parkSlug: string, id: string | null | undefined): void {
  remember(parkIds, parkSlug, id);
}

/** Note a ride's UUID under its park. */
export function rememberRideId(
  parkSlug: string,
  attractionSlug: string,
  id: string | null | undefined
): void {
  remember(rideIds, key(parkSlug, attractionSlug), id);
}

/** Note a show's UUID under its park. */
export function rememberShowId(
  parkSlug: string,
  showSlug: string,
  id: string | null | undefined
): void {
  remember(showIds, key(parkSlug, showSlug), id);
}

/** What a `/plan/day` answer carries for the ids: the park's, and each ride's and show's. */
export interface PlanDayIds {
  parkSlug: string;
  parkId?: string | null;
  rides?: readonly { attractionSlug: string; attractionId?: string | null }[];
  shows?: readonly { showSlug: string; showId?: string | null }[];
}

/** Note every id a `/plan/day` answer carries. */
export function rememberPlanDayIds(plan: PlanDayIds): void {
  rememberParkId(plan.parkSlug, plan.parkId);
  for (const ride of plan.rides ?? []) {
    rememberRideId(plan.parkSlug, ride.attractionSlug, ride.attractionId);
  }
  for (const show of plan.shows ?? []) rememberShowId(plan.parkSlug, show.showSlug, show.showId);
}

/** A park's UUID, where a page has named it. */
export function parkIdOf(parkSlug: string | null | undefined): string | undefined {
  return parkSlug ? parkIds.get(parkSlug) : undefined;
}

/** A ride's UUID, where a page has named it. */
export function rideIdOf(parkSlug: string, attractionSlug: string): string | undefined {
  return rideIds.get(key(parkSlug, attractionSlug));
}

/** A show's UUID, where a page has named it. */
export function showIdOf(parkSlug: string, showSlug: string): string | undefined {
  return showIds.get(key(parkSlug, showSlug));
}
