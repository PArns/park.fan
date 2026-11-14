import type { PlanIdea } from '@/lib/trip-regions/plan-ideas';
import { openParky } from './open';

/**
 * One of Parky's ideas for a trip plan, as the chat shows it under his answer: the idea itself,
 * which the planner applies (`tripPlannerBridge.applyIdea`), and its words. The words are the
 * planner's, made where the idea was pressed: the chat window is on every page and carries none of
 * the planner's messages.
 */
export interface AssistantTripIdea {
  region: string;
  idea: PlanIdea;
  /** The idea in one line, „Fuji-Q Highland am freien Mo., 25. Jan.“. */
  title: string;
  /** What it does in minutes, „etwa 50 Min.“; empty without a figure. */
  figure: string;
  /** The button that applies it. */
  apply: string;
  /** The line once it is applied, „Im Plan: …“. */
  applied: string;
  undo: string;
}

const ASK_KEY = 'parkfan:assistant-trip-idea';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * „Im Chat“ on an idea: the question about it waits for the chat window, which sends it once its
 * session is ready (`takeTripIdeaAsk`) with the idea's card under the answer, and the window opens.
 */
export function askParkyAboutIdea(question: string, card: AssistantTripIdea): void {
  try {
    storage()?.setItem(ASK_KEY, JSON.stringify({ question, card }));
  } catch {
    // The window then opens without the question; the visitor can still ask.
  }
  openParky('idea');
}

/** The question about an idea that waits for the window, once: reading it clears it. */
export function takeTripIdeaAsk(): { question: string; card: AssistantTripIdea } | null {
  try {
    const raw = storage()?.getItem(ASK_KEY);
    storage()?.removeItem(ASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { question?: unknown; card?: AssistantTripIdea };
    if (typeof parsed.question !== 'string' || !parsed.card?.idea?.query) return null;
    return { question: parsed.question, card: parsed.card };
  } catch {
    return null;
  }
}
