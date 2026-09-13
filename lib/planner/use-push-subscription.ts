'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  forgetTrip,
  getTripId,
  startTripAutoSync,
  stopTripAutoSync,
  syncTrip,
  type TripSyncError,
} from './trip-sync';
import { plannerPushTopics, resolvePushTopics } from './push-topics';
import { hasAnyPushFollowsLocal } from '../push/push-follows-store';
import { urlBase64ToUint8Array } from '../push/vapid-key';

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
  /**
   * Why switching off did not go through, or `null`.
   *
   * Only the stored plan's DELETE can refuse in a way the visitor has to hear
   * about: it is the one step that leaves something of theirs on a server, and
   * the switch stays ON when it fails, which needs a reason beside it. The class
   * is carried rather than a boolean so the sentence can grow a limiter's window
   * once one reaches the client (PAR-146).
   */
  const [deleteError, setDeleteError] = useState<TripSyncError | null>(null);
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
    setDeleteError(null);

    /**
     * Whether this attempt CREATED the row on the server.
     *
     * Everything after the upload can still fail, and every one of those paths
     * ends at `off` — where a plan this attempt put there may not be left
     * standing, because the whole feature's rule is that the plan is on the
     * server only while push is on.
     *
     * Created, not uploaded: `syncTrip` re-uses a stored trip id, and a trip
     * that was already there is not this attempt's to delete. A second tab with
     * push on shares that id through `localStorage`, so rolling back on every
     * successful sync would take down the plan a live subscription is pointing
     * at. The id before the sync is what tells the two apart.
     */
    const before = getTripId();
    let created = false;

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
      const stored = await syncTrip();
      if (!stored.ok) {
        setState('off');
        return;
      }
      const tripId = stored.id;
      // A different id than before (or none before) means the POST ran.
      created = before !== tripId;

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
        //
        // Under the same guard `disable()` uses, and for the same reason: the
        // browser has ONE push subscription for the whole origin, and the line
        // above may well have found it rather than created it (a ride alert
        // arms the very same one). Unsubscribing unconditionally here took
        // every armed alert and followed show down with a failed POST.
        if (!hasAnyPushFollowsLocal()) {
          await subscription.unsubscribe().catch(() => {});
        }
        if (created) await forgetTrip();
        setState('off');
        return;
      }

      setState('on');
    } catch {
      // Anywhere between the create and the last line: the plan goes with it.
      // A refused DELETE keeps the id (`forgetTrip`), which is right here too —
      // the next attempt resumes that trip rather than stranding it.
      if (created) await forgetTrip();
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

  /**
   * Switching off, and why the stored plan goes first.
   *
   * It is the only step that can refuse, and the only one whose failure leaves
   * something behind: the id is the credential and this browser holds the sole
   * copy, so a plan not deleted before the id is forgotten is unreachable to its
   * owner for the rest of its 400 days. Running it first means a refusal finds
   * nothing torn down — the switch stays on, the id stays, and pressing again is
   * a real retry.
   *
   * The other order was worse than it looks. With the DELETE at the end, a
   * refusal would leave the id (which it must) on a browser whose subscription
   * had already been dismantled — and where another ride alert keeps that
   * subscription alive, `resolve()` reads `existing && getTripId()` on the next
   * mount and brings the switch back as ON with nothing behind it, which is the
   * one thing this feature does not do.
   */
  const disable = useCallback(async () => {
    setState('working');
    setDeleteError(null);

    // Read before the delete forgets it: the scoped unsubscribe below needs it.
    const tripId = getTripId();
    const forgotten = await forgetTrip();
    if (!forgotten.ok) {
      setDeleteError(forgotten.error);
      setState('on');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Tell the server first, while the endpoint is still readable. The
        // other order leaves a row that only stops being sent to after eight
        // failed deliveries.
        //
        // Scoped to this trip: the same endpoint is one row shared with a
        // ride alert or a followed show, and an unscoped delete cascades
        // through the FK and takes those down too. Sending `tripId` tells
        // the API to clear only the trip half of the row — and with no local
        // tripId there is nothing of this feature's left on the server to
        // clear, so the call is skipped rather than sent unscoped (which
        // would read as "forget the browser entirely" and cascade anyway).
        //
        // Still sent after the trip's own DELETE, which clears the same two
        // columns on every subscription pointing at it: that one ran only on
        // the 204 path, and on the 404 path — a trip already expired or swept —
        // nothing has cleared this row. `PushService.unsubscribe` matches on
        // (endpoint, tripId), so where the DELETE did clear it this is a no-op
        // rather than a second, wider action.
        if (tripId) {
          await fetch('/api/push/subscriptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint, tripId }),
          }).catch(() => {});
        }
        // The browser has exactly ONE push subscription for the whole origin
        // (`lib/push/push-registration.ts` reuses it for ride alerts and
        // followed shows) — tearing it down here would silently stop those
        // too. Only do it when nothing else on this browser still needs it.
        if (!hasAnyPushFollowsLocal()) {
          await subscription.unsubscribe().catch(() => {});
        }
      }
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
    /** Why the last attempt to switch off was refused, or `null`. */
    deleteError,
    /** What this deploy can send. Empty until `/api/push` has answered. */
    availableTopics: availability?.topics ?? [],
    /** The visitor's narrowing, or `null` for "everything above". */
    selectedTopics,
  };
}
