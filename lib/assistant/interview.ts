import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { openParky } from '@/lib/assistant/open';
import { isUuid } from '@/lib/utils';
import { isIsoDate } from '@/lib/utils/iso-date';
import { isStrictSlug } from '@/lib/utils/servable-route';

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

/**
 * The interview's region as the statistic counts it: a trip's live region, `none` for a park day
 * or a trip whose region is not settled yet. Live slugs only, a closed set: the API takes no other.
 */
export function interviewRegion(interview: Pick<AssistantInterview, 'kind' | 'region'>): string {
  return interview.kind === 'trip' && interview.region ? interview.region : 'none';
}

/** Whether the interview's plan stands: every core step answered or passed. */
export function interviewPlanStood(
  interview: Pick<AssistantInterview, 'kind' | 'answered' | 'skipped'>
): boolean {
  const settled = new Set([...interview.answered, ...interview.skipped]);
  return interviewCore(interview.kind).every((step) => settled.has(step));
}

/** What `assistant_interview_ended` carries for an interview that ends now. */
export function interviewEnded(interview: AssistantInterview, outcome: 'done' | 'left') {
  return {
    kind: interview.kind,
    outcome,
    steps: interview.answered.length,
    plan: interviewPlanStood(interview),
    region: interviewRegion(interview),
  };
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
    .filter((m): m is { park: string; rides: unknown } => isStrictSlug(String(m?.park ?? '')))
    .map((m) => ({
      park: m.park,
      rides: (Array.isArray(m.rides) ? m.rides : [])
        .filter((id): id is string => typeof id === 'string' && isUuid(id))
        .slice(0, 12),
    }))
    .slice(0, 8);
  return {
    kind: raw.kind,
    ...(typeof raw.region === 'string' && isStrictSlug(raw.region) && { region: raw.region }),
    ...(typeof raw.park === 'string' && isStrictSlug(raw.park) && { park: raw.park }),
    ...(typeof raw.date === 'string' && isIsoDate(raw.date) && { date: raw.date }),
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
  /** The park by name, for the first question the window words itself. */
  parkName?: string;
  date?: string;
}

/** The start that waits for the chat window: its kind, and the park's name where the planner had it. */
export interface InterviewKickoffStart {
  kind: InterviewKind;
  parkName?: string;
}

/**
 * The planner's button: the interview set on its first step, and its start waiting for the chat
 * window, which asks the first question once its session is ready (`takeInterviewKickoff`). It
 * counts the start itself, since the store write below is no action and `trackInterview` never
 * sees it.
 */
export function startInterview(start: InterviewStart): void {
  const first = interviewCore(start.kind)[0];
  trackSiteEvent('assistant_interview_started', {
    kind: start.kind,
    source: 'planner',
    region: interviewRegion(start),
  });
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
    const waiting: InterviewKickoffStart = {
      kind: start.kind,
      ...(start.parkName && { parkName: start.parkName }),
    };
    storage()?.setItem(KICKOFF_KEY, JSON.stringify(waiting));
  } catch {
    // The window then opens without the first question; the bar still says the interview runs.
  }
}

/**
 * A button's way into the interview: the interview set on its first step ({@link startInterview})
 * and the chat window opened for it, which asks the first question once its session is ready.
 */
export function openInterview(start: InterviewStart): void {
  startInterview(start);
  openParky('interview');
}

/** The interview start that waits for the chat window, once: reading it clears it. */
export function takeInterviewKickoff(): InterviewKickoffStart | null {
  try {
    const raw = storage()?.getItem(KICKOFF_KEY);
    storage()?.removeItem(KICKOFF_KEY);
    const value = raw ? (JSON.parse(raw) as Partial<InterviewKickoffStart> | null) : null;
    if (value?.kind !== 'trip' && value?.kind !== 'day') return null;
    const parkName = typeof value.parkName === 'string' ? value.parkName.trim().slice(0, 120) : '';
    return { kind: value.kind, ...(parkName && { parkName }) };
  } catch {
    return null;
  }
}
