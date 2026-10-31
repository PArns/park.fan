import { pickRandom } from '@/lib/utils/pick-random';

const GREETING_KEY = 'parkfan:assistant-greeting';

/** The openers a chat with Parky starts with, as keys of the `assistant` namespace. */
export const GREETING_KEYS = [
  'greeting1',
  'greeting2',
  'greeting3',
  'greeting4',
  'greeting5',
] as const;

/** One of {@link GREETING_KEYS}. */
export type GreetingKey = (typeof GREETING_KEYS)[number];

function isGreeting(value: string | null): value is GreetingKey {
  return (GREETING_KEYS as readonly (string | null)[]).includes(value);
}

/** Draws an opener for a new chat, never `except`, and keeps it for the session. */
export function drawGreeting(except?: GreetingKey): GreetingKey {
  const key = pickRandom(GREETING_KEYS, except);
  try {
    window.sessionStorage.setItem(GREETING_KEY, key);
  } catch {
    // Without storage a reload draws again, which only changes the first line.
  }
  return key;
}

/** This session's opener: the one already shown, so a reload keeps the chat as it was. */
export function sessionGreeting(): GreetingKey {
  try {
    const stored = window.sessionStorage.getItem(GREETING_KEY);
    if (isGreeting(stored)) return stored;
  } catch {
    // Storage blocked: a fresh draw below.
  }
  return drawGreeting();
}
