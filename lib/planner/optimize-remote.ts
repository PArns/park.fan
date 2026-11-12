import type { PlanDay } from '@/lib/api/types';
import type { FitBlock, FitChoice, FitLever, FitWish } from './fit';
import { dayClock, resolveTimeZone, type DayClock } from './park-time';
import type { PlannerDayPrefs, PlannerEntry, PlannerGeo } from './types';

/**
 * The day optimizer, asked over the network. It runs in the API (`POST …/plan/optimize`, behind
 * the data key, relayed by `app/api/parks/[...path]/route.ts`), so the buttons, the fit assistant,
 * the wizard and Parky get one answer and the browser never searches a forecast itself. The
 * contract is the API's docs/frontend/plan-day/optimize.md; see
 * docs/features/trip-planner/optimizer.md.
 */

/** Which question the optimizer is asked: re-order, add the headliners, or answer the assistant. */
export type OptimizeMode = 'day' | 'headliners' | 'fit';

/** One stop of an optimised plan, in the shape `applyPlan` writes. */
export interface OptimizeStop {
  /** The entry this stop is, or `null` for a ride the optimiser is adding. */
  entryId: string | null;
  attractionSlug: string;
  attractionName: string;
  startMinute: number;
  /** The wait the schedule was built on. `null` where the day has no figure. */
  waitMinutes: number | null;
  /** Whether this stop's queue is joined before the park closes. */
  fits: boolean;
}

/** A day scored by the optimizer's own rules, before or after a press. */
export interface PlanScore {
  /** Minutes queued across the stops that happen, raw rather than on the five-minute grid. */
  totalWaitMinutes: number;
  idleMinutes: number;
  endMinute: number;
  /** Stops whose queue is joined after closing. */
  overflow: number;
  /** Times the next thing starts before the one before it is over and walked from. */
  clashes: number;
}

/** The fit assistant's answer for one choice, as the API sends it. */
export interface FitAnswer {
  wishes: Omit<FitWish, 'ride'>[];
  blocks: FitBlock[];
  /** Wish keys in the order the day is decided in. */
  order: string[];
  /** Wishes still ticked. */
  wanted: number;
  /** Wish keys that get a slot before closing, in plan order. */
  fitted: string[];
  /** Ticked wishes that find no minute before closing. */
  missed: string[];
  endMinute: number;
  totalWaitMinutes: number;
  idleMinutes: number;
  /** The entries the day keeps under this choice, written before the stops. */
  entries: PlannerEntry[];
  stops: OptimizeStop[];
  /** What each free block would buy, where asked for. */
  levers: FitLever[] | null;
  /** Lever keys (`kind:entryId`) already pulled, where levers were asked for. */
  applied: string[] | null;
}

/** What `POST …/plan/optimize` answers. */
export interface OptimizeAnswer {
  date: string;
  mode: OptimizeMode;
  status: 'optimized' | 'unchanged' | 'needs-fit' | 'fit' | 'refused';
  refusal:
    'past-day' | 'no-plan' | 'no-hours' | 'no-wait-times' | 'no-rides' | 'unknown-ride' | null;
  /** The clock the day was planned against. */
  clock: DayClock;
  /** The most rides one search holds. */
  maxStops: number;
  /** Slugs of the rides offered on top of the entries. */
  add: string[];
  /** Headliners this party cannot ride (`headliners`). */
  skippedHeadliners: number;
  /** Entries the optimizer may move. */
  movable: number;
  before: PlanScore | null;
  after: PlanScore | null;
  plan: {
    stops: OptimizeStop[];
    totalWaitMinutes: number;
    idleMinutes: number;
    endMinute: number;
    overflow: number;
    /** Rides left out because one search holds at most `maxStops`. */
    capped: number;
  } | null;
  fit: FitAnswer | null;
}

/** The park and day a request is about. */
export interface OptimizeTarget {
  geo: PlannerGeo;
  parkSlug: string;
  /** Park-local `YYYY-MM-DD`. */
  date: string;
  /** The park's zone, for the minute a plan for today starts from. */
  timezone?: string;
}

/**
 * The question behind a fit assistant: the day as it stood when the question came up, and the
 * rides being added. Held while the visitor answers, so every answer is about the same day.
 */
export interface FitQuestion {
  target: OptimizeTarget;
  entries: readonly PlannerEntry[];
  prefs?: PlannerDayPrefs;
  /** Slugs of the rides offered on top of the entries. */
  add: readonly string[];
  /**
   * The park-local minute the question was asked at, on today's date, so the answers in one dialog
   * are all about the same morning.
   */
  nowMinute?: number;
}

/** A fit question about `entries` with `add` on top, with the clock read once, now. */
export function fitQuestion(
  target: OptimizeTarget,
  entries: readonly PlannerEntry[],
  prefs: PlannerDayPrefs | undefined,
  add: readonly string[]
): FitQuestion {
  const clock = dayClock(target.date, resolveTimeZone(target.timezone));
  return {
    target,
    entries,
    prefs,
    add,
    ...(clock.phase === 'today' && { nowMinute: clock.nowMinute }),
  };
}

/** What a caller sets on one request; the target, day and clock are filled in. */
export interface OptimizeAsk {
  mode: OptimizeMode;
  entries: readonly PlannerEntry[];
  prefs?: PlannerDayPrefs;
  add?: readonly string[];
  choice?: FitChoice;
  levers?: boolean;
  preview?: boolean;
  /** The minute to plan from on today's date; read from the park's clock where absent. */
  nowMinute?: number;
}

