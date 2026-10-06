'use client';

import {
  ensurePushRegistered,
  getExistingPushIdentity,
  lookupExistingPushIdentity,
  type PushRegistration,
  type PushUnavailableCause,
} from './push-registration';
import { classifyWriteFailure, type HttpWriteError } from '../api/write-failure';
import {
  removeRideAlertLocal,
  setRideAlertLocal,
  setShowFollowedLocal,
  type RideAlertKind,
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
  /** `null` is the wait-time alert, the only kind before `reopen` existed. */
  kind?: RideAlertKind | null;
  /** `null` for a reopen alert, which has no threshold. */
  thresholdMinutes: number | null;
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
 * No push identity at all. `cause` is what separates "blocked in your browser"
 * (a setting only the visitor can change) from "this browser cannot" from "our
 * end is down": three different sentences.
 */
type PushUnavailableError = { reason: 'unavailable'; cause: PushUnavailableCause };

/**
 * Why a write didn't go through — the four HTTP classes every write path in
 * this app shares (`@/lib/api/write-failure`), plus the one above, which only a
 * push write can produce.
 */
export type PushWriteError = PushUnavailableError | HttpWriteError;

export type PushWriteResult<T> = { ok: true; value: T } | { ok: false; error: PushWriteError };

/** A fetch that failed must not look like a list that is genuinely empty — see the two fetchers below. */
export type PushListResult<T> = { ok: true; items: T[] } | { ok: false };

async function identityForWrite(): Promise<PushRegistration> {
  const existing = await getExistingPushIdentity();
  if (existing) return { ok: true, identity: existing };
  return ensurePushRegistered();
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
    if (!response.ok) return { ok: false, error: await classifyWriteFailure(response) };
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
 * Follows a show for this browser, registering push only when there is no subscription yet.
 * `startTime` is the chosen performance as an ISO instant, omitted for "whichever is next".
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
  // The browser had a live subscription, so the API never got to re-upsert its row: a 404 most
  // likely means the backend's copy is gone, not the show. Re-sync once and retry.
  const resynced = await ensurePushRegistered();
  if (!resynced.ok) return result;
  return postFollowShow(resynced.identity, showId, startTime);
}

/**
 * The DELETE both removals send. A 404 is a success: neither API handler validates the entity id
 * (both answer 204 for a missing row), so its one 404 means this browser has no stored
 * subscription, which cannot be holding an alert, and a failure there would leave the row on
 * screen for ever. The write path reads 404 the other way, because there the write did not
 * happen.
 */
async function deletePushFollow(url: string, body: unknown): Promise<PushWriteResult<void>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok && response.status !== 404) {
      return { ok: false, error: await classifyWriteFailure(response) };
    }
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * Stops reminding for a show: server first, mirror second, because a notification that will
 * arrive on a phone must not leave the screen while it is still armed. A browser with no push
 * identity has nothing the server could hold, so clearing the mirror is the removal.
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

/** What an alert is about: a wait dropping under a threshold, or the ride opening again. */
type RideAlertWhat = { thresholdMinutes: number } | { kind: RideAlertKind };

/**
 * Returns the server's own row, not just whether the write succeeded — a
 * caller updating its own list optimistically needs the real
 * `outOfSeason`/`retired`/`parkId`/`parkSlug` the API resolved, not a guess
 * built from what the dropdown that triggered this call happened to know.
 */
async function postRideAlert(
  identity: { endpoint: string },
  attractionId: string,
  what: RideAlertWhat
): Promise<PushWriteResult<RideAlertRemote>> {
  try {
    const response = await fetch('/api/push/ride-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // A reopen alert sends no threshold: the API's DTO asks for one only without a `kind`.
      body: JSON.stringify({
        endpoint: identity.endpoint,
        attractionId,
        ...('kind' in what ? { kind: what.kind } : { thresholdMinutes: what.thresholdMinutes }),
      }),
    });
    if (!response.ok) return { ok: false, error: await classifyWriteFailure(response) };
    const alert = (await response.json()) as RideAlertRemote;
    if ('kind' in what) setRideAlertLocal(attractionId, null, what.kind);
    else setRideAlertLocal(attractionId, what.thresholdMinutes);
    return { ok: true, value: alert };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/** Sets or changes a ride's wait-time alert for this browser and returns the server's row. */
export function setRideAlert(
  attractionId: string,
  thresholdMinutes: number
): Promise<PushWriteResult<RideAlertRemote>> {
  return writeRideAlert(attractionId, { thresholdMinutes });
}

/**
 * "Tell me when this ride opens again". The API keeps one alert per ride and browser, so this
 * replaces a wait-time alert on the same ride, and `setRideAlert` replaces this one.
 */
export function setReopenAlert(attractionId: string): Promise<PushWriteResult<RideAlertRemote>> {
  return writeRideAlert(attractionId, { kind: 'reopen' });
}

async function writeRideAlert(
  attractionId: string,
  what: RideAlertWhat
): Promise<PushWriteResult<RideAlertRemote>> {
  const registration = await identityForWrite();
  if (!registration.ok) {
    return { ok: false, error: { reason: 'unavailable', cause: registration.cause } };
  }
  const result = await postRideAlert(registration.identity, attractionId, what);
  if (result.ok || result.error.reason !== 'not-found') return result;
  // As in `followShow`: a 404 most likely means the backend lost this browser's subscription,
  // not the ride. Re-sync once and retry.
  const resynced = await ensurePushRegistered();
  if (!resynced.ok) return result;
  return postRideAlert(resynced.identity, attractionId, what);
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
 * The server's list of this browser's ride alerts. `{ ok: true, items: [] }` is a real "none";
 * `{ ok: false }` is "we don't know", which a caller must not render as the empty state. Hence
 * `lookupExistingPushIdentity`, which unlike `getExistingPushIdentity` does not answer `null` for
 * a lookup that threw.
 */
export async function fetchRideAlertsRemote(): Promise<PushListResult<RideAlertRemote>> {
  const lookup = await lookupExistingPushIdentity();
  if (!lookup.ok) return { ok: false };
  const identity = lookup.identity;
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
  const lookup = await lookupExistingPushIdentity();
  if (!lookup.ok) return { ok: false };
  const identity = lookup.identity;
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
