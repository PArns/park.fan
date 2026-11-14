import {
  readPlanQuery,
  writePlanQuery,
  type PlanRegionKeys,
  type TripPlanState,
} from './plan-query';
import type { TripWizardQuestion } from './wizard-steps';

/**
 * Parky's ideas for a plan: the API's best single edits (`GET …/plan/ideas`, the same query as
 * `/plan`), which the planner shows over the plan, under the day they change and in the chat.
 * Pure, so `scripts/test-plan-ideas.mjs` checks it: which ideas the visitor gets to see, how one is
 * applied to the planner's state, and the figures its card prints. The contract is the API's
 * docs/frontend/trip-regions.md#ideas-get-v1trip-regionsorlandoplanideas.
 */

/** What an idea changes, the API's `kind`. */
export type PlanIdeaKind = 'move' | 'swap' | 'add' | 'travel_day' | 'hopper' | 'avoid_party';

/** Every {@link PlanIdeaKind}; an idea of a kind this client does not know is not shown. */
export const PLAN_IDEA_KINDS: readonly PlanIdeaKind[] = [
  'move',
  'swap',
  'add',
  'travel_day',
  'hopper',
  'avoid_party',
];

/** One idea: the change as a query part, and the plan it makes against the plan as it is. */
export interface PlanIdea {
  kind: PlanIdeaKind;
  /** `/plan` parameters, `&`-separated, each replacing the current value whole. */
  query: string;
  /** The park the idea is about. */
  park?: string;
  /** Its day now; absent where the plan has none for it. */
  from?: string;
  /** Its day with the idea. */
  to?: string;
  /** `swap`: the park that takes `from`'s place. */
  with?: string;
  /** The park's own figure on its day, before and after: the number its day card prints. */
  headlinerWait: { before?: number; after?: number };
  /** The trip's `totals.headlinerWait`, before and after. */
  totals: { before?: number; after?: number };
  /** Headliner minutes saved over the visits both plans place; negative where longer. */
  savedMinutes: number;
  /** The parks only the idea's plan places. */
  places?: string[];
}

/** `GET …/plan/ideas`. */
export interface PlanIdeasAnswer {
  meta: { region: string; from: string; to: string; computedAt: string; plans: number };
  ideas: PlanIdea[];
}

/** The API sends at most three; the planner never shows more. */
export const MAX_PLAN_IDEAS = 3;

/**
 * The questions whose answer an idea of a kind would overrule. The API cannot tell an answered
 * default from one nobody asked (a free arrival day is left out of the query either way), so the
 * planner, which knows what the visitor answered in the assistant, drops those ideas itself.
 */
const OVERRULES: Partial<Record<PlanIdeaKind, TripWizardQuestion>> = {
  travel_day: 'travel_days',
  hopper: 'hop',
};

/**
 * The ideas the visitor gets to see, best first: those of a known kind that overrule no answer
 * they gave, at most {@link MAX_PLAN_IDEAS}.
 */
export function shownIdeas(
  ideas: readonly PlanIdea[] | undefined,
  answered: ReadonlySet<TripWizardQuestion>
): PlanIdea[] {
  return (ideas ?? [])
    .filter((idea) => PLAN_IDEA_KINDS.includes(idea.kind))
    .filter((idea) => {
      const question = OVERRULES[idea.kind];
      return !question || !answered.has(question);
    })
    .slice(0, MAX_PLAN_IDEAS);
}

/** An idea's identity: what it sets. Two ideas that set the same make the same plan. */
export function ideaKey(idea: Pick<PlanIdea, 'kind' | 'query'>): string {
  return `${idea.kind}:${idea.query}`;
}

/** The query with a part applied: each parameter of `part` replaces its value whole. */
export function withQueryPart(query: string, part: string): string {
  const next = new URLSearchParams(query);
  for (const [key, value] of new URLSearchParams(part)) next.set(key, value);
  return next.toString();
}

/** The planner's state with an idea applied, read back through the planner's own query reader. */
export function applyIdea(
  state: TripPlanState,
  idea: Pick<PlanIdea, 'query'>,
  keys?: PlanRegionKeys
): TripPlanState {
  return readPlanQuery(new URLSearchParams(withQueryPart(writePlanQuery(state), idea.query)), keys);
}

/**
 * The day card an idea belongs under: the day it takes a park from, else the day it puts one on.
 * `null` for an idea without a day.
 */
export function ideaDay(idea: Pick<PlanIdea, 'from' | 'to'>): string | null {
  return idea.from ?? idea.to ?? null;
}

/** The idea that belongs under a day's card: the first that changes that day. */
export function ideaOnDay(ideas: readonly PlanIdea[], date: string): PlanIdea | null {
  return ideas.find((idea) => ideaDay(idea) === date) ?? null;
}

/** Which end of the trip a travel-day idea makes a park day: one of them, or both. */
export function ideaTravelEnd(query: string): 'arrival' | 'departure' | 'both' {
  const set = new URLSearchParams(query);
  if (set.has('arrival') && set.has('departure')) return 'both';
  return set.has('departure') ? 'departure' : 'arrival';
}

/** Which verb applies an idea: Dazunehmen for a park it adds, Tauschen for a day it moves. */
export function ideaVerb(kind: PlanIdeaKind): 'add' | 'swap' | 'plan' {
  if (kind === 'add') return 'add';
  if (kind === 'move' || kind === 'swap' || kind === 'avoid_party') return 'swap';
  return 'plan';
}

/**
 * What an idea's card says it does in minutes, in the park's own figure: „etwa 55 statt 60 Min.“
 * for a park that moves, „etwa 50 Min.“ for one it adds, `null` without a figure after.
 */
export function ideaFigure(
  idea: Pick<PlanIdea, 'headlinerWait'>
): { after: number; before: number | null } | null {
  const { before, after } = idea.headlinerWait;
  if (after == null) return null;
  return { after: Math.round(after), before: before == null ? null : Math.round(before) };
}
