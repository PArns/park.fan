import { isUuid } from '@/lib/utils';

/**
 * Parky's interview as this tab holds it, beside the chat in session storage: which kind, the step
 * being asked, the steps answered and skipped, and a trip's must-do rides, which wait for its
 * filing into the day planner. Every answer is in the planners already; this says only where the
 * interview stands, and travels with every question (`interview`). The API's
 * `docs/frontend/assistant.md#the-interview` holds the contract.
 */

/**
 * The interview goes from simple to detailed: a short core, then the plan, then refinements Parky
 * offers as replies (`refine`). The order is a guide; a step answered early counts at once.
 */
export const TRIP_INTERVIEW_CORE = ['region', 'dates', 'parks'] as const;
/** A trip's refinements, offered once its plan stands. */
export const TRIP_INTERVIEW_REFINE = ['party', 'tickets', 'hotel', 'pace', 'file'] as const;
/** A park day's core: the park and the date, the must-dos. */
export const DAY_INTERVIEW_CORE = ['day', 'mustdo'] as const;
/** A park day's refinements, offered once the day is planned. */
export const DAY_INTERVIEW_REFINE = ['heights', 'shows', 'arrival'] as const;
/** The phase after the core: the plan stands, the refinements are on offer. */
export const INTERVIEW_REFINE = 'refine';

/** One step of either interview, or the refine phase. */
export type InterviewStep =
  | (typeof TRIP_INTERVIEW_CORE)[number]
  | (typeof TRIP_INTERVIEW_REFINE)[number]
  | (typeof DAY_INTERVIEW_CORE)[number]
  | (typeof DAY_INTERVIEW_REFINE)[number]
  | typeof INTERVIEW_REFINE;

/** A trip or a park day. */
export type InterviewKind = 'trip' | 'day';

/** The interview's state, as the API's `interview_state` action and the question carry it. */
export interface AssistantInterview {
  kind: InterviewKind;
  region?: string;
  park?: string;
  date?: string;
  step: InterviewStep;
  answered: InterviewStep[];
  skipped: InterviewStep[];
  mustDoRides: Array<{ park: string; rides: string[] }>;
  source: 'planner' | 'chat';
}

const KEY = 'parkfan:assistant-interview';
const KICKOFF_KEY = 'parkfan:assistant-interview-kickoff';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STEPS = new Set<string>([
  ...TRIP_INTERVIEW_CORE,
  ...TRIP_INTERVIEW_REFINE,
  ...DAY_INTERVIEW_CORE,
  ...DAY_INTERVIEW_REFINE,
]);

/** The core steps of an interview of this kind, the ones before its plan. */
export function interviewCore(kind: InterviewKind): readonly InterviewStep[] {
  return kind === 'trip' ? TRIP_INTERVIEW_CORE : DAY_INTERVIEW_CORE;
}

/** The refinements of an interview of this kind. */
export function interviewRefinements(kind: InterviewKind): readonly InterviewStep[] {
  return kind === 'trip' ? TRIP_INTERVIEW_REFINE : DAY_INTERVIEW_REFINE;
}

/** Whether a step belongs to this kind of interview: its core, its refinements or `refine`. */
function stepOf(kind: InterviewKind, step: InterviewStep): boolean {
  return (
    step === INTERVIEW_REFINE ||
    interviewCore(kind).includes(step) ||
    interviewRefinements(kind).includes(step)
  );
}

const isStep = (value: unknown): value is InterviewStep =>
  typeof value === 'string' && (STEPS.has(value) || value === INTERVIEW_REFINE);
const steps = (value: unknown): InterviewStep[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((s) => isStep(s) && s !== INTERVIEW_REFINE))].slice(0, 12)
    : [];

/**
 * An interview read leniently, from the API's action or this tab's storage, rebuilt so nothing
 * rides along; null for one that cannot be read.
 */
export function readInterview(value: unknown): AssistantInterview | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.kind !== 'trip' && raw.kind !== 'day') return null;
  if (!isStep(raw.step) || !stepOf(raw.kind, raw.step)) return null;
  const mustDoRides = (Array.isArray(raw.mustDoRides) ? raw.mustDoRides : [])
    .filter((m): m is { park: string; rides: unknown } => SLUG.test(String(m?.park ?? '')))
    .map((m) => ({
      park: m.park,
      rides: (Array.isArray(m.rides) ? m.rides : [])
        .filter((id): id is string => typeof id === 'string' && isUuid(id))
        .slice(0, 12),
    }))
    .slice(0, 8);
  return {
    kind: raw.kind,
    ...(typeof raw.region === 'string' && SLUG.test(raw.region) && { region: raw.region }),
    ...(typeof raw.park === 'string' && SLUG.test(raw.park) && { park: raw.park }),
    ...(typeof raw.date === 'string' && DAY.test(raw.date) && { date: raw.date }),
    step: raw.step,
    answered: steps(raw.answered),
    skipped: steps(raw.skipped),
    mustDoRides,
    source: raw.source === 'planner' ? 'planner' : 'chat',
  };
}

const listeners = new Set<() => void>();
let cached: { raw: string | null; value: AssistantInterview | null } = { raw: null, value: null };

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** The interview this tab runs, or null; stable between writes, for `useSyncExternalStore`. */
function snapshot(): AssistantInterview | null {
  const raw = storage()?.getItem(KEY) ?? null;
  if (raw === cached.raw) return cached.value;
  let value: AssistantInterview | null = null;
  try {
    value = raw ? readInterview(JSON.parse(raw)) : null;
  } catch {
    value = null;
  }
  cached = { raw, value };
  return value;
}

/** The interview's store: what runs, set or ended by the API's action and by the bar's button. */
export const interviewStore = {
  getSnapshot: snapshot,
  getServerSnapshot: (): AssistantInterview | null => null,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Set the state, or end the interview with null. */
  set(value: AssistantInterview | null): void {
    try {
      if (value) storage()?.setItem(KEY, JSON.stringify(value));
      else storage()?.removeItem(KEY);
    } catch {
      // Without storage the interview lasts as long as the page.
    }
    listeners.forEach((listener) => listener());
  },
};

/** Where an interview starts from the planner: its kind and what the planner already knows. */
export interface InterviewStart {
  kind: InterviewKind;
  region?: string;
  park?: string;
  date?: string;
}

/**
 * The planner's button: the interview set on its first step, and its first question waiting for
 * the chat window, which sends it once its session is ready (`takeInterviewKickoff`).
 */
export function startInterview(start: InterviewStart): void {
  const first = interviewCore(start.kind)[0];
  interviewStore.set({
    kind: start.kind,
    ...(start.region && { region: start.region }),
    ...(start.park && { park: start.park }),
    ...(start.date && { date: start.date }),
    step: first,
    answered: [],
    skipped: [],
    mustDoRides: [],
    source: 'planner',
  });
  try {
    storage()?.setItem(KICKOFF_KEY, start.kind);
  } catch {
    // The window then opens without the first question; the bar still says the interview runs.
  }
}

/** The kind of interview whose first question waits to be sent, once: reading it clears it. */
export function takeInterviewKickoff(): InterviewKind | null {
  try {
    const kind = storage()?.getItem(KICKOFF_KEY);
    storage()?.removeItem(KICKOFF_KEY);
    return kind === 'trip' || kind === 'day' ? kind : null;
  } catch {
    return null;
  }
}
