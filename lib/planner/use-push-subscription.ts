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
import { forgetArmedPush, pushIsArmedFor } from './push-arming';
import { postSubscription, repointPushSubscription } from './push-repoint';
import { plannerPushTopics, resolvePushTopics } from './push-topics';
import { hasAnyPushFollowsLocal } from '../push/push-follows-store';
import { rememberSentPushTimezone } from '../push/push-timezone';
import { urlBase64ToUint8Array } from '../push/vapid-key';

/**
 * Turning notifications on, and everything that has to be true for that to mean anything: browser
 * support, a VAPID keypair on this deploy, the visitor's permission, and their plan on the server.
 *
 * Never show a switch that turns on and does nothing: `unsupported` and `unavailable` hide the
 * control, `denied` explains, and the plan is stored before subscribing. See
 * docs/features/trip-planner.md#push-notifications.
 */

/** Where the push switch stands; each state fails differently, so it is a union. */
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

/**
 * State and actions of the planner's push notification switch: support and VAPID check, enable
 * (store the plan, then subscribe), disable, and topic choice.
 */
export function usePushSubscription() {
  const [state, setState] = useState<PushState>('checking');
  const [availability, setAvailability] = useState<PushAvailability | null>(null);
  /**
   * Why switching off did not go through, or `null`. Only the stored plan's DELETE can fail in a
   * way the visitor must hear about, since the switch stays on. A class rather than a boolean, so
   * the sentence can grow a limiter's window later.
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

      // The deploy's answer before anything is offered, or a permission prompt could be spent on a
      // notification that can never be sent; the browser does not ask twice.
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

      // "On" is a statement about the server, which neither the origin-wide browser subscription
      // nor a stored trip id makes. So the pairing the server accepted is asked (`push-arming.ts`),
      // and both halves must still match the live values.
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const existing = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      setState(pushIsArmedFor(existing?.endpoint, getTripId()) ? 'on' : 'off');
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
     * Whether this attempt created the row on the server, so a later failure can take the plan down
     * again: the plan is on the server only while push is on. Created, not uploaded: a trip id
     * another tab already stored is not this attempt's to delete, so the id is read after the
     * permission prompt, which can stay open for minutes.
     */
    let created = false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      // The plan goes up first: the API refuses a subscription against a trip it does not have, and
      // a plan with no subscription expires, while a subscription with no plan is a dead switch.
      const before = getTripId();
      const stored = await syncTrip();
      if (!stored.ok) {
        setState('off');
        return;
      }
      const tripId = stored.id;
      // A different id than before, or none before, means the POST ran.
      created = before !== tripId;

      // Registered only now: a worker installed on every page load would claim the whole origin for
      // a feature almost nobody turns on.
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Required by every browser, and honest: a silent push would be a background channel the
          // visitor did not agree to.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(availability.publicKey),
        }));

      const { response, timezone } = await postSubscription(
        subscription,
        tripId,
        resolvePushTopics(availability.topics, selectedTopics)
      );

      if (!response.ok) {
        // The browser is subscribed to a service that will send it nothing, so undo it, or the next
        // attempt finds it and reports "on". Under `disable()`'s guard: the origin has one push
        // subscription, shared with ride alerts and followed shows.
        if (!hasAnyPushFollowsLocal()) {
          await subscription.unsubscribe().catch(() => {});
        }
        if (created) await forgetTrip();
        setState('off');
        return;
      }

      // The zone the API just took, so `refreshPushTimezone` sends nothing until it changes.
      if (timezone) rememberSentPushTimezone(subscription.endpoint, timezone);
      setState('on');
    } catch {
      // Anywhere after the create, the plan goes too. A refused DELETE keeps the id (`forgetTrip`),
      // so the next attempt resumes that trip.
      if (created) await forgetTrip();
      setState('off');
    }
  }, [availability, selectedTopics]);

  /**
   * Change which kinds are wanted, without a second permission prompt: a re-POST of the same
   * endpoint, which the API updates in place. Stored first and sent second, so a failed request
   * leaves the choice visible and the next sync carries it.
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
        const { response, timezone } = await postSubscription(
          subscription,
          tripId,
          resolvePushTopics(availability.topics, topics)
        );
        // Only on a 2xx, or the next page load would not resend a zone the API never got.
        if (response.ok && timezone) rememberSentPushTimezone(subscription.endpoint, timezone);
      } catch {
        // The choice is stored either way; the next `enable` or plan sync carries it.
      }
    },
    [availability, state]
  );

  /**
   * Switching off: the stored plan goes first, and the switch goes off either way.
   *
   * First, because the trip id is the credential and this browser holds the only copy, so a plan
   * not deleted before the id is forgotten is unreachable to its owner. Either way, because a
   * visitor who asked for notifications to stop must not keep getting them while the API is down.
   * Only the deletion is reported as unfinished, and the next switch-off retries it.
   */
  const disable = useCallback(async () => {
    setState('working');
    setDeleteError(null);

    // Read before the delete forgets it: the scoped unsubscribe below needs it.
    const tripId = getTripId();
    const forgotten = await forgetTrip();
    setDeleteError(forgotten.ok ? null : forgotten.error);

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Tell the server first, while the endpoint is still readable. Scoped to this trip: the
        // endpoint's row is shared with ride alerts and followed shows, and an unscoped delete
        // cascades through them. Without a local trip id there is nothing of ours to clear. Still
        // sent after the trip's DELETE, which clears the row only on a 204.
        if (tripId) {
          await fetch('/api/push/subscriptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint, tripId }),
          }).catch(() => {});
        }
        // The origin has one push subscription, also used by ride alerts and followed shows
        // (`lib/push/push-registration.ts`), so it is only torn down when nothing else needs it.
        if (!hasAnyPushFollowsLocal()) {
          await subscription.unsubscribe().catch(() => {});
        }
      }
    } finally {
      // The armed record follows the switch, not what the server managed, or the next mount would
      // turn it back on for a visitor who asked it to stop.
      forgetArmedPush();
      setState('off');
    }
  }, []);

  // While push is on, every plan edit has to reach the server; armed here rather than at each of
  // the store's mutations. Also where a trip id replaced by the background sync is re-pointed on
  // the subscription row, and the switch goes off if that fails, the same rule as `enable()`.
  useEffect(() => {
    if (state !== 'on' || !availability) return;
    startTripAutoSync((tripId) => {
      void (async () => {
        const repointed = await repointPushSubscription(tripId, availability.topics);
        // Not re-pointed, so the switch would be on and doing nothing: off, with the plan.
        if (!repointed && getTripId() === tripId) void disable();
      })();
    });
    return () => stopTripAutoSync();
  }, [state, availability, disable]);

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
