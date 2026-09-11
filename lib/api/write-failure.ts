/**
 * What a non-2xx answer from one of this app's own `/api` routes means, read
 * once so every writer agrees.
 *
 * Two write paths land here — the push follows (`lib/push/push-follows.ts`) and
 * the planner's stored trip (`lib/planner/trip-sync.ts`) — and they used to read
 * a response two different ways: one classified every status, the other read
 * `response.ok` and nothing else. The second is how a 500 on a trip update came
 * to mean "this trip is gone, start another one".
 *
 * Collapsing these to one boolean is what this replaces: a rate-limited caller
 * got the same "that didn't work, try again" as one whose payload was malformed,
 * and "try again" against a limiter that has already refused the retry is a lie.
 * Only `rate-limited` carries a figure a caller can act on; the rest are for a
 * caller that wants to word things differently, not to retry sooner.
 */

export type HttpWriteError =
  /** 429 — the API's own limiter, with the window it named. */
  | { reason: 'rate-limited'; retryAfterSeconds: number }
  /** 400 — a malformed request, or a rule the API enforces at write time (e.g. an unreadable park). */
  | { reason: 'invalid' }
  /** 404 — the subscription, trip or entity named no longer exists. */
  | { reason: 'not-found' }
  /** A thrown fetch, or any other non-2xx (5xx included) — the "try again later" bucket. */
  | { reason: 'network' };

/** A "try later" default: not a claim about the real window, just a usable one. */
const RATE_LIMIT_FALLBACK_SECONDS = 60;
/**
 * Longer than this is not a number to put in front of somebody — an hour is
 * already past what any of these surfaces stays open for, and the value comes
 * off the network, so it is not ours to trust unbounded.
 */
const RATE_LIMIT_MAX_SECONDS = 3600;

/**
 * The limiter's own window, normalized ONCE so every reader agrees.
 *
 * Callers both print this number ("bitte in {seconds} Sekunden") and time
 * things by it, and the two must not diverge — a value clamped for the timer
 * and rendered raw would show a countdown that clears an hour early. Anything
 * under a second is not a wait a sentence can describe either, so it takes the
 * same road as a body that could not be read at all.
 */
export function normalizeRetryAfter(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
    return RATE_LIMIT_FALLBACK_SECONDS;
  }
  return Math.min(Math.round(raw), RATE_LIMIT_MAX_SECONDS);
}

/**
 * Turn a non-2xx response into an `HttpWriteError`. 404 and the general 4xx
 * bucket carry no body worth reading; 429 does — both limiters answer it with
 * `{ statusCode, message, retryAfterSeconds }` (`PushFollowAccessGuard` and
 * `TripsController.guard`).
 */
export async function classifyWriteFailure(response: Response): Promise<HttpWriteError> {
  if (response.status === 429) {
    const retryAfterSeconds = await response
      .json()
      .then((body: unknown) =>
        typeof body === 'object' && body !== null && 'retryAfterSeconds' in body
          ? (body as { retryAfterSeconds: unknown }).retryAfterSeconds
          : undefined
      )
      .catch(() => undefined);
    // A body the limiter didn't shape as expected is still a rate limit.
    return { reason: 'rate-limited', retryAfterSeconds: normalizeRetryAfter(retryAfterSeconds) };
  }
  if (response.status === 404) return { reason: 'not-found' };
  if (response.status >= 400 && response.status < 500) return { reason: 'invalid' };
  return { reason: 'network' };
}
