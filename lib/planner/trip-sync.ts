'use client';

import { classifyWriteFailure, type HttpWriteError } from '../api/write-failure';
import { plannerStore } from './store';
import type { PlannerState } from './types';

/**
 * The plan's copy on the server, which exists for push: the notification job has no browser to
 * ask. The trip id links the two and is stored beside the plan.
 *
 * The id is the credential: there is no account, and whoever holds it can read and overwrite the
 * trip. The plan is uploaded only while push is on, so a visitor who never turns it on never has a
 * copy on the server.
 */

const TRIP_ID_KEY = 'parkfan_trip_id';

/** The stored trip id, or `null`. Safe to call before mount. */
export function getTripId(): string | null {
  try {
    return window.localStorage.getItem(TRIP_ID_KEY);
  } catch {
    // A private window, or site data blocked: push will not work here, which is not a crash.
    return null;
  }
}

function setTripId(id: string | null): void {
  try {
    if (id === null) window.localStorage.removeItem(TRIP_ID_KEY);
    else window.localStorage.setItem(TRIP_ID_KEY, id);
  } catch {
    // Nothing to do: the next call creates a trip rather than resuming one.
  }
}

/**
 * Why the plan did not reach the server: the shared classes (`@/lib/api/write-failure`) minus the
 * 404, which is not a failure here but the one case that starts a new trip (see `syncTrip`). Kept
 * apart so no caller has to guess "gone" from "busy".
 */
export type TripSyncError = Exclude<HttpWriteError, { reason: 'not-found' }>;

/**
 * The id the plan is stored under, or why it is not stored. `replaced` means the server answered
 * 404 for the caller's id and a new trip took its place; it is how whoever keeps a second copy of
 * the id (the push subscription) hears of it, without this file importing that side.
 */
export type TripSyncResult =
  { ok: true; id: string; replaced?: true } | { ok: false; error: TripSyncError };

/**
 * Push the current plan to the server, creating a trip the first time.
 *
 * Only a 404 starts a new trip: the id is dropped and a new one POSTed. Every other answer keeps
 * the id (400 `invalid`, 429 `rate-limited` with the limiter's window, 5xx or no answer `network`),
 * because the push subscription still names it, and a new trip would leave the job reading a stale
 * plan and an orphan row behind.
 *
 * A 404 is an answer about the trip on this endpoint (see `TripsController.update` and
 * `app/api/trips/[id]/route.ts`), but not on `POST /api/trips`, see `post`. The replaced id is
 * reported (`replaced: true`), not repaired: re-pointing the subscription is the caller's job.
 */
export async function syncTrip(): Promise<TripSyncResult> {
  const epoch = forgetCount;
  const payload = plannerStore.getSnapshot();
  const existing = getTripId();

  if (existing) {
    const updated = await put(existing, payload);
    if (overtaken(epoch)) return SUPERSEDED;
    if (updated.ok) return { ok: true, id: existing };
    if (updated.error.reason !== 'not-found') return { ok: false, error: updated.error };
    // Gone, and the server said so: the local id is dead either way, and keeping it would send the
    // next sync into the same 404.
    setTripId(null);
  }

  if (overtaken(epoch)) return SUPERSEDED;
  const created = await post(payload);
  if (!created.ok) return created;
  if (overtaken(epoch)) {
    // The delete landed while this create was on the wire: take the row back down rather than store
    // its id, since the switch is off and a plan may not outlive it.
    void del(created.id);
    return SUPERSEDED;
  }
  setTripId(created.id);
  return existing ? { ...created, replaced: true } : created;
}

/**
 * How many times the stored trip has been thrown away. A sync already on the wire cannot be called
 * back, and one overtaken by a switch-off would read the DELETE's 404 as "start another trip" and
 * resurrect the plan. So every sync carries the count it started under and gives up if it moved.
 * Per tab, since it is module state; it covers the auto-sync, which is not cancellable once sent.
 */
let forgetCount = 0;

function overtaken(epoch: number): boolean {
  return forgetCount !== epoch;
}

