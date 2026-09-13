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
 * Why the plan did not reach the server.
 *
 * The shared classes (`@/lib/api/write-failure`) minus the 404: a trip that is
 * gone is not a failure this file reports, it is the one case that starts a new
 * trip — see `syncTrip`.
 *
 * Nothing prints these yet. `enable()` reads `ok` and nothing else, and what a
 * refused sync should SAY — a countdown for the limiter, silence for a hiccup —
 * is a question about the push toggle rather than about this file; it is open at
 * PAR-91. They are separated here because the alternative is the boolean that
 * caused the bug above: a caller that cannot tell "this trip is gone" from "the
 * server is busy" has to guess, and the guess was to create a second trip.
 */
export type TripSyncError = Exclude<HttpWriteError, { reason: 'not-found' }>;

/** The id the plan is stored under, or why it is not stored. */
export type TripSyncResult = { ok: true; id: string } | { ok: false; error: TripSyncError };

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
 *
 * **Why a 404 is taken at face value here and not in `post` below.** It is the
 * endpoint's contract that decides, not the number: `TripsController.update`
 * documents 404 as "no such trip" and the proxy in front of it answers the same
 * for an id that cannot be one (`app/api/trips/[id]/route.ts`), so on this path
 * a 404 is an answer about the trip. `POST /api/trips` has no 404 in its
 * contract at all, so there it can only mean the route is not answering. The
 * residual risk is the same for both and is not worth a fragile
 * tell-them-apart-by-body check: a deploy that has lost `/api/trips/:id` has
 * lost `/api/trips` with it, so the id is dropped and the create that would
 * replace it fails in the same breath.
 *
 * **What this does not close:** on that one remaining path the id really is
 * replaced, and nothing re-points the stored subscription at the new one — so a
 * trip expiring under an open tab leaves the same dangling reference described
 * above, for the one reason that is not a server having a bad minute. The repair
 * belongs on the push side rather than here (this file knows nothing about
 * subscriptions, deliberately) and is PAR-131.
 */
export async function syncTrip(): Promise<TripSyncResult> {
  const epoch = forgetCount;
  const state = plannerStore.getSnapshot();
  const payload = payloadOf(state);
  const existing = getTripId();

  if (existing) {
    const updated = await put(existing, payload);
    if (overtaken(epoch)) return SUPERSEDED;
    if (updated.ok) return { ok: true, id: existing };
    if (updated.error.reason !== 'not-found') return { ok: false, error: updated.error };
    // Gone or expired, and the server said so. Dropping the id here rather
    // than after the POST is the same "the mirror follows the server" rule the
    // push removals keep: this local id is confirmed dead either way, and
    // leaving it would only send the next sync into the same 404.
    setTripId(null);
  }

  if (overtaken(epoch)) return SUPERSEDED;
  const created = await post(payload);
  if (!created.ok) return created;
  if (overtaken(epoch)) {
    // The delete landed while this create was on the wire, so the row exists
    // and nothing wants it. Take it back down rather than store its id: the
    // switch is off by now, and a plan may not outlive that. A refused delete
    // here is the one orphan this cannot prevent — one request wide.
    void del(created.id);
    return SUPERSEDED;
  }
  setTripId(created.id);
  return created;
}

/**
 * How many times the stored trip has been thrown away, and why a counter.
 *
 * `stopTripAutoSync` clears the pending timer and nothing more: a sync that has
 * already gone out cannot be called back. That was harmless while switching off
 * only forgot the id — a racing PUT simply got its 200. The DELETE is what gives
 * that request a 404 to read, and `syncTrip` reads a 404 as "this trip is gone,
 * start another one": a sync overtaken by a switch-off would POST a fresh row
 * and write its id back over the one `forgetTrip` had just cleared, leaving a
 * plan nobody asked for standing for the full 400-day TTL — and, where another
 * alert keeps the browser's push subscription alive, a switch that reads ON with
 * nothing behind it on the next mount.
 *
 * So every sync carries the count it started under and gives up if it moved.
 */
let forgetCount = 0;

function overtaken(epoch: number): boolean {
  return forgetCount !== epoch;
}

/**
 * A sync abandoned because the plan was deleted underneath it. The "our end,
 * try later" class rather than one of its own: nothing distinguishes it, and
 * the one caller that reads the result (`enable`) wants exactly what that
 * bucket means here — this did not land, leave the switch off.
 */
const SUPERSEDED: TripSyncResult = { ok: false, error: { reason: 'network' } };

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

/** Deleted, or why not. A 404 lands in `ok` — see `forgetTrip`. */
export type TripDeleteResult = { ok: true } | { ok: false; error: TripSyncError };

/**
 * Delete the server's copy, then forget it.
 *
 * Called when push is switched off, and on the failure paths of switching it
 * on: the plan is uploaded only while push is on, so an attempt that ends off
 * may not leave a row behind.
 *
 * This used to drop the LINK and nothing else, on the grounds that a shared id
 * must not die with one browser's switch. It had the effect backwards. There is
 * no share entry point (PAR-82), so no id has ever been passed on — while
 * dropping the link made the row **unreachable to the only person who wanted it
 * gone**, for the full 400-day TTL, and left it readable and writable by anyone
 * who had the id from a log or an old device. Switching off now deletes.
 *
 * **Server first, mirror second**, the rule the push removals keep: the id is
 * the credential and this browser holds the only copy, so forgetting it before
 * the server confirmed would lose the row for good. A refused DELETE therefore
 * keeps the id and names its class, and the next attempt is a real retry.
 *
 * **A 404 is a success.** The trip has expired or is already gone; that is what
 * the caller asked for, and an error over it would stand for ever since every
 * retry answers 404 too. Same status, opposite reading to `syncTrip`, where a
 * 404 means "this id is dead, start a new trip" — there it is an answer about a
 * plan somebody is still editing, here about one they are throwing away.
 */
export async function forgetTrip(): Promise<TripDeleteResult> {
  const id = getTripId();
  // Nothing stored: push was never on, or a previous delete already landed.
  if (id === null) return { ok: true };

  // Counted BEFORE the request, not after it: a sync already on the wire has to
  // be superseded from the moment this one starts, or it lands in the window
  // between and resurrects what is being deleted.
  forgetCount += 1;
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
