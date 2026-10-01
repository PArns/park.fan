'use client';

import { rememberArmedPush } from './push-arming';
import { plannerPushTopics, resolvePushTopics } from './push-topics';
import { getTripId } from './trip-sync';
import { currentPushTimezone, rememberSentPushTimezone } from '../push/push-timezone';

/**
 * The one request that writes a subscription row: this endpoint, against this
 * trip, with these topics.
 *
 * Sent when push is switched on, when the visitor changes what they want, and
 * when the trip id the row names was replaced. Kept in one place because the
 * three used to be copies, and a fourth field added to two of them is the kind
 * of drift nobody sees.
 */
export async function postSubscription(
  subscription: PushSubscription,
  tripId: string,
  topics: string[]
): Promise<{ response: Response; timezone: string | null }> {
  const json = subscription.toJSON();
  const timezone = currentPushTimezone();
  const response = await fetch('/api/push/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      tripId,
      locale: document.documentElement.lang || 'en',
      ...(timezone ? { timezone } : {}),
      topics,
    }),
  });
  // The one place this is written: the server has just accepted this endpoint
  // against this trip, and that answer is what the next mount reads instead of
  // guessing from two local signals (`push-arming.ts`). Only on the 2xx, and
  // deliberately not cleared on a refusal — see `forgetArmedPush`. Here rather
  // than at each caller because a re-pointed row is a new pair and the record
  // has to follow it.
  if (response.ok) rememberArmedPush(subscription.endpoint, tripId);
  return { response, timezone };
}

/**
 * Point this browser's subscription row at `tripId`, after `syncTrip` replaced
 * the id the row was written with.
 *
 * `true` when the server accepted the row. `false` when it did not, when there
 * is no subscription to point, or when the id moved on again meanwhile
 * (`forgetTrip` clears it, so nothing is left to point at): the caller then owes
 * the visitor the same answer as a refused write, a switch that is off.
 *
 * Shared by the auto-sync callback in `usePushSubscription` and by
 * `adoptSharedPlan`, which runs without the hook and so without its callback.
 *
 * @param availableTopics what `GET /api/push` offers; fetched here when the
 *   caller does not have it already.
 */
export async function repointPushSubscription(
  tripId: string,
  availableTopics?: readonly string[]
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    // Overtaken by a switch-off (`forgetTrip` clears the id): nothing is left to
    // point at. Not the effect's cleanup, which also runs on a remount and would
    // drop a replacement that is still in flight.
    if (getTripId() !== tripId) return true;
    if (!subscription) return false;
    const topics = availableTopics ?? (await fetchAvailableTopics());
    if (!topics) return false;
    // Read now rather than captured: the visitor may have narrowed the topics
    // since the caller started.
    const { response, timezone } = await postSubscription(
      subscription,
      tripId,
      resolvePushTopics(topics, plannerPushTopics.getSnapshot())
    );
    if (!response.ok) return false;
    if (timezone) rememberSentPushTimezone(subscription.endpoint, timezone);
    return true;
  } catch {
    return false;
  }
}

async function fetchAvailableTopics(): Promise<readonly string[] | null> {
  const response = await fetch('/api/push', { cache: 'no-store' });
  if (!response.ok) return null;
  const info = (await response.json()) as { topics?: unknown };
  return Array.isArray(info.topics) ? (info.topics as string[]) : null;
}
