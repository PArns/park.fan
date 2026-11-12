'use client';

import { createContext, useContext } from 'react';
import type { OrlandoPlanState } from '@/lib/orlando/plan';
import type { TripRegion, TripRegionGroup, TripRegionPark } from '@/lib/orlando/types';

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
  groupByKey: ReadonlyMap<string, TripRegionGroup>;
  /** The default pick, the region's headliners, in the region's order. */
  headliners: readonly string[];
  /** Every park slug in the region's order, which lists and the URL keep. */
  regionOrder: readonly string[];
  areaKeys: ReadonlySet<string>;
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
