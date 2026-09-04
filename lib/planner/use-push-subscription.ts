'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { forgetTrip, getTripId, startTripAutoSync, stopTripAutoSync, syncTrip } from './trip-sync';
import { plannerPushTopics, resolvePushTopics } from './push-topics';

/**
 * Turning notifications on, and everything that has to be true for that to mean
 * anything.
 *
 * Four things have to line up before a visitor sees a banner, and each one fails
 * differently, so the state here is a union rather than a boolean: the browser
 * has to support push at all, this DEPLOY has to have a VAPID keypair, the
 * visitor has to grant permission, and their plan has to reach the server the
 * notification job reads.
 *
 * The rule the whole feature is built around: **never show a switch that turns
 * on and does nothing.** So `unsupported` and `unavailable` hide the control
 * rather than disabling it, `denied` explains instead of offering, and the
 * subscribe path stores the plan BEFORE it subscribes — a subscription against
 * a trip that does not exist is exactly the silent failure this avoids.
 */

export type PushState =
  /** Still asking the deploy whether push works here. */
  | 'checking'
  /** This browser has no push. Nothing to offer. */
  | 'unsupported'
  /** This deploy has no VAPID keypair. Nothing to offer. */
  | 'unavailable'
  /** Offerable, and off. */
  | 'off'
  /** The visitor said no. The browser will not ask again from here. */
  | 'denied'
  /** In flight. */
  | 'working'
  /** On. */
  | 'on';

interface PushAvailability {
  available: boolean;
  publicKey?: string;
  topics: string[];
}

export function usePushSubscription() {
  const [state, setState] = useState<PushState>('checking');
  const [availability, setAvailability] = useState<PushAvailability | null>(null);
  const selectedTopics = useSyncExternalStore(
    plannerPushTopics.subscribe,
    plannerPushTopics.getSnapshot,
    plannerPushTopics.getServerSnapshot
  );

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        if (!cancelled) setState('unsupported');
        return;
      }

      // The deploy's answer, before anything is offered. An unconfigured API
      // would otherwise let somebody grant permission for a notification that
      // can never be sent — a permission prompt spent on nothing, and the
      // browser does not ask twice.
      let info: PushAvailability;
      try {
        const response = await fetch('/api/push', { cache: 'no-store' });
        info = response.ok
          ? ((await response.json()) as PushAvailability)
          : { available: false, topics: [] };
      } catch {
        info = { available: false, topics: [] };
      }
      if (cancelled) return;

      if (!info.available || !info.publicKey) {
        setState('unavailable');
        return;
      }
      setAvailability(info);

      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }

      // Already subscribed? Only counts if this browser ALSO still knows which
      // trip it subscribed for — a subscription whose local trip id is gone
      // cannot be updated when the plan changes, so it is not "on".
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const existing = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      setState(existing && getTripId() ? 'on' : 'off');
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!availability?.publicKey) return;
    setState('working');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      // The plan goes up FIRST. The API refuses a subscription against a trip
      // it does not have, and the order matters for the failure too: a plan
      // stored with no subscription is a row that expires, while a subscription
      // with no plan is a switch that is on and does nothing.
      const tripId = await syncTrip();
      if (!tripId) {
        setState('off');
        return;
      }

      // Registered only now, not on every page load: a worker installed for
      // everybody would claim scope over the whole origin for a feature almost
      // nobody turns on.
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Required by every browser, and it is the honest setting: a push
          // this app receives without showing a notification would be a
          // background channel the visitor did not agree to.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(availability.publicKey),
        }));

      const json = subscription.toJSON();
      const response = await fetch('/api/push/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          tripId,
          locale: document.documentElement.lang || 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          topics: resolvePushTopics(availability.topics, selectedTopics),
        }),
      });

      if (!response.ok) {
        // The browser is now subscribed to a push service that will send it
        // nothing. Undo it rather than leaving a dangling subscription — the
        // next attempt would otherwise find one and report "on".
        await subscription.unsubscribe().catch(() => {});
        setState('off');
        return;
      }

      setState('on');
    } catch {
      setState('off');
    }
  }, [availability, selectedTopics]);

  /**
   * Change which kinds are wanted, without a second permission prompt.
   *
   * A re-POST of the same endpoint rather than an unsubscribe and a resubscribe:
   * the push service's endpoint is what identifies the row, so the API updates
   * it in place, and tearing the browser subscription down to change a checkbox
   * would risk landing in `denied` on a browser that re-prompts.
   *
   * Written down first and sent second, so a failed request leaves the choice
   * visible rather than snapping a box back with no explanation — the next
   * successful sync carries it.
   */
  const setTopics = useCallback(
    async (topics: readonly string[]) => {
      plannerPushTopics.set(topics);
      if (state !== 'on' || !availability) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const subscription = await registration?.pushManager.getSubscription();
        const tripId = getTripId();
        if (!subscription || !tripId) return;
        const json = subscription.toJSON();
        await fetch('/api/push/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
            tripId,
            locale: document.documentElement.lang || 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            topics: resolvePushTopics(availability.topics, topics),
          }),
        });
      } catch {
        // The choice is stored either way; the next `enable` or plan sync
        // carries it up. Nothing here is worth a message.
      }
    },
    [availability, state]
  );

  const disable = useCallback(async () => {
    setState('working');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Tell the server first, while the endpoint is still readable. The
        // other order leaves a row that only stops being sent to after eight
        // failed deliveries.
        await fetch('/api/push/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
        await subscription.unsubscribe().catch(() => {});
      }
      forgetTrip();
    } finally {
      setState('off');
    }
  }, []);

  // The half of push with no UI: while it is on, every edit to the plan has to
  // reach the server, or the job keeps notifying about the plan as it was when
  // the switch was flipped. Armed here rather than at each mutation, because
  // there are eleven of them and the twelfth would be the one that forgot.
  useEffect(() => {
    if (state !== 'on') return;
    startTripAutoSync();
    return () => stopTripAutoSync();
  }, [state]);

  return {
    state,
    enable,
    disable,
    setTopics,
    /** What this deploy can send. Empty until `/api/push` has answered. */
    availableTopics: availability?.topics ?? [],
    /** The visitor's narrowing, or `null` for "everything above". */
    selectedTopics,
  };
}

/**
 * The VAPID public key as the bytes `pushManager.subscribe` wants.
 *
 * It arrives base64url — no padding, `-` and `_` for `+` and `/` — and
 * `atob` understands neither, so this is a translation and not a formality:
 * skip it and `subscribe()` rejects with a key it cannot parse.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  // The buffer is allocated explicitly so the type is `ArrayBuffer` and not
  // `ArrayBufferLike`: `applicationServerKey` will not take a view that might
  // be over a `SharedArrayBuffer`, and `new Uint8Array(length)` is exactly that
  // to the type checker.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
