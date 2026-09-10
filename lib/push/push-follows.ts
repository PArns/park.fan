'use client';

import {
  ensurePushRegistered,
  getExistingPushIdentity,
  lookupExistingPushIdentity,
  type PushRegistration,
  type PushUnavailableCause,
} from './push-registration';
import {
  removeRideAlertLocal,
  setRideAlertLocal,
  setShowFollowedLocal,
} from './push-follows-store';

/**
 * Following a show, and watching a ride's wait time — the two actions a bell
 * triggers. Each: reuse an existing subscription if this browser has one,
 * register a new one only if it does not (so a second bell on the same page
 * never re-prompts for permission), call the API, then update the local
 * mirror only once the server has confirmed it.
 */

export interface RideAlertRemote {
  attractionId: string;
  attractionName: string;
  attractionSlug: string;
  parkId: string;
  parkName: string;
  parkSlug: string;
  path: string | null;
  thresholdMinutes: number;
  armed: boolean;
  createdAt: string;
  /** Accepted at write time regardless — see the API's own `create` comment. */
  outOfSeason: boolean;
  /** Retired after this alert was created; the FK cascade only fires on delete, not retirement. */
  retired: boolean;
}

export interface ShowFollowRemote {
  showId: string;
  showName: string;
  showSlug: string;
  parkId: string;
  parkName: string;
  parkSlug: string;
  path: string | null;
  /** The chosen performance, or null for "whichever is next". Full ISO instant. */
  startTime: string | null;
  /** The park's zone, so the clock time reads as the park posts it. */
  timezone: string | null;
  createdAt: string;
}

/**
 * Why a write didn't go through — collapsing all of these to one boolean
 * used to mean a rate-limited caller got the exact same "that didn't work,
 * try again" message as one whose threshold was malformed, and "try again"
 * against a limiter that has already refused the retry is a lie. Only
 * `rate-limited` carries data a caller can act on differently (the API's own
 * `retryAfterSeconds`); the rest are for a caller that wants to log or word
 * things slightly differently, not to retry sooner.
 */
export type PushWriteError =
  /**
   * No push identity at all. `cause` is what separates "blocked in your
   * browser" (a setting only the visitor can change) from "this browser
   * cannot" from "our end is down" — three different sentences, and the
   * reason a single "please try again" was wrong in front of all of them.
   */
  | { reason: 'unavailable'; cause: PushUnavailableCause }
  | { reason: 'rate-limited'; retryAfterSeconds: number }
  /** 400 — a malformed request, or a rule the API enforces at write time (e.g. an unreadable park). */
  | { reason: 'invalid' }
  /** 404 — the subscription or the entity named no longer exists. */
  | { reason: 'not-found' }
  /** A thrown fetch, or any other non-2xx (5xx included) — the same "try again later" bucket as before. */
  | { reason: 'network' };

export type PushWriteResult<T> = { ok: true; value: T } | { ok: false; error: PushWriteError };

/** A fetch that failed must not look like a list that is genuinely empty — see the two fetchers below. */
export type PushListResult<T> = { ok: true; items: T[] } | { ok: false };

async function identityForWrite(): Promise<PushRegistration> {
  const existing = await getExistingPushIdentity();
  if (existing) return { ok: true, identity: existing };
  return ensurePushRegistered();
}

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
function normalizeRetryAfter(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
    return RATE_LIMIT_FALLBACK_SECONDS;
  }
  return Math.min(Math.round(raw), RATE_LIMIT_MAX_SECONDS);
}

/**
 * Turn a non-2xx response into a `PushWriteError`. 404 and the general 4xx
 * bucket carry no body worth reading; 429 does — `PushFollowAccessGuard`
 * answers it with `{ statusCode, message, retryAfterSeconds }`.
 */
