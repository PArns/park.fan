'use client';

/**
 * A local mirror of a browser's ride alerts and show follows — the same
 * shape as `lib/utils/favorites.ts`: read/write `localStorage`, dispatch a
 * custom event so every mounted bell re-checks itself, and never touch the
 * network from here.
 *
 * This is a CACHE for instant, hydration-safe rendering, not the source of
 * truth — Postgres is (`ride_alerts`/`show_follows`). It can drift (a
 * subscription the backend dropped after repeated failures leaves stale
 * entries here), which is an accepted, pre-existing class of staleness: the
 * trip planner's own "on" check has the identical property today. The
 * dialog and the overview page reconcile against the server on open; the
 * bells do not need to, since their only job is rendering the right initial
 * state without a network round trip.
 */

const SHOW_FOLLOWS_KEY = 'parkfan_show_follows';
const RIDE_ALERTS_KEY = 'parkfan_ride_alerts';
export const PUSH_FOLLOWS_CHANGED_EVENT = 'push-follows-changed';

export interface RideAlertLocal {
  attractionId: string;
  thresholdMinutes: number;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage off. Holds for this render, not worth more.
  }
  dispatchChanged();
}

function dispatchChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(PUSH_FOLLOWS_CHANGED_EVENT));
  } catch {
    // Nothing to recover — a listener missing one update is not worth a log.
  }
}

function readShowFollows(): string[] {
  const raw = readJson<unknown>(SHOW_FOLLOWS_KEY, []);
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

function readRideAlerts(): RideAlertLocal[] {
  const raw = readJson<unknown>(RIDE_ALERTS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is RideAlertLocal =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as RideAlertLocal).attractionId === 'string' &&
      typeof (entry as RideAlertLocal).thresholdMinutes === 'number'
  );
}

export function isShowFollowedLocal(showId: string): boolean {
  return readShowFollows().includes(showId);
}

export function setShowFollowedLocal(showId: string, followed: boolean): void {
  const current = readShowFollows();
  const has = current.includes(showId);
  if (followed === has) return;
  writeJson(
    SHOW_FOLLOWS_KEY,
    followed ? [...current, showId] : current.filter((id) => id !== showId)
  );
}

export function getRideAlertLocal(attractionId: string): RideAlertLocal | null {
  return readRideAlerts().find((entry) => entry.attractionId === attractionId) ?? null;
}

export function listRideAlertsLocal(): RideAlertLocal[] {
  return readRideAlerts();
}

export function setRideAlertLocal(attractionId: string, thresholdMinutes: number): void {
  const current = readRideAlerts();
  const next = current.filter((entry) => entry.attractionId !== attractionId);
  next.push({ attractionId, thresholdMinutes });
  writeJson(RIDE_ALERTS_KEY, next);
}

export function removeRideAlertLocal(attractionId: string): void {
  const current = readRideAlerts();
  if (!current.some((entry) => entry.attractionId === attractionId)) return;
  writeJson(
    RIDE_ALERTS_KEY,
    current.filter((entry) => entry.attractionId !== attractionId)
  );
}

/** Whether this browser has any local alert or follow at all — gates the "view all" link. */
export function hasAnyPushFollowsLocal(): boolean {
  return readShowFollows().length > 0 || readRideAlerts().length > 0;
}
