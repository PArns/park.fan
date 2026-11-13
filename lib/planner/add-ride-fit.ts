import { addWishKey, fitChoiceAll, togglePin, type FitChoice } from './fit';
import {
  fitQuestion,
  requestOptimize,
  type FitAnswer,
  type FitQuestion,
  type OptimizeTarget,
} from './optimize-remote';
import type { PlannerEntry } from './types';

/**
 * The question a press on „In den Plan" raises, or `null` where it raises none.
 *
 * The button files without a minute, so `addEntry` puts the ride an hour after the last entry, and
 * late in the day presses run past closing and stack on the 25:00 ceiling. So it asks the API's
 * optimizer what the optimise buttons ask: the day plus this ride, and whether every wish gets a
 * slot before closing. Where not, the answer is the question the assistant opens on, with the
 * answer for everything ticked, and nothing has been written.
 *
 * `null` (file as before) wherever the API refuses the question: no hours, no readable waits, a
 * walked day, or a ride `/plan/day` does not list. A second go on a planned ride is asked about
 * under its `a:<slug>` key. A failed request throws; the caller files as before. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
 */
export async function noRoomForRide(params: {
  target: OptimizeTarget;
  entries: readonly PlannerEntry[];
  attractionSlug: string;
  /** The visitor's early-entry answer for this day, as the day column folds it in. */
  earlyEntry?: boolean;
}): Promise<{ question: FitQuestion; answer: FitAnswer } | null> {
  const { target, entries, attractionSlug, earlyEntry } = params;
  const question = fitQuestion(target, entries, { earlyEntry }, [attractionSlug]);
  const answer = await requestOptimize(target, {
    mode: 'fit',
    entries,
    prefs: question.prefs,
    add: question.add,
    nowMinute: question.nowMinute,
  });
  if (answer.status !== 'fit' || !answer.fit) return null;
  return answer.fit.fitted.length < answer.fit.wanted ? { question, answer: answer.fit } : null;
}

/**
 * The answer the assistant opens on after „In den Plan": everything ticked and the pressed ride
 * pinned, so the proposed plan cannot leave out the ride just asked for. An ordinary pin the
 * visitor can take off.
 */
export function requestedRideChoice(attractionSlug: string): FitChoice {
  return togglePin(fitChoiceAll(), addWishKey(attractionSlug));
}
