'use client';

import { createContext, useCallback, useContext } from 'react';
import type { OrlandoPlanState } from '@/lib/orlando/plan';
import type { TicketCatalog } from '@/lib/orlando/plan-tickets';
import { trackTripEvent, type TrackTripEvent } from '@/lib/orlando/plan-analytics';
import type { TripRegion, TripRegionGroup, TripRegionPark, TripVenue } from '@/lib/orlando/types';

/** A park's photo for the blocks of the Week view, resolved on the server (`plan-photos.ts`). */
export interface PlanParkPhoto {
  src: string;
  position: string;
}

/** What every part of the planner reads: the region, the visitor's choice and how to change it. */
export interface PlanContextValue {
  region: TripRegion;
  locale: string;
  /** The region's zone, which every date and time of the plan is in. */
  timeZone: string;
  parkBySlug: ReadonlyMap<string, TripRegionPark>;
  /** A park's name as visitors say it ("Animal Kingdom"), the hub's `shortParkName`. */
  parkName: (slug: string) => string;
  /** The region's evening venues by key. */
  venueByKey: ReadonlyMap<string, TripVenue>;
  groupByKey: ReadonlyMap<string, TripRegionGroup>;
  /** The default pick, the region's headliners, in the region's order. */
  headliners: readonly string[];
  /** Every park slug in the region's order, which lists and the URL keep. */
  regionOrder: readonly string[];
  areaKeys: ReadonlySet<string>;
  /** The ticket catalog by id; empty where the API has none, which hides the ticket step. */
  tickets: TicketCatalog;
  state: OrlandoPlanState;
  update: (recipe: (state: OrlandoPlanState) => OrlandoPlanState) => void;
  /** Orlando's today, `null` until the browser has read its clock. */
  today: string | null;
  photos: Readonly<Record<string, PlanParkPhoto>>;
  /** Whether the controls answer: false in the server-rendered stand-in. */
  live: boolean;
}

const PlanContext = createContext<PlanContextValue | null>(null);

/** Provides {@link PlanContextValue} to the planner's parts. */
export const PlanContextProvider = PlanContext.Provider;

/** The planner's shared values; only inside `OrlandoPlanner`. */
export function usePlanContext(): PlanContextValue {
  const value = useContext(PlanContext);
  if (!value) throw new Error('usePlanContext outside OrlandoPlanner');
  return value;
}

/** The statistic's trip events for this planner's region (`trackTripEvent` with its slug). */
export function useTripEvents(): TrackTripEvent {
  const slug = usePlanContext().region.slug;
  return useCallback<TrackTripEvent>(
    (name, ...args) => trackTripEvent(slug, name, ...args),
    [slug]
  );
}
