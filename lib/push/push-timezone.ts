'use client';

import { lookupExistingPushIdentity } from './push-registration';
import { hasAnyPushFollowsLocal } from './push-follows-store';
import { readArmedPush } from '../planner/push-arming';

/**
 * Keeping `push_subscriptions.timezone` pointed at where the phone IS, rather
 * than where it was when somebody armed an alert.
 *
 * The column is written by three calls — `ensurePushRegistered`, and the
 * planner's `enable` and `setTopics` — and every one of them runs because a
 * visitor pressed something. Nothing reads the zone again afterwards, so the
 * stored value is a snapshot of the moment the switch went on. That was
 * harmless while no reader existed. It stopped being harmless with PAR-215,
 * which suppresses every send between 23:00 and 07:00 BY THIS ZONE: a
 * subscription armed in Berlin and carried to Orlando has its quiet window
 * land on 17:00–01:00 local, over half the park evening, and the visitor gets
 * nothing from the moment the rides get interesting.
 *
 * What this module adds is the missing read: on a page load, compare the
 * browser's current zone against the one last accepted for this endpoint and
 * send a fresh one only when the two differ.
 *
 * Three properties are deliberate and each is load-bearing:
 *
 *   - **It costs nothing on a browser with nothing armed.** The gate is two
 *     `localStorage` reads, ahead of the service-worker lookup and far ahead
 *     of any request.
 *   - **A failed refresh changes nothing.** No record is written, so the next
 *     page load tries again; and the subscription itself is never torn down.
 *     `ensurePushRegistered` unsubscribes on a failed POST because the call
 *     had just created that subscription; here it pre-exists and is carrying
 *     armed alerts, and unsubscribing would answer a traveller's bad network
 *     by switching their alarms off.
 *   - **The POST names only the zone's row-mates.** No `tripId`, no `topics`,
 *     so the API leaves the trip-planner half of the row alone (see the
 *     module docstring of `push-registration.ts`). `locale` IS sent, because
 *     `PushService.subscribe` assigns it unconditionally while it guards the
 *     other three — a POST that omitted it would clear the subscriber's
 *     language to fix their clock.
 */

const SENT_KEY = 'parkfan_push_timezone';

/** The zone last accepted by the API, and the endpoint it was accepted for. */
interface SentTimezone {
  endpoint: string;
  timezone: string;
}

/**
 * This browser's zone, or `null` where it cannot be read.
 *
 * `resolvedOptions()` is required to return a zone by the spec, but a browser
 * that answers with an empty string is not worth a request: sending one would
 * clear a stored zone that is at least a guess, and a subscription with no
 * zone is sent to at any hour.
 */
export function currentPushTimezone(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && typeof zone === 'string' ? zone : null;
  } catch {
    return null;
  }
}

/** What the API last accepted, or `null`. Safe to call before mount. */
export function readSentPushTimezone(): SentTimezone | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(SENT_KEY);
  } catch {
    // A private window, or site data blocked. Reading nothing means the next
    // write is attempted once, which overstates the work and understates
    // nothing — the opposite way round would leave a stale zone in place.
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { endpoint, timezone } = parsed as Partial<SentTimezone>;
    if (typeof endpoint !== 'string' || !endpoint) return null;
    if (typeof timezone !== 'string' || !timezone) return null;
    return { endpoint, timezone };
  } catch {
    return null;
  }
}

/**
 * Remember that the API accepted this zone for this endpoint.
 *
 * Called on the 2xx of every POST that carried a zone — the two in
 * `use-push-subscription.ts` and the one in `push-registration.ts` as well as
 * this module's own. Leaving those three out would have the first page load
 * after somebody armed an alert send the very same zone a second time.
 */
export function rememberSentPushTimezone(endpoint: string, timezone: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SENT_KEY, JSON.stringify({ endpoint, timezone }));
  } catch {
    // Nothing lost that matters: the next load reads no record and sends once.
  }
}

/**
 * Whether the API has to hear about this zone.
 *
 * The endpoint is part of the question, not decoration. A push service that
 * rotates the endpoint leaves a record describing a subscription this browser
 * no longer has, and the new one's row may carry any zone or none.
 */
export function pushTimezoneNeedsSend(endpoint: string, timezone: string): boolean {
  const sent = readSentPushTimezone();
  return sent === null || sent.endpoint !== endpoint || sent.timezone !== timezone;
}

/**
 * What a refresh did, for the tests and for nothing else — no caller branches
 * on it. `skipped` covers every reason there was nothing to do, because they
 * are the same reason from the outside: this browser is not one the quiet
 * window applies to right now.
 */
export type PushTimezoneRefresh = 'skipped' | 'unchanged' | 'sent' | 'failed';

/**
 * Send this browser's current zone, if it differs from the last one the API
 * took. Never throws, never prompts, never registers a service worker.
 */
export async function refreshPushTimezone(): Promise<PushTimezoneRefresh> {
  // Nothing armed on this browser, nothing whose delivery a wrong zone could
  // suppress. Two `localStorage` reads: a ride alert or a followed show is in
  // the mirror, the planner's switch is in `push-arming`, and a browser that
  // has neither leaves here without touching the network or the worker.
  if (!hasAnyPushFollowsLocal() && readArmedPush() === null) return 'skipped';

  const timezone = currentPushTimezone();
  if (!timezone) return 'skipped';

  const lookup = await lookupExistingPushIdentity();
  // `lookupExistingPushIdentity` rather than `getExistingPushIdentity`: a
  // lookup that THREW must not be read as "no subscription", or a refusal to
  // touch storage would be recorded as a browser with nothing to refresh.
  // Both answers end here, but only one of them is a fact.
  if (!lookup.ok || !lookup.identity) return 'skipped';

  const identity = lookup.identity;
  if (!pushTimezoneNeedsSend(identity.endpoint, timezone)) return 'unchanged';

  try {
    const response = await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: identity.endpoint,
        p256dh: identity.p256dh,
        auth: identity.auth,
        locale: document.documentElement.lang || 'en',
        timezone,
      }),
    });
    if (!response.ok) return 'failed';
  } catch {
    return 'failed';
  }

  rememberSentPushTimezone(identity.endpoint, timezone);
  return 'sent';
}
