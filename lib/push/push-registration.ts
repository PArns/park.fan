'use client';

import { urlBase64ToUint8Array } from './vapid-key';
import { currentPushTimezone, rememberSentPushTimezone } from './push-timezone';

/**
 * Subscribing a browser to push without a trip, for a ride alert or a followed show;
 * `lib/planner/use-push-subscription.ts` does the same for the trip planner and requires a trip.
 * Both stay compatible on one browser: `POST /v1/push/subscriptions` only sets `tripId`/`topics`
 * when the caller sends them, so neither disturbs the other's subscription.
 */

interface PushAvailability {
  available: boolean;
  publicKey?: string;
}

export interface PushIdentity {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Why a browser cannot be registered. Each has a different remedy: "please try again" is a lie
 * in front of `denied` (only a browser setting helps) and `unsupported` (it never will), the two
 * cases a visitor hits most.
 */
export type PushUnavailableCause =
  /** No service worker / PushManager / Notification — an insecure origin, or a browser without them. */
  | 'unsupported'
  /** `GET /api/push` did not answer. Transient: worth retrying. */
  | 'probe-failed'
  /** The API answered, and this deploy has no VAPID key — nothing a visitor can do. */
  | 'not-configured'
  /** Notifications are blocked for this origin, or globally in the browser's settings. */
  | 'denied'
  /** The prompt was shown and closed without a decision. */
  | 'dismissed'
  /** Subscribing itself failed, or the API refused the subscription. */
  | 'failed';

export type PushRegistration =
  { ok: true; identity: PushIdentity } | { ok: false; cause: PushUnavailableCause };

let availabilityPromise: Promise<PushAvailability | null> | null = null;

/**
 * `GET /api/push`, memoized for the page's lifetime because every bell asks. Only a successful
 * answer is memoized: a cached failure would leave every bell on the page silently dead for as
 * long as the tab stays open.
 */
function fetchAvailability(): Promise<PushAvailability | null> {
  availabilityPromise ??= fetch('/api/push', { cache: 'no-store' })
    .then((response) => (response.ok ? (response.json() as Promise<PushAvailability>) : null))
    .catch(() => null)
    .then((info) => {
      if (!info) availabilityPromise = null;
      return info;
    });
  return availabilityPromise;
}

function supportsPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * "There is no subscription" and "we could not find out", kept apart: a removal treats no
 * subscription as nothing to delete and a list fetcher as no alerts, so a lookup that threw
 * (storage access refused, a partitioned context) must read as neither.
 */
export type PushIdentityLookup = { ok: true; identity: PushIdentity | null } | { ok: false };

/** Reads this browser's push subscription without prompting; `{ ok: false }` when that fails. */
export async function lookupExistingPushIdentity(): Promise<PushIdentityLookup> {
  // Not a failure: a browser without push cannot be holding a subscription.
  if (!supportsPush()) return { ok: true, identity: null };
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return { ok: true, identity: null };
    const json = subscription.toJSON();
    if (!json.keys?.p256dh || !json.keys?.auth) return { ok: true, identity: null };
    return {
      ok: true,
      identity: { endpoint: subscription.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    };
  } catch {
    return { ok: false };
  }
}

/**
 * This browser's existing subscription without prompting, `null` for every reason there is none,
 * a failed lookup included. Only a write may use that fallback, to decide whether it must register
 * first; removals and list fetchers read {@link lookupExistingPushIdentity}.
 */
export async function getExistingPushIdentity(): Promise<PushIdentity | null> {
  const lookup = await lookupExistingPushIdentity();
  return lookup.ok ? lookup.identity : null;
}

/**
 * Subscribe this browser, or reuse its existing subscription. Never throws —
 * a failure is reported as a {@link PushUnavailableCause} rather than as a
 * bare `null`, because the four ways this can fail need four different
 * sentences in front of a visitor.
 */
export async function ensurePushRegistered(): Promise<PushRegistration> {
  if (!supportsPush()) return { ok: false, cause: 'unsupported' };

  const info = await fetchAvailability();
  if (!info) return { ok: false, cause: 'probe-failed' };
  if (!info.available || !info.publicKey) return { ok: false, cause: 'not-configured' };
  if (Notification.permission === 'denied') return { ok: false, cause: 'denied' };

  try {
    const permission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    // A browser set to "don't allow sites to ask" resolves this to `denied`
    // WITHOUT ever showing a prompt, which is why that reads as blocked here
    // and not as a dismissal: the visitor saw nothing to dismiss.
    if (permission === 'denied') return { ok: false, cause: 'denied' };
    if (permission !== 'granted') return { ok: false, cause: 'dismissed' };

    // Registered only now, not on every page load: a worker installed for everybody would claim
    // scope over the whole origin for a feature almost nobody turns on. `push-timezone.ts` runs on
    // every load but only reads an existing registration.
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(info.publicKey),
      }));

    const json = subscription.toJSON();
    if (!json.keys?.p256dh || !json.keys?.auth) return { ok: false, cause: 'failed' };
    const identity: PushIdentity = {
      endpoint: subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    };

    // No tripId, no topics: this call is not about the trip planner, and
    // omitting both leaves whatever this endpoint already has for them
    // untouched (see the module docstring).
    const timezone = currentPushTimezone();
    const response = await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: identity.endpoint,
        p256dh: identity.p256dh,
        auth: identity.auth,
        locale: document.documentElement.lang || 'en',
        ...(timezone ? { timezone } : {}),
      }),
    });

    if (!response.ok) {
      // Subscribed to a push service that will send nothing — undo rather
      // than leave it dangling, or the next attempt finds it and reports "on".
      await subscription.unsubscribe().catch(() => {});
      return { ok: false, cause: 'failed' };
    }

    // Recorded only on a 2xx, so the next page load compares against a zone the server took.
    if (timezone) rememberSentPushTimezone(identity.endpoint, timezone);

    return { ok: true, identity };
  } catch {
    return { ok: false, cause: 'failed' };
  }
}
