'use client';

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

let availabilityPromise: Promise<PushAvailability> | null = null;

/** `GET /api/push`, cached for the page's lifetime — every bell on a page asks this. */
function fetchAvailability(): Promise<PushAvailability> {
  availabilityPromise ??= fetch('/api/push', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : { available: false }))
    .catch(() => ({ available: false }));
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
 * This browser's existing subscription, without prompting for anything.
 * `null` covers "never subscribed", "browser cannot", and "permission
 * denied" alike — none of them are worth telling apart here, since the only
 * use is deciding whether a follow/alert action needs `ensurePushRegistered`
 * first or can call the API directly.
 */
export async function getExistingPushIdentity(): Promise<PushIdentity | null> {
  if (!supportsPush()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return null;
    const json = subscription.toJSON();
    if (!json.keys?.p256dh || !json.keys?.auth) return null;
    return { endpoint: subscription.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
  } catch {
    return null;
  }
}

/**
 * Subscribe this browser, or reuse its existing subscription. `null` means
 * the caller should not proceed — unsupported browser, this deploy has no
 * VAPID key, or the visitor said no. Never throws.
 */
export async function ensurePushRegistered(): Promise<PushIdentity | null> {
  if (!supportsPush()) return null;

  const info = await fetchAvailability();
  if (!info.available || !info.publicKey) return null;
  if (Notification.permission === 'denied') return null;

  try {
    const permission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') return null;

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
    if (!json.keys?.p256dh || !json.keys?.auth) return null;
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
      return null;
    }

    return identity;
  } catch {
    return null;
  }
}

/**
 * The VAPID public key as the bytes `pushManager.subscribe` wants.
 *
 * Duplicated from `lib/planner/use-push-subscription.ts` rather than
 * imported — seven lines, and importing it would couple this feature's
 * subscribe path to the planner's module for a pure base64 translation with
 * nothing planner-specific in it.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
