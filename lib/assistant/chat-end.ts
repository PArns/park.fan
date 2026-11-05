/**
 * Parky's break: after a run of abuse the API ends the chat (`chat_end`) and refuses questions for
 * a while. The end is kept for the tab, so a reload does not reopen the input early.
 */

/** The code the API refuses a question with while the break lasts. */
export const CHAT_ENDED_CODE = 'chat_ended';

/** The break taken when a refusal says nothing of its length (another tab's chat ended it). */
export const DEFAULT_BREAK_MINUTES = 15;

/** The longest break the widget believes, a day; anything longer is a broken value. */
export const MAX_BREAK_MINUTES = 24 * 60;

const STORE_KEY = 'parkfan:assistant-break';

/**
 * How long a refusal says the break lasts: its `cooldownMinutes`, else the `Retry-After`
 * seconds, else the default. Rounded up to whole minutes and capped at a day.
 */
export function breakMinutesFrom(body: unknown, retryAfter?: string | null): number {
  const minutes = (body as { cooldownMinutes?: unknown } | null)?.cooldownMinutes;
  const seconds = Number(retryAfter);
  const raw =
    typeof minutes === 'number' && minutes > 0
      ? minutes
      : retryAfter && Number.isFinite(seconds) && seconds > 0
        ? seconds / 60
        : DEFAULT_BREAK_MINUTES;
  return Math.min(MAX_BREAK_MINUTES, Math.ceil(raw));
}

/** Whether an API error code is the break's refusal. */
export const isChatEnded = (code: unknown) => code === CHAT_ENDED_CODE;

/** The break's end as a timestamp, or null when there is none or it is over. */
export function readBreakUntil(
  storage: Storage | undefined,
  now: number = Date.now()
): number | null {
  try {
    const until = Number(storage?.getItem(STORE_KEY));
    if (Number.isFinite(until) && until > now) return until;
    storage?.removeItem(STORE_KEY);
  } catch {
    // Storage refused: no break remembered, and the API still refuses while it lasts.
  }
  return null;
}

/** Start a break of `minutes` from now; returns its end. */
export function startBreak(
  storage: Storage | undefined,
  minutes: number,
  now: number = Date.now()
): number {
  const until = now + Math.min(MAX_BREAK_MINUTES, minutes) * 60_000;
  try {
    storage?.setItem(STORE_KEY, String(until));
  } catch {
    // Kept in memory for this page only.
  }
  return until;
}

/** The tab's session storage, where it can be reached. */
export function breakStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}
