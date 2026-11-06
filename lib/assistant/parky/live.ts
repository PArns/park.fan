import type { LiveParkSnapshot } from '@/lib/api/parks';
import type { CrowdLevel, ParkAttraction } from '@/lib/api/types';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { stripNewPrefix } from '@/lib/utils';
import type { ParkyPlay } from './acts';

/**
 * What the live waits on a park's page give Parky to say once: a headliner is a walk-on, a queue
 * runs over an hour, the park is very full, or it is shut today.
 */
export type LiveMoment = 'walkOn' | 'queue' | 'full' | 'closed';

/** What can happen between two live polls while the page is open, beside a {@link LiveMoment}. */
export type LiveChange = 'down' | 'drop';

/**
 * The limits, in minutes: a walk-on, a queue that offends him, and a drop worth a whisper (at
 * least this much and at least half the wait gone).
 */
export const LIVE_LIMITS = { walkOn: 10, queue: 60, drop: 20 } as const;

/** `?parky=live`: every limit open, so a page shows its line whatever its waits are now. */
const PREVIEW_LIMITS = { walkOn: Infinity, queue: 0 } as const;

const FULL: readonly CrowdLevel[] = ['very_high', 'extreme'];

/**
 * An act without a line, on a noticeable change of the live data, comes at most this often; a
 * poll lands every five minutes, so this lets most changes play and keeps a flapping ride quiet.
 */
export const LIVE_ACT_GAP_MS = 4 * 60_000;

/**
 * What Parky says about each reading (`assistant` namespace, with `{park}`, `{ride}` and
 * `{wait}`), each with the act it goes with: airtime for a walk-on, grumpy at a long queue,
 * squashed in a full park, a nap or a book on a closed day, a startle when a ride goes down and a
 * hop when its queue drops. A change that newly brings a moment plays that moment's act, without
 * its line.
 */
export const LIVE_LINES: Record<
  LiveMoment | LiveChange,
  readonly { key: string; act: ParkyPlay }[]
> = {
  walkOn: ['liveWalkOn1', 'liveWalkOn2', 'liveWalkOn3'].map((key) => ({
    key,
    act: 'airtime' as const,
  })),
  queue: ['liveQueue1', 'liveQueue2', 'liveQueue3'].map((key) => ({ key, act: 'grumpy' as const })),
  full: ['liveFull1', 'liveFull2', 'liveFull3'].map((key) => ({ key, act: 'squashed' as const })),
  closed: [
    { key: 'liveClosed1', act: 'doze' },
    { key: 'liveClosed2', act: 'read' },
    { key: 'liveClosed3', act: 'read' },
  ],
  down: ['liveDown1', 'liveDown2', 'liveDown3'].map((key) => ({ key, act: 'startle' as const })),
  drop: ['liveDrop1', 'liveDrop2', 'liveDrop3'].map((key) => ({ key, act: 'hop' as const })),
};

/** How many of the park's top attractions (by `/stats`) count as headliners beside its favourite. */
const TOP_HEADLINERS = 5;

/** The rides Parky watches: the park's favourite (`PARK_FAVOURITES`) and its top attractions. */
export function headlinersOf(
  favourite: string | undefined,
  top: readonly { attractionName: string }[]
): string[] {
  const names = top.slice(0, TOP_HEADLINERS).map((ride) => ride.attractionName);
  return favourite ? [favourite, ...names] : names;
}

/** One reading of the live data: the moment or change, and the ride and wait it is about. */
export interface LiveReading<K extends string = LiveMoment | LiveChange> {
  kind: K;
  ride?: string;
  wait?: number;
}

interface Ride {
  name: string;
  open: boolean;
  down: boolean;
  wait: number | null;
}

function ridesOf(park: LiveParkSnapshot): Ride[] {
  return (park.attractions ?? []).map((ride) => {
    const status = getLiveAttractionStatus(ride as ParkAttraction, park.status);
    return {
      name: stripNewPrefix(ride.name),
      open: status === 'OPERATING',
      down: status === 'DOWN',
      wait: getStandbyWait(ride as ParkAttraction),
    };
  });
}

/** The headliners on the page that are open with a wait, shortest first. */
function openHeadliners(rides: Ride[], headliners: readonly string[]): Ride[] {
  const names = new Set(headliners.map(stripNewPrefix));
  return rides
    .filter((ride) => ride.open && ride.wait !== null && names.has(ride.name))
    .sort((a, b) => a.wait! - b.wait!);
}

function longestQueue(rides: Ride[]): Ride | null {
  return rides.reduce<Ride | null>(
    (top, ride) => (ride.open && ride.wait !== null && ride.wait > (top?.wait ?? -1) ? ride : top),
    null
  );
}

/**
 * The moment the park's live data gives right now, best first: shut today, a headliner that is a
 * walk-on, a very full park, a queue over an hour; `null` when none holds. `headliners` are ride
 * names (the park's favourite and its top attractions); `closedToday` comes from the opening hours.
 * `preview` (`?parky=live`) opens every limit.
 */
export function liveMoment(
  park: LiveParkSnapshot,
  headliners: readonly string[],
  closedToday: boolean,
  preview = false
): LiveReading<LiveMoment> | null {
  if (closedToday && park.status !== 'OPERATING') return { kind: 'closed' };
  if (park.status !== 'OPERATING') return null;
  const limits = preview ? PREVIEW_LIMITS : LIVE_LIMITS;
  const rides = ridesOf(park);
  const walkOn = openHeadliners(rides, headliners)[0];
  if (walkOn && walkOn.wait! <= limits.walkOn) {
    return { kind: 'walkOn', ride: walkOn.name, wait: walkOn.wait! };
  }
  const level = park.currentLoad?.crowdLevel;
  if (level && FULL.includes(level)) return { kind: 'full' };
  const queue = longestQueue(rides);
  if (queue && queue.wait! > limits.queue) {
    return { kind: 'queue', ride: queue.name, wait: queue.wait! };
  }
  return null;
}

/**
 * What changed between two polls that Parky notices, the most notable first: a headliner went
 * down, a headliner's wait dropped sharply, then a moment that newly holds (a walk-on, a queue
 * over an hour, the park turning very full). Rides outside `headliners` count only when no
 * headliner is known. `null` when nothing worth an act changed.
 */
export function liveChange(
  before: LiveParkSnapshot,
  after: LiveParkSnapshot,
  headliners: readonly string[]
): LiveReading | null {
  const known = new Set(headliners.map(stripNewPrefix));
  const counts = (ride: Ride) => known.size === 0 || known.has(ride.name);
  const earlier = new Map(ridesOf(before).map((ride) => [ride.name, ride]));
  const now = ridesOf(after).filter(counts);
  const down = now.find((ride) => ride.down && earlier.get(ride.name)?.open);
  if (down) return { kind: 'down', ride: down.name };
  const drop = now.find((ride) => {
    const was = earlier.get(ride.name)?.wait;
    if (!ride.open || ride.wait === null || was == null) return false;
    return was - ride.wait >= LIVE_LIMITS.drop && ride.wait <= was / 2;
  });
  if (drop) return { kind: 'drop', ride: drop.name, wait: drop.wait! };
  const then = liveMoment(before, headliners, false);
  const moment = liveMoment(after, headliners, false);
  return moment && moment.kind !== then?.kind ? moment : null;
}

/** Whether an act without a line may play now, the last one having played at `lastAt`. */
export function liveActDue(lastAt: number | null, now: number): boolean {
  return lastAt === null || now - lastAt >= LIVE_ACT_GAP_MS;
}
