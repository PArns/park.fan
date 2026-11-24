import type { LiveParkSnapshot } from '@/lib/api/parks';
import type { CrowdLevel, ParkAttraction, ParkStatus } from '@/lib/api/types';
import { getLiveAttractionStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { stripNewPrefix } from '@/lib/utils';
import { isWalkOnWait, roundWaitTo5 } from '@/lib/utils/wait-time';
import type { ParkyPlay } from './acts';

/**
 * What the live data on a park's page gives Parky to say once: a headliner is a walk-on, a queue
 * runs over an hour, the park is very full, it is shut today, or a show starts soon.
 */
export type LiveMoment = 'walkOn' | 'queue' | 'full' | 'closed' | 'show';

/** What can happen between two live polls while the page is open, beside a {@link LiveMoment}. */
export type LiveChange = 'down' | 'drop';

/**
 * The limits, in minutes: a walk-on, a queue that offends him, and a drop worth a whisper (at
 * least this much and at least half the wait gone).
 */
export const LIVE_LIMITS = { walkOn: 10, queue: 60, drop: 20 } as const;

/**
 * Whether a live standby wait is a walk-on by Parky's line: {@link isWalkOnWait} with his own
 * `limit`, wider than the five minutes the walk-on colour stops at, and the posted 13 either way.
 */
export function isWalkOn(wait: number, limit: number = LIVE_LIMITS.walkOn): boolean {
  return isWalkOnWait(wait, limit);
}

/**
 * How far under its usual wait for the hour a ride has to be for „Jetzt hin!“: at most half. A few
 * minutes under the usual moves from one poll to the next; half of a usual 40 is a 20 the visitor
 * does not get at this hour on an ordinary day.
 */
export const BELOW_TYPICAL_SHARE = 0.5;

/**
 * A stamp is only news on a ride that usually queues at least this long. A walk-on on a ride that
 * is a walk-on anyway says nothing the wait beside it does not.
 */
export const STAMP_MIN_USUAL = 20;

/**
 * More rides than this standing out at once, and none does: the park is simply empty, and every
 * card's crowd badge already says so.
 */
export const STANDOUT_MAX = 3;

/** What Parky's stamp says about one ride's live wait (`parkyStill.stamp`). */
export type RideStampVerdict = 'walkOn' | 'belowTypical';

/**
 * Parky's stamp for a ride's live standby `wait` against its `usual` wait, null where it says
 * nothing: no usual, or one under {@link STAMP_MIN_USUAL}. Otherwise `walkOn` for a walk-on as his
 * own line counts one ({@link isWalkOn}), and `belowTypical` when the five-minute figure the page
 * prints is at most {@link BELOW_TYPICAL_SHARE} of the usual. The ride page's usual is the typical
 * for this hour it prints under the wait; a park's list uses each ride's `baseline`.
 */
export function rideStampVerdict(wait: number, usual: number | null): RideStampVerdict | null {
  if (usual === null || usual < STAMP_MIN_USUAL) return null;
  if (isWalkOn(wait)) return 'walkOn';
  if (roundWaitTo5(wait) <= usual * BELOW_TYPICAL_SHARE) return 'belowTypical';
  return null;
}

const NO_STANDOUTS: ReadonlyMap<string, RideStampVerdict> = new Map();

/**
 * The rides of one park whose live wait stands out against their own `baseline` right now, with
 * their {@link rideStampVerdict}: open, as `parkStatus` and the ride's own status read together.
 * None at all when more than {@link STANDOUT_MAX} do, since then nothing stands out.
 */
export function standoutRides(
  rides: readonly ParkAttraction[],
  parkStatus?: ParkStatus
): ReadonlyMap<string, RideStampVerdict> {
  const standouts = new Map<string, RideStampVerdict>();
  for (const ride of rides) {
    if (getLiveAttractionStatus(ride, parkStatus) !== 'OPERATING') continue;
    const wait = getStandbyWait(ride);
    const verdict = wait === null ? null : rideStampVerdict(wait, ride.baseline ?? null);
    if (verdict) standouts.set(ride.id, verdict);
  }
  return standouts.size > STANDOUT_MAX ? NO_STANDOUTS : standouts;
}

/**
 * `?parky=live`: any open queue counts as long, so an open park always has its line; the walk-on
 * keeps its limit, since its line calls the wait a gift.
 */
const PREVIEW_LIMITS = { walkOn: LIVE_LIMITS.walkOn, queue: 0 } as const;

/**
 * A show starting this many minutes from now, both ends included, is worth a line: soon enough to
 * matter, far enough off to get a seat.
 */
export const SHOW_SOON_MIN = { from: 15, to: 30 } as const;

/** How long a show counts as running after its start; the API sends no end or duration. */
export const SHOW_RUN_MIN = 30;

const FULL: readonly CrowdLevel[] = ['very_high', 'extreme'];

/**
 * An act without a line, on a noticeable change of the live data, comes at most this often; a
 * poll lands every five minutes, so this lets most changes play and keeps a flapping ride quiet.
 */
export const LIVE_ACT_GAP_MS = 4 * 60_000;

/**
 * What Parky says about each reading (`assistant` namespace, with `{park}`, `{ride}` and
 * `{wait}`, a show's with `{show}` and `{minutes}`), each with the act it goes with: airtime for a
 * walk-on, grumpy at a long queue, squashed in a full park, a nap or a book on a closed day,
 * applause before a show, a startle when a ride goes down and a hop when its queue drops. A change that newly brings a moment plays that moment's act, without
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
  show: ['liveShow1', 'liveShow2', 'liveShow3'].map((key) => ({ key, act: 'applause' as const })),
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

/**
 * One reading of the live data: the moment or change, and the ride and wait or the show and the
 * minutes until it starts that it is about.
 */
export interface LiveReading<K extends string = LiveMoment | LiveChange> {
  kind: K;
  ride?: string;
  wait?: number;
  show?: string;
  minutes?: number;
}

/** Every start of today's shows in the live data, in epoch ms, with the show's name. */
function showStarts(park: LiveParkSnapshot): { show: string; at: number }[] {
  return (park.shows ?? []).flatMap((show) =>
    show.status === 'CLOSED'
      ? []
      : (show.showtimes ?? []).flatMap(({ startTime }) => {
          const at = Date.parse(startTime);
          return Number.isNaN(at) ? [] : [{ show: stripNewPrefix(show.name), at }];
        })
  );
}

/**
 * The next show that starts within {@link SHOW_SOON_MIN} of `now`, or with `anyLater` (`?parky=show`)
 * the next one still to start today; `null` when there is none.
 */
export function showSoon(
  park: LiveParkSnapshot,
  now: number,
  anyLater = false
): LiveReading<'show'> | null {
  const next = showStarts(park)
    .map(({ show, at }) => ({ show, minutes: Math.round((at - now) / 60_000) }))
    .filter(({ minutes }) =>
      anyLater ? minutes > 0 : minutes >= SHOW_SOON_MIN.from && minutes <= SHOW_SOON_MIN.to
    )
    .sort((a, b) => a.minutes - b.minutes)[0];
  return next ? { kind: 'show', ...next } : null;
}

/** Whether one of the park's shows is on right now: started, and less than {@link SHOW_RUN_MIN} ago. */
export function showRunning(park: LiveParkSnapshot, now: number): boolean {
  return showStarts(park).some(({ at }) => at <= now && now < at + SHOW_RUN_MIN * 60_000);
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
 * walk-on, a very full park, a queue over an hour, a show starting soon; `null` when none holds.
 * `headliners` are ride names (the park's favourite and its top attractions); `closedToday` comes
 * from the opening hours. `preview` (`?parky=live`) counts any open queue as long. The shows count
 * only with `shows`, the clock to read them at; its `preview` (`?parky=show`) takes any show still
 * to start today, ahead of every other moment.
 */
export function liveMoment(
  park: LiveParkSnapshot,
  headliners: readonly string[],
  closedToday: boolean,
  preview = false,
  shows?: { now: number; preview?: boolean }
): LiveReading<LiveMoment> | null {
  if (shows?.preview) {
    const show = showSoon(park, shows.now, true);
    if (show) return show;
  }
  if (closedToday && park.status !== 'OPERATING') return { kind: 'closed' };
  if (park.status !== 'OPERATING') return null;
  const limits = preview ? PREVIEW_LIMITS : LIVE_LIMITS;
  const rides = ridesOf(park);
  const walkOn = openHeadliners(rides, headliners).find((ride) =>
    isWalkOn(ride.wait!, limits.walkOn)
  );
  if (walkOn) {
    return { kind: 'walkOn', ride: walkOn.name, wait: walkOn.wait! };
  }
  // As the park header reads it: the day's statistic, else the live load.
  const level = park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel;
  if (level && FULL.includes(level)) return { kind: 'full' };
  const queue = longestQueue(rides);
  if (queue && queue.wait! > limits.queue) {
    return { kind: 'queue', ride: queue.name, wait: queue.wait! };
  }
  return shows ? showSoon(park, shows.now) : null;
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
