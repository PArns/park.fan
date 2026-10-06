/**
 * What a non-2xx answer from one of this app's own `/api` routes means, read once so every writer
 * (push follows, the planner's stored trip) agrees. A single boolean made a 500 read as „this trip
 * is gone" and told a rate-limited caller to try again at once. Only `rate-limited` carries a
 * figure a caller can act on.
 */
/** Why a write to one of this app's `/api` routes failed. */
export type HttpWriteError =
  /** 429 — the API's own limiter, with the window it named. */
  | { reason: 'rate-limited'; retryAfterSeconds: number }
  /** 400 — a malformed request, or a rule the API enforces at write time (e.g. an unreadable park). */
  | { reason: 'invalid' }
  /** 404 — the subscription, trip or entity named no longer exists. */
  | { reason: 'not-found' }
  /** A thrown fetch, or any other non-2xx (5xx included): the „try again later" bucket. */
  | { reason: 'network' };

/** A usable „try later" default, not a claim about the real window. */
const RATE_LIMIT_FALLBACK_SECONDS = 60;
/**
 * Upper bound: an hour is already past what these surfaces stay open for, and the value comes
 * off the network.
 */
const RATE_LIMIT_MAX_SECONDS = 3600;

/**
 * The limiter's window, normalized once, because callers both print it and time things by it and
 * the two must not diverge. Under a second, or unreadable, takes the fallback.
 */
export function normalizeRetryAfter(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
    return RATE_LIMIT_FALLBACK_SECONDS;
  }
  return Math.min(Math.round(raw), RATE_LIMIT_MAX_SECONDS);
}

/**
 * Turn a non-2xx response into an `HttpWriteError`. Only a 429 has a body worth reading:
 * `{ statusCode, message, retryAfterSeconds }` from `PushFollowAccessGuard` and
 * `TripsController.guard`.
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
    // A body the limiter did not shape as expected is still a rate limit.
    return { reason: 'rate-limited', retryAfterSeconds: normalizeRetryAfter(retryAfterSeconds) };
  }
  if (response.status === 404) return { reason: 'not-found' };
  if (response.status >= 400 && response.status < 500) return { reason: 'invalid' };
  return { reason: 'network' };
}
