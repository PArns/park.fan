'use client';

import { rememberArmedPush } from './push-arming';
import { plannerPushTopics, resolvePushTopics } from './push-topics';
import { getTripId } from './trip-sync';
import { currentPushTimezone, rememberSentPushTimezone } from '../push/push-timezone';

/**
 * The one request that writes a subscription row: this endpoint, against this trip, with these
 * topics. Sent on switching push on, on a topic change and when the trip id was replaced; one copy,
 * so a new field cannot reach only some of them.
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
  // The one place the armed record is written: on the 2xx only, and not cleared on a refusal (see
  // `forgetArmedPush`). Here, because a re-pointed row is a new pair the record has to follow.
  if (response.ok) rememberArmedPush(subscription.endpoint, tripId);
  return { response, timezone };
}

/**
 * Point this browser's subscription row at `tripId`, after `syncTrip` replaced the id the row was
 * written with. `false` where the server refused or there is no subscription, and the caller then
 * switches push off; `true` where it was accepted, or a switch-off overtook it and nothing is left
 * to point at. Shared by `usePushSubscription`'s auto-sync and `adoptSharedPlan`.
 *
 * @param availableTopics what `GET /api/push` offers; fetched here when the caller lacks it.
 */
export async function repointPushSubscription(
  tripId: string,
  availableTopics?: readonly string[]
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    // Overtaken by a switch-off (`forgetTrip` cleared the id). Not left to the effect's cleanup,
    // which also runs on a remount and would drop a replacement still in flight.
    if (getTripId() !== tripId) return true;
    if (!subscription) return false;
    const topics = availableTopics ?? (await fetchAvailableTopics());
    if (!topics) return false;
    // Read now: the visitor may have narrowed the topics since the caller started.
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
