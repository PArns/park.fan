'use client';

import { plannerStore } from './store';
import type { PlannerState } from './types';

/**
 * The plan's copy on the server, and why it exists at all.
 *
 * The planner lives in `localStorage` and that is the right default — no
 * account, works offline, belongs to nobody but the visitor. Push needs the
 * other thing: a notification is decided by a job on a server that has no
 * browser to ask, so the plan has to be somewhere that job can read. The trip
 * id is what links the two, and it is stored beside the plan.
 *
 * **The id is the credential.** There is no account: whoever holds that string
 * can read and overwrite the trip. Nothing here shows it to anybody, and the
 * control that turns push on has to say so in one sentence.
 *
 * The plan is uploaded ONLY while push is on. A visitor who never turns it on
 * never has a copy on the server, which is not a privacy nicety — it is the
 * difference between a feature that stores what it needs and a site that
 * silently mirrors everything anybody plans.
 */

const TRIP_ID_KEY = 'parkfan_trip_id';

/** The stored trip id, or `null`. Safe to call before mount. */
export function getTripId(): string | null {
  try {
    return window.localStorage.getItem(TRIP_ID_KEY);
  } catch {
    // A private window, or site data blocked. Push simply will not work here,
    // which is a fair answer and not a crash.
    return null;
  }
}

function setTripId(id: string | null): void {
  try {
    if (id === null) window.localStorage.removeItem(TRIP_ID_KEY);
    else window.localStorage.setItem(TRIP_ID_KEY, id);
  } catch {
    // Nothing to do. The next call re-creates a trip rather than resuming one,
    // which costs a row and loses nothing.
  }
}

/** What goes on the wire: the plan, and nothing this file adds to it. */
function payloadOf(state: PlannerState): Record<string, unknown> {
  return state as unknown as Record<string, unknown>;
}

/**
 * Push the current plan to the server, creating a trip the first time.
 *
 * Returns the trip id, or `null` when the plan could not be stored — the caller
 * must treat that as "push is not on", because a subscription against a trip
 * that does not exist can never produce a notification.
 *
 * A 404 on the update path is not an error to report: a trip expires, and a
 * plan somebody comes back to after a year should quietly get a new id rather
 * than an apology.
 */
export async function syncTrip(): Promise<string | null> {
  const state = plannerStore.getSnapshot();
  const payload = payloadOf(state);
  const existing = getTripId();

  if (existing) {
    const updated = await put(existing, payload);
    if (updated) return existing;
    // Gone or expired. Fall through and make a new one.
    setTripId(null);
  }

  const created = await post(payload);
  if (created) setTripId(created);
  return created;
}

async function put(id: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function post(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { id?: unknown };
    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * Keep the server's copy in step with the plan, for as long as push is on.
 *
 * The notification job reads the STORED plan, so a block moved after
 * subscribing would otherwise keep notifying at its old time — indefinitely,
 * with nothing on screen to suggest why. This is the half of push that has no
 * UI at all and is the easiest to forget.
 *
 * Debounced, because a drag writes to the store on every pointer move: without
 * it a single block dragged across an afternoon would be a few hundred PUTs,
 * which is both rude and the fastest way to meet the API's own write limiter.
 *
 * Idempotent — calling it twice does not subscribe twice — and it returns the
 * stopper rather than exposing one, so a caller cannot arm it and lose the
 * handle.
 */
let stopAutoSync: (() => void) | null = null;

export function startTripAutoSync(): void {
  if (stopAutoSync) return;

  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = plannerStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // No id means push is not on, or the trip is gone. Either way this is
      // not the place to create one: that happens when the visitor turns the
      // switch on, deliberately.
      if (getTripId()) void syncTrip();
    }, AUTO_SYNC_DEBOUNCE_MS);
  });

  stopAutoSync = () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
    stopAutoSync = null;
  };
}

export function stopTripAutoSync(): void {
  stopAutoSync?.();
}

/**
 * Long enough that a drag is one write, short enough that somebody who edits
 * and pockets their phone has the new plan on the server before the next tick.
 */
const AUTO_SYNC_DEBOUNCE_MS = 4000;

/**
 * Forget the server's copy.
 *
 * Called when push is switched off. It drops the LINK rather than deleting the
 * row, because there is no delete endpoint — and deliberately so: a trip id may
 * have been shared, and a switch in one browser must not take a link somebody
 * else is holding with it. The row expires on its own.
 */
export function forgetTrip(): void {
  setTripId(null);
}
