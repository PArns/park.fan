'use client';

import { urlBase64ToUint8Array } from './vapid-key';

/**
 * Subscribing a browser to push, without a trip — for a ride alert or a
 * followed show. `lib/planner/use-push-subscription.ts` does the same job
 * for the trip planner, but that hook uploads a trip plan before it
 * subscribes and hard-requires a trip id; this feature has neither, so it is
 * a separate, small file rather than a refactor of one that is already
 * shipped and tested.
 *
 * The backend tells them apart the same way both stay compatible on one
 * browser: `POST /v1/push/subscriptions` only sets `tripId`/`topics` when the
 * caller sends them, never on omission (see `SubscribeInput`'s docstring on
 * the API) — so a ride alert set up here never disturbs a trip-planner
 * subscription the same browser already has, and vice versa.
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
 * Why a browser cannot be registered. Each one has a different remedy, and
 * telling them apart is the whole point: "that didn't work, please try again"
 * is a lie in front of `denied` (trying again does nothing until the visitor
 * changes a browser setting) and in front of `unsupported` (it will never
 * work here), and those two are exactly the cases a visitor hits most.
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
 * `GET /api/push`, memoized for the page's lifetime — every bell on a page
 * asks this.
 *
 * Only a SUCCESSFUL answer is memoized. Caching the failure too is what this
 * used to do (`??=` over a promise that resolved `{available:false}` on any
 * error), and it turned one unlucky request — a Cloudflare challenge on a
 * `no-store` fetch, a dropped connection, a cold start — into a page where
 * every bell was dead for as long as the tab stayed open: no further request,
 * no permission prompt, no error, nothing in the console. A visitor clicking
 * a second time got a silent no-op from a decision made once, invisibly.
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
 * "There is no subscription" and "we could not find out" — a distinction only
 * one caller needs, and it needs it badly.
 *
 * A removal reads this to decide whether the server can be holding anything
 * for this browser: no subscription means the local mirror entry is stale and
 * clearing it IS the removal. But `getRegistration()` can reject (storage
 * access refused, a partitioned context), and folding that into the same
 * `null` would report a removal as confirmed over an alert that is still
 * armed — the exact failure the delete path was rebuilt to stop reporting.
 */
export type PushIdentityLookup = { ok: true; identity: PushIdentity | null } | { ok: false };

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
 * This browser's existing subscription, without prompting for anything.
 * `null` covers "never subscribed", "browser cannot", "permission denied" and
 * "the lookup itself failed" alike — none of them are worth telling apart for
 * a WRITE, whose only use is deciding whether the action needs
 * `ensurePushRegistered` first or can call the API directly. A removal has no
 * such fallback and reads {@link lookupExistingPushIdentity} instead.
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

    // Registered only now, not on every page load — same reasoning as the
    // trip planner's own registration: a worker installed for everybody
    // would claim scope over the whole origin for a feature almost nobody
    // turns on. It is the SAME file either way, generic to both features.
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
    const response = await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: identity.endpoint,
        p256dh: identity.p256dh,
        auth: identity.auth,
        locale: document.documentElement.lang || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    if (!response.ok) {
      // Subscribed to a push service that will send nothing — undo rather
      // than leave it dangling, or the next attempt finds it and reports "on".
      await subscription.unsubscribe().catch(() => {});
      return { ok: false, cause: 'failed' };
    }

    return { ok: true, identity };
  } catch {
    return { ok: false, cause: 'failed' };
  }
}
