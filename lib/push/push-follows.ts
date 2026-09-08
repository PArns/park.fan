'use client';

import { ensurePushRegistered, getExistingPushIdentity } from './push-registration';
import {
  removeRideAlertLocal,
  setRideAlertLocal,
  setShowFollowedLocal,
} from './push-follows-store';

/**
 * Following a show, and watching a ride's wait time — the two actions a bell
 * triggers. Each: reuse an existing subscription if this browser has one,
 * register a new one only if it does not (so a second bell on the same page
 * never re-prompts for permission), call the API, then update the local
 * mirror only once the server has confirmed it.
 */

export interface RideAlertRemote {
  attractionId: string;
  attractionName: string;
  attractionSlug: string;
  parkId: string;
  parkName: string;
  parkSlug: string;
  path: string | null;
  thresholdMinutes: number;
  armed: boolean;
  createdAt: string;
}

export interface ShowFollowRemote {
  showId: string;
  showName: string;
  showSlug: string;
  parkId: string;
  parkName: string;
  parkSlug: string;
  path: string | null;
  createdAt: string;
}

async function identityForWrite() {
  return (await getExistingPushIdentity()) ?? (await ensurePushRegistered());
}

export async function followShow(showId: string): Promise<boolean> {
  const identity = await identityForWrite();
  if (!identity) return false;
  try {
    const response = await fetch('/api/push/show-follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, showId }),
    });
    if (!response.ok) return false;
    setShowFollowedLocal(showId, true);
    return true;
  } catch {
    return false;
  }
}

/**
 * Optimistic, like `FavoriteStar`'s toggle: the local mirror clears
 * immediately, and the server call best-effort follows. A browser with no
 * subscription at all (never granted permission) has nothing to tell the
 * server in the first place.
 */
export async function unfollowShow(showId: string): Promise<void> {
  setShowFollowedLocal(showId, false);
  const identity = await getExistingPushIdentity();
  if (!identity) return;
  try {
    await fetch('/api/push/show-follows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, showId }),
    });
  } catch {
    // Local state already reflects the choice; a retry happens next open.
  }
}

export async function setRideAlert(
  attractionId: string,
  thresholdMinutes: number
): Promise<boolean> {
  const identity = await identityForWrite();
  if (!identity) return false;
  try {
    const response = await fetch('/api/push/ride-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, attractionId, thresholdMinutes }),
    });
    if (!response.ok) return false;
    setRideAlertLocal(attractionId, thresholdMinutes);
    return true;
  } catch {
    return false;
  }
}

export async function removeRideAlert(attractionId: string): Promise<void> {
  removeRideAlertLocal(attractionId);
  const identity = await getExistingPushIdentity();
  if (!identity) return;
  try {
    await fetch('/api/push/ride-alerts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: identity.endpoint, attractionId }),
    });
  } catch {
    // Same as unfollowShow — local state already moved.
  }
}

/** The server's list, for the dialog and the overview page to reconcile against. Empty, never thrown, when there is no subscription. */
export async function fetchRideAlertsRemote(): Promise<RideAlertRemote[]> {
  const identity = await getExistingPushIdentity();
  if (!identity) return [];
  try {
    const response = await fetch(
      `/api/push/ride-alerts?endpoint=${encodeURIComponent(identity.endpoint)}`,
      {
        cache: 'no-store',
      }
    );
    if (!response.ok) return [];
    return (await response.json()) as RideAlertRemote[];
  } catch {
    return [];
  }
}

export async function fetchShowFollowsRemote(): Promise<ShowFollowRemote[]> {
  const identity = await getExistingPushIdentity();
  if (!identity) return [];
  try {
    const response = await fetch(
      `/api/push/show-follows?endpoint=${encodeURIComponent(identity.endpoint)}`,
      {
        cache: 'no-store',
      }
    );
    if (!response.ok) return [];
    return (await response.json()) as ShowFollowRemote[];
  } catch {
    return [];
  }
}
