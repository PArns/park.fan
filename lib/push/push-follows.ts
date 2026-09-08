'use client';

import { ensurePushRegistered, getExistingPushIdentity } from './push-registration';
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
  /** No push identity at all — permission denied, unsupported browser, or this deploy has no VAPID key. */
  | { reason: 'unavailable' }
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

async function identityForWrite() {
  return (await getExistingPushIdentity()) ?? (await ensurePushRegistered());
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
      .then((body: unknown) => {
        const raw =
          typeof body === 'object' && body !== null && 'retryAfterSeconds' in body
            ? (body as { retryAfterSeconds: unknown }).retryAfterSeconds
            : undefined;
        return typeof raw === 'number' && Number.isFinite(raw) ? raw : NaN;
      })
      .catch(() => NaN);
    // A body the limiter didn't shape as expected is still a rate limit —
    // 60s is a reasonable "try later" default, not a claim about the real window.
    return { reason: 'rate-limited', retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 60 };
  }
  if (response.status === 404) return { reason: 'not-found' };
  if (response.status >= 400 && response.status < 500) return { reason: 'invalid' };
  return { reason: 'network' };
}

export async function followShow(showId: string): Promise<PushWriteResult<void>> {
  const identity = await identityForWrite();
  if (!identity) return { ok: false, error: { reason: 'unavailable' } };
  try {
    const response = await fetch('/api/push/show-follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, showId }),
    });
    if (!response.ok) return { ok: false, error: await classifyFailure(response) };
    setShowFollowedLocal(showId, true);
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * Optimistic, like `FavoriteStar`'s toggle: the local mirror clears
 * immediately, and the server call best-effort follows. A browser with no
 * subscription at all (never granted permission) has nothing to tell the
 * server in the first place.
 */
export async function unfollowShow(showId: string): Promise<void> {
  setShowFollowedLocal(showId, false);
  const identity = await getExistingPushIdentity();
  if (!identity) return;
  try {
    await fetch('/api/push/show-follows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, showId }),
    });
  } catch {
    // Local state already reflects the choice; a retry happens next open.
  }
}

/**
 * Returns the server's own row, not just whether the write succeeded — a
 * caller updating its own list optimistically needs the real
 * `outOfSeason`/`retired`/`parkId`/`parkSlug` the API resolved, not a guess
 * built from what the dropdown that triggered this call happened to know.
 */
export async function setRideAlert(
  attractionId: string,
  thresholdMinutes: number
): Promise<PushWriteResult<RideAlertRemote>> {
  const identity = await identityForWrite();
  if (!identity) return { ok: false, error: { reason: 'unavailable' } };
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

export async function removeRideAlert(attractionId: string): Promise<void> {
  removeRideAlertLocal(attractionId);
  const identity = await getExistingPushIdentity();
  if (!identity) return;
  try {
    await fetch('/api/push/ride-alerts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, attractionId }),
    });
  } catch {
    // Same as unfollowShow — local state already moved.
  }
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
