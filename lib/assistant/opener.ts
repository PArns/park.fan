import { pickRandom, pickSome } from '@/lib/utils/pick-random';
import {
  opensChat,
  YOURS_CHIPS,
  YOURS_GREETINGS,
  type YoursGreetingKind,
  type YoursMoment,
} from './parky/yours';

const OPENER_KEY = 'parkfan:assistant-opener';

/** The greetings a chat with Parky starts with, as keys of the `assistant` namespace. */
export const GREETING_KEYS = [
  'greeting1',
  'greeting2',
  'greeting3',
  'greeting4',
  'greeting5',
] as const;

/**
 * The questions offered under the greeting, as keys of the `assistant` namespace: `site` anywhere,
 * `park` on a park's page, where "here" is that park. Each is one Parky can look up.
 */
export const SUGGESTION_KEYS = {
  site: [
    'suggestWaits',
    'suggestBestDay',
    'suggestNews',
    'suggestNearby',
    'suggestGlossary',
    'suggestWeather',
    'suggestPlan',
    'suggestRide',
    'suggestInterview',
  ],
  park: [
    'suggestWaitsHere',
    'suggestBestDayHere',
    'suggestDownHere',
    'suggestPlanHere',
    'suggestWeatherHere',
    'suggestCoasterHere',
    'suggestHoursHere',
    'suggestInterviewHere',
  ],
} as const;

/** How many suggestions a new chat offers. */
export const SUGGESTIONS_SHOWN = 3;

/** A moment of the visitor's own plans a chat can open with (`yours.ts`). */
export type OpenerMoment = Extract<YoursMoment, { kind: YoursGreetingKind }>;

/**
 * How a chat opens: one greeting and the suggestions for either kind of page, and where the
 * visitor has plans in this browser, the moment the greeting picks up instead (`yours`).
 */
export interface AssistantOpener {
  greeting: (typeof GREETING_KEYS)[number];
  site: (typeof SUGGESTION_KEYS.site)[number][];
  park: (typeof SUGGESTION_KEYS.park)[number][];
  yours?: OpenerMoment;
}

const isText = (value: unknown) => typeof value === 'string' && value.length > 0;
const isCount = (value: unknown) => Number.isInteger(value) && (value as number) > 0;

/** A stored moment, checked field by field: one that does not hold is left out. */
function isOpenerMoment(value: unknown): value is OpenerMoment {
  const moment = value as Record<string, unknown> | null;
  if (!moment || typeof moment !== 'object') return false;
  switch (moment.kind) {
    case 'today':
    case 'yesterday':
    case 'tomorrow':
      return isText(moment.park) && isText(moment.date);
    case 'soon':
      return isText(moment.park) && isText(moment.date) && isCount(moment.days);
    case 'trip':
      return isCount(moment.count) && isText(moment.date);
    case 'back':
      return isText(moment.park);
    default:
      return false;
  }
}

function isOpener(value: unknown): value is AssistantOpener {
  const opener = value as AssistantOpener | null;
  const valid = (list: unknown, keys: readonly string[]) =>
    Array.isArray(list) &&
    list.length === SUGGESTIONS_SHOWN &&
    list.every((key) => keys.includes(key as string));
  return (
    !!opener &&
    (GREETING_KEYS as readonly string[]).includes(opener.greeting) &&
    valid(opener.site, SUGGESTION_KEYS.site) &&
    valid(opener.park, SUGGESTION_KEYS.park) &&
    (opener.yours === undefined || isOpenerMoment(opener.yours))
  );
}

/**
 * Draws the opener of a new chat, never the greeting of `previous`, and keeps it for the session.
 * The first of `moments` that can open a chat replaces the greeting; the rest stay as drawn.
 */
export function drawOpener(
  previous?: AssistantOpener,
  moments: readonly YoursMoment[] = []
): AssistantOpener {
  const yours = moments.find(opensChat);
  const opener: AssistantOpener = {
    greeting: pickRandom(GREETING_KEYS, previous?.greeting),
    site: pickSome(SUGGESTION_KEYS.site, SUGGESTIONS_SHOWN),
    park: pickSome(SUGGESTION_KEYS.park, SUGGESTIONS_SHOWN),
    ...(yours && { yours }),
  };
  try {
    window.sessionStorage.setItem(OPENER_KEY, JSON.stringify(opener));
  } catch {
    // Without storage a reload draws again, which only changes how the chat opens.
  }
  return opener;
}

/**
 * This session's opener: the one already shown, so a reload keeps the chat as it was; `moments`
 * is asked only when a new one is drawn.
 */
export function sessionOpener(moments: () => readonly YoursMoment[] = () => []): AssistantOpener {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(OPENER_KEY) ?? 'null');
    if (isOpener(stored)) return stored;
  } catch {
    // Storage blocked or unreadable: a fresh draw below.
  }
  return drawOpener(undefined, moments());
}

/** The greeting's key: the moment's where the chat opens with one, else the drawn one. */
export function greetingKeyOf(opener: AssistantOpener): string {
  return opener.yours ? YOURS_GREETINGS[opener.yours.kind] : opener.greeting;
}

/**
 * The suggestions under the greeting, as keys of the `assistant` namespace: a personal greeting's
 * own questions first, then the drawn ones for the page, {@link SUGGESTIONS_SHOWN} in all.
 */
export function suggestionKeysOf(opener: AssistantOpener, parkPage: boolean): string[] {
  const drawn: readonly string[] = parkPage ? opener.park : opener.site;
  const own: readonly string[] = opener.yours ? YOURS_CHIPS[opener.yours.kind] : [];
  return [...own, ...drawn].slice(0, SUGGESTIONS_SHOWN);
}