/** The optimizer answered with an error status, or could not be reached (`status` 0). */
export class OptimizeError extends Error {
  /** The HTTP status, or 0 where there was no answer. */
  readonly status: number;

  constructor(status: number) {
    super(`plan optimize: ${status || 'unreachable'}`);
    this.status = status;
  }
}

/** An entry as the API reads it: the deprecated `hour` mirror stays home. */
function entryBody(entry: PlannerEntry): PlannerEntry {
  const { hour: _hour, ...rest } = entry;
  return rest;
}

/** The three day answers the optimizer reads, and nothing the store adds later. */
function prefsBody(prefs: PlannerDayPrefs | undefined): PlannerDayPrefs | undefined {
  if (!prefs) return undefined;
  const { riderHeightCm, avoidWet, earlyEntry } = prefs;
  return { riderHeightCm, avoidWet, earlyEntry };
}

/** A choice as the API reads it: the sets as lists. */
function choiceBody(choice: FitChoice) {
  return {
    dropped: [...choice.dropped],
    droppedBlocks: [...choice.droppedBlocks],
    shortBlocks: [...choice.shortBlocks],
    priority: [...choice.priority],
  };
}

/**
 * Asks the optimizer one question about one day. On today's date the park-local minute goes
 * along, so the plan starts where the visitor's now line is.
 */
export async function requestOptimize(
  target: OptimizeTarget,
  ask: OptimizeAsk,
  signal?: AbortSignal
): Promise<OptimizeAnswer> {
  const clock = dayClock(target.date, resolveTimeZone(target.timezone));
  const nowMinute = clock.phase === 'today' ? (ask.nowMinute ?? clock.nowMinute) : undefined;
  const body = {
    date: target.date,
    mode: ask.mode,
    entries: ask.entries.map(entryBody),
    ...(ask.prefs && { prefs: prefsBody(ask.prefs) }),
    ...(nowMinute !== undefined && { nowMinute }),
    ...(ask.add && { add: [...ask.add] }),
    ...(ask.choice && { choice: choiceBody(ask.choice) }),
    ...(ask.levers !== undefined && { levers: ask.levers }),
    ...(ask.preview !== undefined && { preview: ask.preview }),
  };
  const { geo, parkSlug } = target;
  let response: Response;
  try {
    response = await fetch(
      `/api/parks/${geo.continent}/${geo.country}/${geo.city}/${parkSlug}/plan/optimize`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal,
      }
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new OptimizeError(0);
  }
  if (!response.ok) throw new OptimizeError(response.status);
  return withNulls(await response.json());
}

/** A stop with the `null`s the API leaves out of its JSON put back. */
function stopWithNulls(stop: OptimizeStop): OptimizeStop {
  return { ...stop, entryId: stop.entryId ?? null, waitMinutes: stop.waitMinutes ?? null };
}

/**
 * The answer as the types promise it. The API drops every `null` field from its JSON, and a stop
 * without an `entryId` is a ride being added, which callers test with `=== null`.
 */
function withNulls(raw: OptimizeAnswer): OptimizeAnswer {
  const fit = raw.fit ?? null;
  return {
    ...raw,
    refusal: raw.refusal ?? null,
    before: raw.before ?? null,
    after: raw.after ?? null,
    plan: raw.plan ? { ...raw.plan, stops: raw.plan.stops.map(stopWithNulls) } : null,
    fit: fit && {
      ...fit,
      wishes: fit.wishes.map((wish) => ({ ...wish, entryId: wish.entryId ?? null })),
      stops: fit.stops.map(stopWithNulls),
      levers: fit.levers ?? null,
      applied: fit.applied ?? null,
    },
  };
}

/**
 * The fit assistant's answer for one choice. A refusal is an error here: the question was asked
 * about a day the optimizer could plan, so a refusal means the day changed under it.
 */
export async function requestFit(
  question: FitQuestion,
  choice: FitChoice,
  levers: boolean,
  signal?: AbortSignal
): Promise<FitAnswer> {
  const answer = await requestOptimize(
    question.target,
    {
      mode: 'fit',
      entries: question.entries,
      prefs: question.prefs,
      add: question.add,
      choice,
      levers,
      nowMinute: question.nowMinute,
    },
    signal
  );
  if (!answer.fit) throw new OptimizeError(409);
  return answer.fit;
}

/**
 * The wishes of an answer with the day's own ride rows joined back on, which the list draws a
 * photo and a peak from. A ride the payload does not hold draws without them.
 */
export function wishesWithRides(
  wishes: readonly Omit<FitWish, 'ride'>[],
  day: PlanDay | null | undefined
): FitWish[] {
  return wishes.map((wish) => ({
    ...wish,
    ride: day?.rides.find((ride) => ride.attractionSlug === wish.attractionSlug) ?? null,
  }));
}

/**
 * What a planned day looks like to the optimizer: which ride or how long a block, where it sits,
 * and whether it has been walked. A free block's label and icon are left out, so typing one is
 * not a new question.
 */
export function optimizeKeyOf(entries: readonly PlannerEntry[]): string {
  return entries
    .map((entry) =>
      [
        entry.id,
        entry.attractionSlug ?? '',
        entry.attractionName ?? '',
        entry.showSlug ?? '',
        entry.startMinute,
        entry.done ? 1 : 0,
        entry.actualWait ?? '',
        entry.custom?.durationMinutes ?? '',
      ].join(':')
    )
    .join('|');
}
