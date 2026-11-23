import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import type { ParkyElement } from '@/lib/analytics/parky-elements';
import { openParky } from './open';

const ASK_KEY = 'parkfan:assistant-ask';
const ASK_DAY_TIP_KEY = 'parkfan:assistant-ask-day-tip';

/**
 * The day tip a question was asked from: the park's geographic path (`continent/country/city/slug`),
 * the day and the sentence the visitor saw. The API reads the day's facts itself.
 */
export interface AskDayTip {
  park: string;
  date: string;
  text: string;
}

/** A question an element handed over, with the day tip it came from. */
export interface ParkyAsk {
  question: string;
  dayTip?: AskDayTip;
}

/**
 * A Parky element on the page (a stamp, a tip, a post's callout, an empty state) asks him about
 * what it shows: the question waits for the chat window, which sends it once its session is ready
 * (`takeParkyAsk`), and the window opens with the element as its source. The press is counted as
 * `parky_element_clicked` with the element's kind. The page's path goes with every question
 * anyway, so the question only names what the element shows, in the visitor's language. A day
 * tip also hands over its day and sentence, so Parky answers from the tip he wrote.
 */
export function askParky(question: string, element: ParkyElement, dayTip?: AskDayTip): void {
  trackSiteEvent('parky_element_clicked', element);
  try {
    window.sessionStorage.setItem(ASK_KEY, question);
    if (dayTip) window.sessionStorage.setItem(ASK_DAY_TIP_KEY, JSON.stringify(dayTip));
    else window.sessionStorage.removeItem(ASK_DAY_TIP_KEY);
  } catch {
    // The window then opens without the question; the visitor can still ask.
  }
  openParky(element.element);
}

/**
 * Stands in a question for the page's path, filled in when the visitor asks (`ParkyAskButton`): a
 * server render that cannot know the path, the 404's, passes it as the path's value. Server-safe
 * here, where a `'use client'` module would hand a server component a reference, not the string.
 */
export const ASK_PATH = '\u2060path\u2060';

/** The question an element handed over, with its day tip, once: reading it clears both. */
export function takeParkyAsk(): ParkyAsk | null {
  try {
    const question = window.sessionStorage.getItem(ASK_KEY);
    const dayTip = window.sessionStorage.getItem(ASK_DAY_TIP_KEY);
    window.sessionStorage.removeItem(ASK_KEY);
    window.sessionStorage.removeItem(ASK_DAY_TIP_KEY);
    if (!question?.trim()) return null;
    const parsed = dayTip ? readDayTip(dayTip) : null;
    return parsed ? { question, dayTip: parsed } : { question };
  } catch {
    return null;
  }
}

function readDayTip(raw: string): AskDayTip | null {
  try {
    const value = JSON.parse(raw) as Partial<AskDayTip> | null;
    return value &&
      typeof value.park === 'string' &&
      typeof value.date === 'string' &&
      typeof value.text === 'string'
      ? { park: value.park, date: value.date, text: value.text }
      : null;
  } catch {
    return null;
  }
}