async function classifyFailure(response: Response): Promise<PushWriteError> {
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

async function postFollowShow(
  identity: { endpoint: string },
  showId: string,
  startTime?: string | null
): Promise<PushWriteResult<void>> {
  try {
    const response = await fetch('/api/push/show-follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Omitted rather than sent as null when there is no chosen
      // performance: the API reads an absent `startTime` as the open-ended
      // follow, and its DTO validates the field only when it is there.
      body: JSON.stringify({
        endpoint: identity.endpoint,
        showId,
        ...(startTime ? { startTime } : {}),
      }),
    });
    if (!response.ok) return { ok: false, error: await classifyFailure(response) };
    // The mirror records WHICH performance was armed, because the API keeps
    // one row per (subscription, show) and its upsert overwrites `startTime`:
    // a browser that follows the 19:10 performance does not follow the 17:30
    // one, and a bell beside 17:30 must not claim it does.
    setShowFollowedLocal(showId, true, startTime ?? null);
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * `startTime` is the performance the visitor picked, as a full ISO instant —
 * omitted for the open-ended follow a show card's bell files, which is "tell
 * me before whichever performance is next".
 */
export async function followShow(
  showId: string,
  startTime?: string | null
): Promise<PushWriteResult<void>> {
  const registration = await identityForWrite();
  if (!registration.ok) {
    return { ok: false, error: { reason: 'unavailable', cause: registration.cause } };
  }
  const result = await postFollowShow(registration.identity, showId, startTime);
  if (result.ok || result.error.reason !== 'not-found') return result;
  // The browser already had a live PushManager subscription, so
  // `identityForWrite` never called `ensurePushRegistered` and never gave the
  // API a chance to re-upsert its row — a 404 here most likely means the
  // backend's own copy of it is gone (pruned, or never finished writing),
  // not that this particular show doesn't exist. Re-sync once and retry
  // before surfacing an error that looks permanent but usually isn't.
  const resynced = await ensurePushRegistered();
  if (!resynced.ok) return result;
  return postFollowShow(resynced.identity, showId, startTime);
}

/**
 * The DELETE both removals send, and the one place that decides what counts as
 * gone.
 *
 * **404 is a success.** The row this call names is one the visitor asked to be
 * rid of, and a server that no longer has it has given them exactly that —
 * pruning after repeated delivery failures, or a second tab that got there
 * first. Reporting "das hat nicht geklappt" over a row that is provably not
 * there would leave it on screen for ever, since every retry answers 404 too.
 * The write path reads the same status the other way round (`setRideAlert`
 * re-syncs and retries, because there a 404 means this browser's subscription
 * is missing and the write really did not happen) — the asymmetry is the point,
 * not an oversight.
 *
 * Checked against the API rather than assumed, because "the row is gone" and
 * "the ride you named is gone" would be very different answers: neither DELETE
 * handler validates the entity id at all, both are documented idempotent and
 * answer 204 for a row that was not there
 * (`ride-alerts.controller.ts`/`show-follows.controller.ts`), so the ONE 404
 * this path can produce is `subscriptionOrThrow` — this browser has no stored
 * subscription — and a subscription that does not exist cannot be holding an
 * alert. That matters for a retired ride, whose alert `AlertsOverview`
 * deliberately still lists.
 *
 * Everything else goes through `classifyFailure` like a write, so a caller has
 * the same classes to render either way.
 */
async function deletePushFollow(url: string, body: unknown): Promise<PushWriteResult<void>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok && response.status !== 404) {
      return { ok: false, error: await classifyFailure(response) };
    }
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * Stop reminding for a show — server first, mirror second.
 *
 * It used to be the other way round, optimistically like `FavoriteStar`'s
 * toggle, and returned `Promise<void>` without ever reading `response.ok`. A
 * 500 then took the row off the screen and left the reminder armed: it came
 * back at the next open with nothing having said so, and the favorites band's
 * whole alerts group — gated on the mirror — vanished in the same commit as the
 * click, taking its own spinner and any error it might have shown with it. A
 * star nobody else can see is a fair thing to move optimistically; a
 * notification that will arrive on a phone is not.
 *
 * A browser with no push identity at all has nothing the server could be
 * holding for it, so clearing the stale mirror entry IS the removal, and it
 * succeeds.
 */
export async function unfollowShow(showId: string): Promise<PushWriteResult<void>> {
  const lookup = await lookupExistingPushIdentity();
  // Not `getExistingPushIdentity`: that one answers `null` for a lookup that THREW as well, and
  // a removal cannot tell those apart and still be honest — "there is nothing to delete" would
  // then be reported over a live subscription whose reminder stays armed.
  if (!lookup.ok) return { ok: false, error: { reason: 'network' } };
  if (!lookup.identity) {
    setShowFollowedLocal(showId, false);
    return { ok: true, value: undefined };
  }
  const result = await deletePushFollow('/api/push/show-follows', {
    endpoint: lookup.identity.endpoint,
    showId,
  });
  if (result.ok) setShowFollowedLocal(showId, false);
  return result;
}

/**
 * Returns the server's own row, not just whether the write succeeded — a
 * caller updating its own list optimistically needs the real
 * `outOfSeason`/`retired`/`parkId`/`parkSlug` the API resolved, not a guess
 * built from what the dropdown that triggered this call happened to know.
 */
async function postRideAlert(
  identity: { endpoint: string },
  attractionId: string,
  thresholdMinutes: number
): Promise<PushWriteResult<RideAlertRemote>> {
  try {
    const response = await fetch('/api/push/ride-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, attractionId, thresholdMinutes }),
    });
    if (!response.ok) return { ok: false, error: await classifyFailure(response) };
    const alert = (await response.json()) as RideAlertRemote;
    setRideAlertLocal(attractionId, thresholdMinutes);
    return { ok: true, value: alert };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

export async function setRideAlert(
  attractionId: string,
  thresholdMinutes: number
): Promise<PushWriteResult<RideAlertRemote>> {
  const registration = await identityForWrite();
  if (!registration.ok) {
    return { ok: false, error: { reason: 'unavailable', cause: registration.cause } };
  }
  const result = await postRideAlert(registration.identity, attractionId, thresholdMinutes);
  if (result.ok || result.error.reason !== 'not-found') return result;
  // Same reasoning as `followShow` — a 404 here most likely means the
  // backend's copy of this browser's subscription is gone, not that the
  // ride itself is (it came from this park's own attraction list). Re-sync
  // the subscription once and retry before giving up.
  const resynced = await ensurePushRegistered();
  if (!resynced.ok) return result;
  return postRideAlert(resynced.identity, attractionId, thresholdMinutes);
}

/** Same contract as `unfollowShow` — see there for why the mirror moves last. */
export async function removeRideAlert(attractionId: string): Promise<PushWriteResult<void>> {
  const lookup = await lookupExistingPushIdentity();
  if (!lookup.ok) return { ok: false, error: { reason: 'network' } };
  if (!lookup.identity) {
    removeRideAlertLocal(attractionId);
    return { ok: true, value: undefined };
  }
  const result = await deletePushFollow('/api/push/ride-alerts', {
    endpoint: lookup.identity.endpoint,
    attractionId,
  });
  if (result.ok) removeRideAlertLocal(attractionId);
  return result;
}

/**
 * The server's list, for the dialog and the overview page to reconcile
 * against. `{ ok: true, items: [] }` is a real "this browser has none" (no
 * identity yet, or the API's own 404 for "no subscription") — `{ ok: false
 * }` is "we don't know", which a caller must not render as the same empty
 * state: a visitor with five real alerts must not see "nothing set up yet"
 * because a fetch hiccupped.
 */
export async function fetchRideAlertsRemote(): Promise<PushListResult<RideAlertRemote>> {
  const identity = await getExistingPushIdentity();
  if (!identity) return { ok: true, items: [] };
  try {
    const response = await fetch(
      `/api/push/ride-alerts?endpoint=${encodeURIComponent(identity.endpoint)}`,
      {
        cache: 'no-store',
      }
    );
    if (response.status === 404) return { ok: true, items: [] };
    if (!response.ok) return { ok: false };
    return { ok: true, items: (await response.json()) as RideAlertRemote[] };
  } catch {
    return { ok: false };
  }
}

/** Same reasoning as `fetchRideAlertsRemote` — see there. */
export async function fetchShowFollowsRemote(): Promise<PushListResult<ShowFollowRemote>> {
  const identity = await getExistingPushIdentity();
  if (!identity) return { ok: true, items: [] };
  try {
    const response = await fetch(
      `/api/push/show-follows?endpoint=${encodeURIComponent(identity.endpoint)}`,
      {
        cache: 'no-store',
      }
    );
    if (response.status === 404) return { ok: true, items: [] };
    if (!response.ok) return { ok: false };
    return { ok: true, items: (await response.json()) as ShowFollowRemote[] };
  } catch {
    return { ok: false };
  }
}
