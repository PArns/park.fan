'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { parkBestDaysQueryOptions } from '@/lib/hooks/use-park-best-days-calendar';
import { useLoadLast } from '@/lib/hooks/use-load-last';
import type { AssignCrowd } from './assign';
import type { PlannerGeo } from './types';

export interface AssignFacts {
  /** Date → forecast, from the park's best-days snapshot. */
  levels: ReadonlyMap<string, AssignCrowd>;
  /** The park's zone, where the snapshot named it. */
  timezone: string | null;
}

/**
 * The best-days snapshot of several parks at once, for the trip assistant.
 *
 * The same query, under the same key, as `usePlannerDayFacts`, so a park the visitor has open
 * elsewhere is a cache hit. One request per park and only while the assistant is open.
 *
 * `pending` is true until every park has ANSWERED, successfully or not. A park whose request
 * failed is a park with no forecast, and `assignParks` reads a missing date as `unknown`, which
 * is what the row then says; waiting for it forever would be the assistant's own failure.
 */
export function useParksBestDays(
  parks: readonly { slug: string; geo: PlannerGeo }[],
  enabled: boolean
): { facts: ReadonlyMap<string, AssignFacts>; pending: boolean } {
  const releasedLast = useLoadLast();
  const results = useQueries({
    queries: parks.map((park) => ({
      ...parkBestDaysQueryOptions({
        continent: park.geo.continent,
        country: park.geo.country,
        city: park.geo.city,
        parkSlug: park.slug,
      }),
      enabled: enabled && typeof window !== 'undefined' && releasedLast,
    })),
  });

  // One string for the whole set: a fixed-size dependency that changes when any park's answer
  // does, however many parks there are.
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
    // `results` is a new array on every render and `stamp` says when it changed in substance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks, stamp]);
}
