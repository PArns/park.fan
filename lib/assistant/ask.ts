import type { AssistantOpenSource } from '@/lib/analytics/site-analytics';
import { openParky } from './open';

const ASK_KEY = 'parkfan:assistant-ask';

/** Where a question handed to Parky from the page came from, as `assistant_opened` counts it. */
export type ParkyAskSource = Extract<AssistantOpenSource, 'stamp' | 'tip' | 'empty'>;

/**
 * A Parky element on the page (a stamp, a tip, an empty state) asks him about what it shows: the
 * question waits for the chat window, which sends it once its session is ready (`takeParkyAsk`),
 * and the window opens. The page's path goes with every question anyway, so the question only
 * names what the element shows, in the visitor's language.
 */
export function askParky(question: string, source: ParkyAskSource): void {
  try {
    window.sessionStorage.setItem(ASK_KEY, question);
  } catch {
    // The window then opens without the question; the visitor can still ask.
  }
  openParky(source);
}

/**
 * Stands in a question for the page's path, filled in when the visitor asks (`ParkyAskButton`): a
 * server render that cannot know the path, the 404's, passes it as the path's value. Server-safe
 * here, where a `'use client'` module would hand a server component a reference, not the string.
 */
export const ASK_PATH = '\u2060path\u2060';

/** The question an element handed over, once: reading it clears it. */
export function takeParkyAsk(): string | null {
  try {
    const question = window.sessionStorage.getItem(ASK_KEY);
    window.sessionStorage.removeItem(ASK_KEY);
    return question?.trim() ? question : null;
  } catch {
    return null;
  }
}
