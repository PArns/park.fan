'use client';

/**
 * A local mirror of a browser's ride alerts and show follows, shaped like
 * `lib/utils/favorites.ts`: `localStorage`, a custom event so every mounted bell
 * re-checks itself, and no network. A cache for instant, hydration-safe
 * rendering, not the source of truth; it can drift, so the dialog and the
 * overview page reconcile against the server on open.
 */

const SHOW_FOLLOWS_KEY = 'parkfan_show_follows';
const RIDE_ALERTS_KEY = 'parkfan_ride_alerts';
export const PUSH_FOLLOWS_CHANGED_EVENT = 'push-follows-changed';

/** `RideAlertRemote.kind` of an alert that fires when a ride opens, not on a wait time. */
export type RideAlertKind = 'reopen';

export interface RideAlertLocal {
  attractionId: string;
  /** `null` for a reopen alert, which has no threshold. */
  thresholdMinutes: number | null;
  /**
   * Absent or `null` is the wait-time alert, which is also every entry written before the
   * reopen kind existed.
   */
  kind?: RideAlertKind | null;
}

/**
 * One followed show, and WHICH of its performances the reminder is for.
 *
 * `startTime` is `null` for the open-ended follow — "whichever performance is
 * next", which is what a show card's bell files and what the API stores as a
 * null column. Otherwise a full ISO instant, naming one performance on one
 * day; it is compared as an instant (`isSameInstant`), never as text.
 *
 * The API allows exactly one row per (subscription, show) and its upsert
 * overwrites `startTime`, so this list holds at most one entry per show too.
 */
export interface ShowFollowLocal {
  showId: string;
  startTime: string | null;
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

// Cached by the raw string each was parsed from: one change event makes every bell on a park page
// re-read. The cached arrays are treated as immutable; callers build a new array to write.
let showFollowsCache: { raw: string; data: ShowFollowLocal[] } | null = null;
let rideAlertsCache: { raw: string; data: RideAlertLocal[] } | null = null;

/**
 * A stored entry in either shape this key has held: a bare show id (the older format, meaning the
 * open-ended follow) or `{ showId, startTime }`. Anything else is skipped.
 */
export function parseShowFollowEntry(entry: unknown): ShowFollowLocal | null {
  if (typeof entry === 'string') return { showId: entry, startTime: null };
  if (typeof entry !== 'object' || entry === null) return null;
  const { showId, startTime } = entry as { showId?: unknown; startTime?: unknown };
  if (typeof showId !== 'string') return null;
  return { showId, startTime: typeof startTime === 'string' ? startTime : null };
}

function readShowFollows(): ShowFollowLocal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SHOW_FOLLOWS_KEY);
    if (raw === null) {
      showFollowsCache = null;
      return [];
    }
    if (showFollowsCache && showFollowsCache.raw === raw) return showFollowsCache.data;
    const parsed: unknown = JSON.parse(raw);
    const data = Array.isArray(parsed)
      ? parsed.map(parseShowFollowEntry).filter((entry): entry is ShowFollowLocal => entry !== null)
      : [];
    showFollowsCache = { raw, data };
    return data;
  } catch {
    return [];
  }
}

function readRideAlerts(): RideAlertLocal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RIDE_ALERTS_KEY);
    if (raw === null) {
      rideAlertsCache = null;
      return [];
    }
    if (rideAlertsCache && rideAlertsCache.raw === raw) return rideAlertsCache.data;
    const parsed: unknown = JSON.parse(raw);
    const data = Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is RideAlertLocal =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as RideAlertLocal).attractionId === 'string' &&
            ((entry as RideAlertLocal).kind === 'reopen' ||
              typeof (entry as RideAlertLocal).thresholdMinutes === 'number')
        )
      : [];
    rideAlertsCache = { raw, data };
    return data;
  } catch {
    return [];
  }
}

/**
 * The follow this browser holds for a show, with the performance it is about. No boolean
 * "is this show followed" sits beside it on purpose: that question lit every showtime's bell for
 * a reminder about one of them. `showFollowMatchesLocal(showId)` asks it for the whole show.
 */
