import { pickRandom, pickSome } from '@/lib/utils/pick-random';

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
  ],
  park: [
    'suggestWaitsHere',
    'suggestBestDayHere',
    'suggestDownHere',
    'suggestPlanHere',
    'suggestWeatherHere',
    'suggestCoasterHere',
    'suggestHoursHere',
  ],
} as const;

/** How many suggestions a new chat offers. */
export const SUGGESTIONS_SHOWN = 3;

/** How a chat opens: one greeting and the suggestions for either kind of page. */
export interface AssistantOpener {
  greeting: (typeof GREETING_KEYS)[number];
  site: (typeof SUGGESTION_KEYS.site)[number][];
  park: (typeof SUGGESTION_KEYS.park)[number][];
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
    valid(opener.park, SUGGESTION_KEYS.park)
  );
}

/** Draws the opener of a new chat, never the greeting of `previous`, and keeps it for the session. */
export function drawOpener(previous?: AssistantOpener): AssistantOpener {
  const opener: AssistantOpener = {
    greeting: pickRandom(GREETING_KEYS, previous?.greeting),
    site: pickSome(SUGGESTION_KEYS.site, SUGGESTIONS_SHOWN),
    park: pickSome(SUGGESTION_KEYS.park, SUGGESTIONS_SHOWN),
  };
  try {
    window.sessionStorage.setItem(OPENER_KEY, JSON.stringify(opener));
  } catch {
    // Without storage a reload draws again, which only changes how the chat opens.
  }
  return opener;
}

/** This session's opener: the one already shown, so a reload keeps the chat as it was. */
export function sessionOpener(): AssistantOpener {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(OPENER_KEY) ?? 'null');
    if (isOpener(stored)) return stored;
  } catch {
    // Storage blocked or unreadable: a fresh draw below.
  }
  return drawOpener();
}
