'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { parkBestDaysQueryOptions } from '@/lib/hooks/use-park-best-days-calendar';
import type { AssignCrowd } from './assign';
import type { PlannerGeo } from './types';

/** One park's forecast per date for the trip assistant, and its zone. */
export interface AssignFacts {
  /** Date → forecast, from the park's best-days snapshot. */
  levels: ReadonlyMap<string, AssignCrowd>;
  /** The park's zone, where the snapshot named it. */
  timezone: string | null;
}

/**
 * The best-days snapshot of several parks at once, for the trip assistant, under
 * `usePlannerDayFacts`'s query key so an open park is a cache hit. `pending` holds until every park
 * has answered, successfully or not: a failed park has no forecast, which `assignParks` reads as
 * `unknown`.
 */
export function useParksBestDays(
  parks: readonly { slug: string; geo: PlannerGeo }[],
  enabled: boolean
): { facts: ReadonlyMap<string, AssignFacts>; pending: boolean } {
  const results = useQueries({
    queries: parks.map((park) => ({
      ...parkBestDaysQueryOptions({
        continent: park.geo.continent,
        country: park.geo.country,
        city: park.geo.city,
        parkSlug: park.slug,
      }),
      // Not gated on `useLoadLast`, which orders the park page's own queries; this dialog was asked
      // for.
      enabled: enabled && typeof window !== 'undefined',
    })),
  });

  // One string for the whole set: a fixed-size dependency that changes when any answer does.
  const stamp = results.map((result) => `${result.status}:${result.dataUpdatedAt}`).join('|');

  return useMemo(() => {
    const facts = new Map<string, AssignFacts>();
    let pending = false;
    parks.forEach((park, i) => {
      const result = results[i];
      if (!result) return;
      if (!result.data && !result.isError) pending = true;
      const levels = new Map<string, AssignCrowd>();
      for (const day of result.data?.days ?? []) {
        levels.set(day.date, day.predictedCrowdLevel ?? day.crowdLevel);
      }
      const zone = result.data?.meta?.timezone;
      facts.set(park.slug, { levels, timezone: typeof zone === 'string' ? zone : null });
    });
    return { facts, pending };
    // `results` is a new array every render; `stamp` says when it changed in substance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks, stamp]);
}
