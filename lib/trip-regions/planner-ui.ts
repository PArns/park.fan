'use client';

import type { TripWizardQuestion, TripWizardStepKey } from './wizard-steps';

/**
 * Opening the trip planner's assistant, as a signal from outside the planner: the hub's hero and
 * landing ask, the result's answers ask for one step, the mounted `TripRegionPlanner` answers. A
 * queue of one rather than state, like the day planner's `plannerUi`, so two presses are two
 * requests; one made before the planner is on screen waits for it.
 */
type Listener = () => void;

/** Where a start came from, as `trip_planner_started` counts it. */
export type TripPlannerStartSource = 'hero' | 'landing' | 'restart';

/**
 * A request to open the assistant: on its first step with the start's source, on its Tickets step
 * with the ticket step open (`tickets`, a start too), or on one step from the result's answers
 * (`answers`), which is a way back in rather than a start.
 */
export type TripPlannerRequest =
  | { kind: 'start'; source: TripPlannerStartSource }
  | { kind: 'tickets' }
  | { kind: 'step'; step: TripWizardStepKey };

let pending: TripPlannerRequest | null = null;
const listeners = new Set<Listener>();

function ask(request: TripPlannerRequest): void {
  pending = request;
  for (const listener of listeners) listener();
}

/** The trip planner's open signal. */
export const tripPlannerUi = {
  /**
   * Open the assistant on its first step: the hub's hero (`hero`), the landing's "Reise planen"
   * (`landing`), or "Neu starten" once the answers are cleared (`restart`).
   */
  openStart(source: TripPlannerStartSource = 'hero'): void {
    ask({ kind: 'start', source });
  },
  /**
   * Open the assistant on its Tickets step with the ticket step open, from the landing's "Already
   * have tickets? Add them": tickets bought for fixed days give the trip its dates, so they may come
   * before them.
   */
  openTickets(): void {
    ask({ kind: 'tickets' });
  },
  /** Open the assistant on one step, from an answer in the result ("Hotel: Disney-Hotel"). */
  openStep(step: TripWizardStepKey): void {
    ask({ kind: 'step', step });
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The request waiting for the planner, consumed by the planner when it answers. */
  take(): TripPlannerRequest | null {
    const request = pending;
    pending = null;
    return request;
  },
};

const ANSWERED_KEY = 'parkfan:trip-wizard-answered';
const answeredListeners = new Set<Listener>();
const NONE: ReadonlySet<TripWizardQuestion> = new Set();
let answeredCache: { raw: string | null; value: Record<string, ReadonlySet<TripWizardQuestion>> } =
  {
    raw: null,
    value: {},
  };

function answeredStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readAnswered(): Record<string, ReadonlySet<TripWizardQuestion>> {
  let raw: string | null = null;
  try {
    raw = answeredStorage()?.getItem(ANSWERED_KEY) ?? null;
  } catch {
    // Without storage the answers count for as long as the page is open.
  }
  if (raw === answeredCache.raw) return answeredCache.value;
  let value: Record<string, ReadonlySet<TripWizardQuestion>> = {};
  try {
    const parsed = raw ? (JSON.parse(raw) as Record<string, TripWizardQuestion[]>) : {};
    value = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, new Set(v)]));
  } catch {
    // A broken record is no answer.
  }
  answeredCache = { raw, value };
  return value;
}

/** Write every region's answers, to the tab's storage and the cache, and tell the readers. */
function writeAnswered(value: Record<string, ReadonlySet<TripWizardQuestion>>): void {
  const raw = JSON.stringify(
    Object.fromEntries(Object.entries(value).map(([k, v]) => [k, [...v]]))
  );
  try {
    answeredStorage()?.setItem(ANSWERED_KEY, raw);
  } catch {
    // Kept in memory below.
  }
  answeredCache = { raw: answeredStorage() ? raw : answeredCache.raw, value };
  for (const listener of answeredListeners) listener();
}

/**
 * The questions the visitor answered in the assistant, per region, for this tab: a step left with
 * "Next" answers its questions, a skipped one does not. What the API cannot know (a free arrival
 * day left out of the query reads the same as one nobody asked about), so Parky's ideas
 * (`shownIdeas`) leave an answered question alone.
 */
export const tripWizardAnswered = {
  /** Mark questions answered in `region`. */
  mark(region: string, questions: readonly TripWizardQuestion[]): void {
    if (questions.length === 0) return;
    const all = readAnswered();
    const next = new Set([...(all[region] ?? []), ...questions]);
    if (next.size === (all[region]?.size ?? 0)) return;
    writeAnswered({ ...all, [region]: next });
  },
  /**
   * Forget what `region`'s assistant was told, for a deleted or restarted trip; the other regions
   * keep theirs. Returns how to put the answers back.
   */
  forget(region: string): () => void {
    const all = readAnswered();
    const kept = all[region];
    if (!kept) return () => undefined;
    const rest = { ...all };
    delete rest[region];
    writeAnswered(rest);
    return () => writeAnswered({ ...readAnswered(), [region]: kept });
  },
  /** The answered questions of `region`; the same set until the next mark. */
  get(region: string): ReadonlySet<TripWizardQuestion> {
    return readAnswered()[region] ?? NONE;
  },
  /** Nothing is answered before the browser has read the tab's record. */
  getServer(): ReadonlySet<TripWizardQuestion> {
    return NONE;
  },
  subscribe(listener: Listener): () => void {
    answeredListeners.add(listener);
    return () => answeredListeners.delete(listener);
  },
};
