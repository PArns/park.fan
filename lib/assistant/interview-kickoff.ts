import { addDays } from '@/lib/utils/park-day';
import type { AssistantInterview, InterviewStep } from './interview';
import { PARK_FAVOURITES } from './parky/easter-eggs';

/**
 * The first question of an interview a planner's button started, asked by the widget itself. Most
 * visitors who press the button never answer it, so no model is asked until they do: the question
 * and its replies are fixed by what the planner already knows, and the visitor's first answer
 * carries the question to the API as the chat's `opener`.
 */

/** Parky's first line, as a key of `assistant.interview.kickoff`. */
export type KickoffAsk = 'askPark' | 'askDay' | 'askMustDo' | 'askDates' | 'askDatesHeld';

/** A reply's wording, as a key of `assistant.interview.kickoff`. */
export type KickoffReplyKey =
  | 'replyToday'
  | 'replyTomorrow'
  | 'replyCoasters'
  | 'replyQuiet'
  | 'replyUnsure'
  | 'replyDatesKeep'
  | 'replyDatesFind'
  | 'replyDatesSummer';

/** One reply under the first line: a fixed wording, a park by its name, or a day by its weekday. */
export type KickoffReply = { key: KickoffReplyKey } | { park: string } | { weekdayOf: string };

/** What the kickoff reads beside the interview, all of it from this browser. */
export interface KickoffContext {
  /** The interview's park by name, where the planner handed it over. */
  parkName?: string;
  /** The dates of the trip on screen, where it has them. */
  tripDates?: { from: string; to: string };
  /** The parks the visitor has planned days in, by name, nearest first. */
  plannedParks: readonly string[];
  /** The browser's today, `YYYY-MM-DD`. */
  today: string;
}

/** An interview's first exchange without a model: the state it starts in, the line, the replies. */
export interface InterviewKickoff {
  interview: AssistantInterview;
  ask: KickoffAsk;
  replies: KickoffReply[];
}

/** How many parks the park question offers. */
const PARKS_OFFERED = 3;

/** The state with `step` settled, since the planner holds its answer, and `next` being asked. */
function past(
  interview: AssistantInterview,
  step: InterviewStep,
  next: InterviewStep
): AssistantInterview {
  return { ...interview, step: next, answered: [...new Set([...interview.answered, step])] };
}

/** The first Saturday or Sunday that neither „today" nor „tomorrow" already names. */
function weekendDay(today: string): string {
  for (let ahead = 2; ahead < 9; ahead++) {
    const day = addDays(today, ahead);
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    if (weekday === 6 || weekday === 0) return day;
  }
  return addDays(today, 2);
}

/**
 * The first question of an interview at its first step, and the state it leaves the interview in:
 * a step the planner already answers (the region of the hub the button stands on, the park and day
 * of the planner's column) counts as answered and the next one is asked. Null where the widget
 * cannot word the question, so the model asks it: a trip without a region, a park without its name.
 */
export function interviewKickoff(
  interview: AssistantInterview,
  context: KickoffContext
): InterviewKickoff | null {
  if (interview.kind === 'trip') {
    if (!interview.region) return null;
    const settled = past(interview, 'region', 'dates');
    return context.tripDates
      ? {
          interview: settled,
          ask: 'askDatesHeld',
          replies: [{ key: 'replyDatesKeep' }, { key: 'replyDatesFind' }],
        }
      : {
          interview: settled,
          ask: 'askDates',
          replies: [{ key: 'replyDatesFind' }, { key: 'replyDatesSummer' }],
        };
  }
  if (!interview.park) {
    const parks = [
      ...new Set([
        ...context.plannedParks,
        ...Object.values(PARK_FAVOURITES).map((favourite) => favourite.park),
      ]),
    ].slice(0, PARKS_OFFERED);
    return { interview, ask: 'askPark', replies: parks.map((park) => ({ park })) };
  }
  if (!context.parkName) return null;
  if (interview.date) {
    return {
      interview: past(interview, 'day', 'mustdo'),
      ask: 'askMustDo',
      replies: [{ key: 'replyCoasters' }, { key: 'replyQuiet' }, { key: 'replyUnsure' }],
    };
  }
  return {
    interview,
    ask: 'askDay',
    replies: [
      { key: 'replyToday' },
      { key: 'replyTomorrow' },
      { weekdayOf: weekendDay(context.today) },
    ],
  };
}
