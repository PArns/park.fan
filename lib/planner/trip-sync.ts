'use client';

import { classifyWriteFailure, type HttpWriteError } from '../api/write-failure';
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
 * Whether the plan reached the server, and why not where it did not.
 *
 * The classes are the shared ones (`@/lib/api/write-failure`), minus the 404:
 * a trip that is gone is not a failure this function reports, it is the one
 * case that starts a new trip — see `syncTrip`.
 */
export type TripSyncResult =
  | { ok: true; id: string }
  | { ok: false; error: Exclude<HttpWriteError, { reason: 'not-found' }> };

/**
 * Push the current plan to the server, creating a trip the first time.
 *
 * **Only a 404 starts a new trip.** The update used to read `response.ok` and
 * nothing else, so a 500, a 429 or a dropped connection all meant the same as
 * an expired trip: throw the id away and POST a new one. That is wrong twice
 * over, and neither shows up on screen. The stored subscription still names the
 * OLD trip id — it was written once, when push was switched on — so the
 * notification job keeps reading the plan as it stood at the moment of the
 * failure, while every later edit goes to a row nobody reads; and switching push
 * off then sends its scoped DELETE for the new id, leaving the subscription's
 * trip half where it was. Each transient failure also leaves an orphan row
 * behind for the full 400-day TTL.
 *
 * So the id survives everything the server might be having a bad minute about,
 * and only the one answer that means "there is no such trip" replaces it:
 *
 * | Answer          | What happens                                   |
 * | --------------- | ---------------------------------------------- |
 * | 200             | the id stands, plan stored                      |
 * | 404             | the trip is gone — id dropped, a new one POSTed |
 * | 400             | id kept, `invalid` — a POST of the same payload would be refused in the same breath |
 * | 429             | id kept, `rate-limited` with the limiter's window |
 * | 5xx / no answer | id kept, `network`                              |
 *
 * A 404 is not an error to report either: a trip expires, and a plan somebody
 * comes back to after a year should quietly get a new id rather than an apology.
 */
export async function syncTrip(): Promise<TripSyncResult> {
  const state = plannerStore.getSnapshot();
  const payload = payloadOf(state);
  const existing = getTripId();

  if (existing) {
    const updated = await put(existing, payload);
    if (updated.ok) return { ok: true, id: existing };
    if (updated.error.reason !== 'not-found') return { ok: false, error: updated.error };
    // Gone or expired, and the server said so. Dropping the id here rather
    // than after the POST is the same "the mirror follows the server" rule the
    // push removals keep: this local id is confirmed dead either way, and
    // leaving it would only send the next sync into the same 404.
    setTripId(null);
  }

  const created = await post(payload);
  if (!created.ok) return created;
  setTripId(created.id);
  return created;
}

async function put(
  id: string,
  payload: Record<string, unknown>
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
 * `POST /api/trips` has no 404 of its own — there is no id in it to miss — so a
 * 404 here means the route itself is not answering, which belongs in the same
 * "our end, try later" bucket as a 502 rather than being reported as a payload
 * the visitor could fix. A body without a usable id lands there too: the write
 * may well have landed, but this browser cannot name what it landed as, which
 * is the same dead end as no answer at all.
 */
async function post(payload: Record<string, unknown>): Promise<TripSyncResult> {
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
