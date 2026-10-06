'use client';

import { lookupExistingPushIdentity } from './push-registration';
import { hasAnyPushFollowsLocal } from './push-follows-store';
import { readArmedPush } from '../planner/push-arming';

/**
 * Keeps `push_subscriptions.timezone` pointed at where the phone is, not where it was when an
 * alert was armed: the API's quiet hours (23:00 to 07:00) run on this zone, so a subscription
 * armed in Berlin and carried to Orlando would go quiet over the park evening. On a page load the
 * current zone is compared with the one the API last accepted and sent only when they differ.
 *
 * - A browser with nothing armed pays two `localStorage` reads and nothing else.
 * - A failed refresh changes nothing and never unsubscribes: the subscription carries armed
 *   alerts.
 * - The POST sends no `tripId` or `topics`, so the trip-planner half of the row stays, but does
 *   send `locale`, which the API assigns unconditionally.
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
 * Remembers that the API accepted this zone for this endpoint. Called on the 2xx of every POST
 * that carried a zone, so the next page load does not send the same zone again.
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
function pushTimezoneNeedsSend(endpoint: string, timezone: string): boolean {
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