/**
 * A sync abandoned because the plan was deleted underneath it, in the "our end, try later" class:
 * this did not land, leave the switch off.
 */
const SUPERSEDED: TripSyncResult = { ok: false, error: { reason: 'network' } };

async function put(
  id: string,
  payload: PlannerState
): Promise<{ ok: true } | { ok: false; error: HttpWriteError }> {
  try {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!response.ok) return { ok: false, error: await classifyWriteFailure(response) };
    return { ok: true };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * `POST /api/trips` has no 404 of its own, so a 404 here means the route is not answering, the same
 * "our end, try later" bucket as a 502. A body without a usable id lands there too: this browser
 * cannot name what the write created.
 */
async function post(payload: PlannerState): Promise<TripSyncResult> {
  try {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!response.ok) {
      const error = await classifyWriteFailure(response);
      return { ok: false, error: error.reason === 'not-found' ? { reason: 'network' } : error };
    }
    const data = (await response.json().catch(() => null)) as { id?: unknown } | null;
    if (typeof data?.id !== 'string') return { ok: false, error: { reason: 'network' } };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}

/**
 * Keep the server's copy in step with the plan while push is on, because the job reads the stored
 * plan. Debounced, since a drag writes on every pointer move. `onReplaced` hears the new id when a
 * background sync had to start a new trip, which nobody else can.
 */
let stopAutoSync: (() => void) | null = null;

/**
 * Starts a debounced (4 s) sync of the plan to the server on every plan change while a trip id is
 * stored; a second call does nothing.
 */
export function startTripAutoSync(onReplaced?: (id: string) => void): void {
  if (stopAutoSync) return;

  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = plannerStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // No id means push is not on, or the trip is gone. Either way this is
      // not the place to create one: that happens when the visitor turns the
      // switch on, deliberately.
      if (!getTripId()) return;
      void syncTrip().then((result) => {
        if (result.ok && result.replaced) onReplaced?.(result.id);
      });
    }, AUTO_SYNC_DEBOUNCE_MS);
  });

  stopAutoSync = () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
    stopAutoSync = null;
  };
}

/** Stops the plan auto-sync started by `startTripAutoSync`, dropping any pending write. */
export function stopTripAutoSync(): void {
  stopAutoSync?.();
}

/**
 * Long enough that a drag is one write, short enough that an edit reaches the server before the
 * phone goes back in the pocket.
 */
const AUTO_SYNC_DEBOUNCE_MS = 4000;

/** Deleted, or why not. A 404 lands in `ok` — see `forgetTrip`. */
export type TripDeleteResult = { ok: true } | { ok: false; error: TripSyncError };

/**
 * Delete the server's copy, then forget it: when push is switched off, and on the failure paths of
 * switching it on, so no attempt that ends off leaves a row behind. A shared link stops working.
 *
 * Server first: the id is the credential and this browser holds the only copy, so a refused DELETE
 * keeps it for a real retry. A 404 is a success here, since the trip being gone is what was asked
 * for; in `syncTrip` the same status means "start a new trip".
 */
export async function forgetTrip(): Promise<TripDeleteResult> {
  // Counted first, before the id is read and unconditionally: a sync already on the wire must be
  // superseded from now on, including one that already dropped the id after a 404 and is about to
  // POST a new trip.
  forgetCount += 1;

  const id = getTripId();
  // Nothing stored: push was never on, or a previous delete already landed.
  if (id === null) return { ok: true };

  const deleted = await del(id);
  if (!deleted.ok && deleted.error.reason !== 'not-found') {
    return { ok: false, error: deleted.error };
  }
  setTripId(null);
  return { ok: true };
}

async function del(id: string): Promise<{ ok: true } | { ok: false; error: HttpWriteError }> {
  try {
    const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
    if (!response.ok) return { ok: false, error: await classifyWriteFailure(response) };
    return { ok: true };
  } catch {
    return { ok: false, error: { reason: 'network' } };
  }
}
