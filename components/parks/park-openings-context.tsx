'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useParkPlanDay } from '@/lib/hooks/use-park-plan-day';
import { parkOpeningsFromPlan, parkOpenMinute, type ParkOpenings } from '@/lib/parks/ride-openings';
import type { ScheduleItem } from '@/lib/api/types';

const ParkOpeningsContext = createContext<ParkOpenings | null>(null);

/**
 * Today's later ride openings and the park's early entry, for the cards and the header panel below
 * it. One deferred request for the whole park page (`useParkPlanDay`), read through a context so a
 * hundred cards share one subscription. Outside it (blog cards, favourites, cross-park lists) the
 * context is `null` and nothing is drawn.
 */
export function ParkOpeningsProvider({
  continent,
  country,
  city,
  parkSlug,
  timezone,
  schedule,
  todayIso,
  enabled = true,
  children,
}: {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  timezone: string;
  schedule: readonly ScheduleItem[] | null | undefined;
  todayIso: string;
  /** Off where nothing on the page can use the plan, so the request is not made. */
  enabled?: boolean;
  children: ReactNode;
}) {
  const { data: plan } = useParkPlanDay({ continent, country, city, parkSlug, enabled });
  // A number, not the schedule array: every live poll hands over a new array, and the value below
  // would then be rebuilt, and every card under it rendered, for an opening that did not move.
  const parkOpenMin = parkOpenMinute(schedule, todayIso, timezone);
  const value = useMemo(() => parkOpeningsFromPlan(plan, parkOpenMin), [plan, parkOpenMin]);
  return <ParkOpeningsContext.Provider value={value}>{children}</ParkOpeningsContext.Provider>;
}

/** Today's openings, or `null` outside a {@link ParkOpeningsProvider} and until the plan lands. */
export function useParkOpenings(): ParkOpenings | null {
  return useContext(ParkOpeningsContext);
}
