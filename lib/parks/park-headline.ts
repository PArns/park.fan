import type { CrowdLevel } from '@/lib/api/types';

/**
 * A park's live headline, its Ø wait and crowd level: one occupancy reading of the API's, with the
 * time it was taken. The same park arrives in several answers (favourites, nearby, the park's own
 * poll, the region lists), each fetched at its own moment and cached upstream for its own time, so
 * two cards on one page could show two readings minutes apart. Every reader of a park's headline
 * goes through {@link useParkHeadline} (`lib/hooks/use-park-headline.ts`), which shows the newest
 * reading any answer on the page has carried.
 *
 * Kept free of React so `scripts/test-park-headline.mjs` can import it directly.
 */
export interface ParkHeadline {
  avgWaitTime?: number | null;
  crowdLevel?: CrowdLevel | null;
  /** When the API took the reading (ISO 8601). Without it a reading never enters the store. */
  updatedAt?: string | null;
}

/** A stored reading, with its time parsed once. */
interface HeldHeadline extends ParkHeadline {
  readAt: number;
}

const held = new Map<string, HeldHeadline>();
const listeners = new Set<() => void>();

/** Epoch ms of a reading's `updatedAt`, `null` when it has none or it does not parse. */
function readTimeOf(updatedAt: string | null | undefined): number | null {
  const time = updatedAt ? Date.parse(updatedAt) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

/**
 * Keeps a park's reading when it is newer than the one held. An older or equal one changes nothing
 * and wakes nobody, so every card of a park can offer its own on every render.
 */
export function recordParkHeadline(parkId: string, reading: ParkHeadline): void {
  const readAt = readTimeOf(reading.updatedAt);
  if (readAt === null) return;
  const current = held.get(parkId);
  if (current && current.readAt >= readAt) return;
  held.set(parkId, {
    avgWaitTime: reading.avgWaitTime ?? null,
    crowdLevel: reading.crowdLevel ?? null,
    updatedAt: reading.updatedAt,
    readAt,
  });
  for (const listener of listeners) listener();
}

/**
 * The newest reading held for a park, or `undefined`. The object keeps its identity until a newer
 * reading replaces it, as `useSyncExternalStore` requires.
 */
export function heldParkHeadline(parkId: string | null | undefined): ParkHeadline | undefined {
  return parkId ? held.get(parkId) : undefined;
}

/** Subscribes to new readings; returns the unsubscribe. Shaped for `useSyncExternalStore`. */
export function subscribeParkHeadlines(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The newer of a surface's own reading and the one held. A held reading beats an own one without a
 * time: the held one was read at a known moment by an answer on this page, the own one is from an
 * answer that does not say.
 */
export function newerParkHeadline<T extends ParkHeadline>(
  own: T,
  heldReading: ParkHeadline | undefined
): ParkHeadline {
  if (!heldReading) return own;
  const ownAt = readTimeOf(own.updatedAt);
  const heldAt = readTimeOf(heldReading.updatedAt);
  if (heldAt === null || (ownAt !== null && ownAt >= heldAt)) return own;
  return heldReading;
}

/** Forgets every reading. For tests. */
export function resetParkHeadlines(): void {
  held.clear();
}
