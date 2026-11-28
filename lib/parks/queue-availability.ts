import type { QueueDataItem, QueueType } from '@/lib/api/types';

/**
 * Whether a lane hands out slots right now, read from the queue's `state`. `full` is a pause
 * (ThemeParks.wiki's `TEMP_FULL`), `finished` the end of the day's allocation. `null` is a state we
 * do not know: no statement either way, never a reason to call the lane shut.
 */
export type QueueAvailability = 'available' | 'full' | 'finished' | null;

/** A lane that runs today but hands out nothing right now: `full` or `finished`. */
export type QueueShut = Exclude<QueueAvailability, 'available' | null>;

/**
 * The one reading of a queue's `state`, for the card and the ride page alike. The API sends it on
 * every queue type; the paid lanes keep their price while they are full or finished.
 */
export function queueAvailability(queue: QueueDataItem): QueueAvailability {
  const state = 'state' in queue ? queue.state : null;
  switch (state) {
    case 'AVAILABLE':
      return 'available';
    case 'TEMP_FULL':
    case 'FULL':
      return 'full';
    case 'FINISHED':
    case 'CLOSED':
      return 'finished';
    default:
      return null;
  }
}

/**
 * `full` or `finished` while the lane hands out nothing, else `null`. A shut paid lane still
 * carries its price and its last return window or wait, and none of them may read as on sale.
 */
export function queueShut(queue: QueueDataItem): QueueShut | null {
  const availability = queueAvailability(queue);
  return availability === 'full' || availability === 'finished' ? availability : null;
}

/**
 * The queues an attraction card shows as live chips: everything but standby, and single rider
 * only while it posts a wait.
 */
export function liveQueueChips(
  queues: readonly QueueDataItem[] | null | undefined
): QueueDataItem[] {
  if (!queues) return [];
  return queues.filter((q) => {
    if (q.queueType === 'STANDBY') return false;
    if (q.queueType === 'SINGLE_RIDER') return typeof q.waitTime === 'number' && q.waitTime > 0;
    return true;
  });
}

const PAID_LANES: readonly QueueType[] = ['PAID_RETURN_TIME', 'PAID_STANDBY'];
const VIRTUAL_LINES: readonly QueueType[] = ['RETURN_TIME', 'BOARDING_GROUP'];

/**
 * Which curated fact chips a live chip already covers. The live chip names the same lane and says
 * what it does right now, full or finished included, so the fact beside it would be the same word
 * twice.
 */
export function factChipsCoveredByLive(chips: readonly QueueDataItem[]): {
  singleRider: boolean;
  virtualLine: boolean;
  fastPass: boolean;
} {
  return {
    singleRider: chips.some((q) => q.queueType === 'SINGLE_RIDER'),
    virtualLine: chips.some((q) => VIRTUAL_LINES.includes(q.queueType)),
    fastPass: chips.some((q) => PAID_LANES.includes(q.queueType)),
  };
}