export function getShowFollowLocal(showId: string): ShowFollowLocal | null {
  return readShowFollows().find((entry) => entry.showId === showId) ?? null;
}

/**
 * Whether the follow this browser holds is the one a given bell is about. Without `startTime` it
 * asks whether the show is followed at all; with it, about one performance, since a park panel
 * lists an hourly show once per showtime. An open-ended follow answers yes for every performance,
 * because the API notifies before whichever comes next.
 */
export function showFollowMatchesLocal(showId: string, startTime?: string | null): boolean {
  const entry = getShowFollowLocal(showId);
  if (!entry) return false;
  if (!startTime || entry.startTime === null) return true;
  return isSameInstant(entry.startTime, startTime);
}

/**
 * Whether two ISO strings name the same moment, compared as instants and not as text: a stored
 * `+02:00` that comes back as `Z` is the same performance. An unparseable value matches nothing.
 */
export function isSameInstant(a: string, b: string): boolean {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && left === right;
}

/** Records or clears this browser's follow of a show, with the performance it is for. */
export function setShowFollowedLocal(
  showId: string,
  followed: boolean,
  startTime: string | null = null
): void {
  const current = readShowFollows();
  const existing = current.find((entry) => entry.showId === showId) ?? null;
  if (followed) {
    if (existing && existing.startTime === startTime) return;
    writeJson(SHOW_FOLLOWS_KEY, [
      ...current.filter((entry) => entry.showId !== showId),
      { showId, startTime },
    ]);
    return;
  }
  if (!existing) return;
  writeJson(
    SHOW_FOLLOWS_KEY,
    current.filter((entry) => entry.showId !== showId)
  );
}

/**
 * Brings this browser's entry for one show in line with a list the server really returned
 * (`PushListResult` with `ok: true`): a missing show's entry goes, a present one takes the
 * server's `startTime`. Every other show's entry is left alone.
 */
export function reconcileShowFollowLocal(
  showId: string,
  remoteItems: ReadonlyArray<{ showId: string; startTime: string | null }>
): void {
  const remote = remoteItems.find((item) => item.showId === showId);
  if (!remote) {
    setShowFollowedLocal(showId, false);
    return;
  }
  setShowFollowedLocal(showId, true, remote.startTime ?? null);
}

/** This browser's alert for a ride in the local mirror, or null. */
export function getRideAlertLocal(attractionId: string): RideAlertLocal | null {
  return readRideAlerts().find((entry) => entry.attractionId === attractionId) ?? null;
}

/** Every ride alert in this browser's local mirror. */
export function listRideAlertsLocal(): RideAlertLocal[] {
  return readRideAlerts();
}

/** One entry per ride, whichever kind: setting one kind replaces the other, as the API does. */
export function setRideAlertLocal(
  attractionId: string,
  thresholdMinutes: number | null,
  kind: RideAlertKind | null = null
): void {
  const current = readRideAlerts();
  const next = current.filter((entry) => entry.attractionId !== attractionId);
  next.push(
    kind === 'reopen'
      ? { attractionId, thresholdMinutes: null, kind }
      : {
          attractionId,
          thresholdMinutes,
        }
  );
  writeJson(RIDE_ALERTS_KEY, next);
}

/** Removes a ride's alert from the local mirror. */
export function removeRideAlertLocal(attractionId: string): void {
  const current = readRideAlerts();
  if (!current.some((entry) => entry.attractionId === attractionId)) return;
  writeJson(
    RIDE_ALERTS_KEY,
    current.filter((entry) => entry.attractionId !== attractionId)
  );
}

/**
 * How many local alerts and follows this browser has.
 *
 * A size hint, not an inventory: the favorites menu uses it to decide whether asking the server
 * is worth two requests, and to reserve that many skeleton rows while the answer is on its way.
 * What is actually SET is what the server says — see `usePushFollowsList`.
 */
export function countPushFollowsLocal(): number {
  return readShowFollows().length + readRideAlerts().length;
}

/** Whether this browser has any local alert or follow at all — gates the "view all" link. */
export function hasAnyPushFollowsLocal(): boolean {
  return countPushFollowsLocal() > 0;
}
