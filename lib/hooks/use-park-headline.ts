'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { CrowdLevel, ParkWithAttractions } from '@/lib/api/types';
import {
  heldParkHeadline,
  newerParkHeadline,
  recordParkHeadline,
  subscribeParkHeadlines,
  type ParkHeadline,
} from '@/lib/parks/park-headline';

/** What a surface knows about a park's headline, and whether the park is open by its answer. */
interface OwnParkHeadline extends Omit<ParkHeadline, 'crowdLevel'> {
  /** The park's status in the same answer. Only an open park's reading is offered or replaced. */
  status?: string | null;
  /** A string, because several answers type it that way; read as a {@link CrowdLevel}. */
  crowdLevel?: CrowdLevel | string | null;
}

/**
 * A park's Ø wait and crowd level as the newest reading on the page has them: the surface offers
 * its own (`lib/parks/park-headline.ts`) and shows whichever is newer. The server and the
 * hydration render show the surface's own, since nothing is held there yet. A closed park, by the
 * surface's own answer, keeps its own figures: the reading of an open park would not fit beside
 * its status.
 */
export function useParkHeadline(
  parkId: string | null | undefined,
  own: OwnParkHeadline
): ParkHeadline {
  const held = useSyncExternalStore(
    subscribeParkHeadlines,
    () => heldParkHeadline(parkId),
    () => undefined
  );
  const open = own.status === 'OPERATING';
  const { avgWaitTime, updatedAt } = own;
  const crowdLevel = own.crowdLevel as CrowdLevel | null | undefined;

  useEffect(() => {
    if (parkId && open) recordParkHeadline(parkId, { avgWaitTime, crowdLevel, updatedAt });
  }, [parkId, open, avgWaitTime, crowdLevel, updatedAt]);

  const ownHeadline: ParkHeadline = { avgWaitTime, crowdLevel, updatedAt };
  return open ? newerParkHeadline(ownHeadline, held) : ownHeadline;
}

/**
 * The headline as a park payload (the park page's poll) states it: `statistics` for the figures,
 * `occupancy.updatedAt` for when they were read.
 */
export function parkPayloadHeadline(
  park: Pick<ParkWithAttractions, 'status' | 'analytics'>
): OwnParkHeadline {
  return {
    status: park.status,
    avgWaitTime: park.analytics?.statistics?.avgWaitTime,
    crowdLevel: park.analytics?.statistics?.crowdLevel,
    updatedAt: park.analytics?.occupancy?.updatedAt,
  };
}

/** A search or browse row as {@link useRowHeadline} reads it. */
interface HeadlineRow {
  type: string;
  id: string;
  status?: string;
  avgWaitTime?: number;
  load?: CrowdLevel;
  /** When the API read `avgWaitTime` and `load` (ISO 8601). */
  headlineUpdatedAt?: string;
}

/**
 * A park row with its Ø wait and crowd level from the newest reading on the page, so the hero, its
 * chips and the palette say what the favourites and the park's own page say. Any other row, and a
 * park row nothing newer is known for, comes back as it was.
 */
export function useRowHeadline<T extends HeadlineRow>(row: T): T {
  const isPark = row.type === 'park';
  const headline = useParkHeadline(isPark ? row.id : undefined, {
    status: row.status,
    avgWaitTime: row.avgWaitTime,
    crowdLevel: row.load,
    updatedAt: row.headlineUpdatedAt,
  });
  if (!isPark || (headline.avgWaitTime === row.avgWaitTime && headline.crowdLevel === row.load)) {
    return row;
  }
  return {
    ...row,
    avgWaitTime: headline.avgWaitTime ?? undefined,
    load: headline.crowdLevel ?? undefined,
  };
}
