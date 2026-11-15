'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { todayInZone } from '@/lib/planner/park-time';
import { plannerStore } from '@/lib/planner/store';
import {
  isPlannedDay,
  type PlannerEntry,
  type PlannerGeo,
  type PlannerState,
} from '@/lib/planner/types';
import { formatParkDay } from '@/lib/utils/park-day';

/** The next day this browser has planned, with what drawing it takes. */
export interface PlanSummary {
  parkSlug: string;
  park: string;
  geo: PlannerGeo;
  date: string;
  entries: PlannerEntry[];
  /** Planned days from today on, every park's in its own zone. */
  days: number;
}

/**
 * The next planned day from today on (the active one where it is among them), and how many such
 * days there are. A plan whose days are all over reports nothing. `now` is the browser's clock,
 * never the server's.
 */
export function planSummary(state: PlannerState, now: number): PlanSummary | null {
  const upcoming: { slug: string; date: string }[] = [];
  for (const park of Object.values(state.parks)) {
    const today = todayInZone(park.timezone, now);
    for (const day of Object.values(park.days)) {
      if (isPlannedDay(day) && day.date >= today)
        upcoming.push({ slug: park.slug, date: day.date });
    }
  }
  if (upcoming.length === 0) return null;
  const active = upcoming.find(
    (day) => day.slug === state.activeParkSlug && day.date === state.activeDate
  );
  const next =
    active ??
    upcoming.reduce((first, day) =>
      day.date < first.date || (day.date === first.date && day.slug < first.slug) ? day : first
    );
  const park = state.parks[next.slug];
  return {
    parkSlug: park.slug,
    park: park.name,
    geo: park.geo,
    date: next.date,
    entries: park.days[next.date].entries,
    days: upcoming.length,
  };
}

/** A planned day as `YYYY-MM-DD`, written short in the reader's language: „Sa., 21. Nov.". */
export function formatPlanDay(date: string, locale: string): string {
  return formatParkDay(locale, date, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * This browser's plan, summed up: nothing on the server and during hydration, where neither the
 * plan nor the clock is known.
 */
export function usePlanSummary(): PlanSummary | null {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  const now = useBrowserNow();
  return useMemo(() => (now ? planSummary(state, now.getTime()) : null), [state, now]);
}
