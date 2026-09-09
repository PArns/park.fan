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

// Cached by the raw string each was parsed from — same shape as
// `lib/utils/favorites.ts`'s `parseCache`. A park page mounts one
// `RideAlertBell`/`ShowFollowBell` per card, and one `PUSH_FOLLOWS_CHANGED_EVENT`
// makes every one of them re-read; without this, that was O(bells) JSON.parse
// + re-validation of the whole list per toggle. The cached arrays are treated
// as immutable — callers only ever read them or build a new array to write.
let showFollowsCache: { raw: string; data: ShowFollowLocal[] } | null = null;
let rideAlertsCache: { raw: string; data: RideAlertLocal[] } | null = null;

/**
 * A stored entry, in either shape this key has ever held.
 *
 * Until the panel's bells learned which performance they are about, an entry
 * was a bare show id. Those are still in every returning browser's storage and
 * mean what they always meant — the open-ended follow — so they read as
 * `startTime: null` rather than being thrown away. Anything else is skipped.
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
            typeof (entry as RideAlertLocal).thresholdMinutes === 'number'
        )
      : [];
    rideAlertsCache = { raw, data };
    return data;
  } catch {
    return [];
  }
}

/**
 * The follow this browser holds for a show, with the performance it is about.
 *
 * There is deliberately no `isShowFollowedLocal(showId)` beside this any more:
 * that question — "is this show followed at all" — is the one that lit every
 * row of an hourly show for a reminder about one of them, and a bare boolean
 * is what made it easy to ask by accident. `showFollowMatchesLocal(showId)`
 * still answers it for a caller that means the whole show.
 */
export function getShowFollowLocal(showId: string): ShowFollowLocal | null {
  return readShowFollows().find((entry) => entry.showId === showId) ?? null;
}

/**
 * Whether the follow this browser holds is the one a given bell is about.
 *
 * `startTime` omitted asks the open-ended question a show card's bell asks —
 * "is this show followed at all" — and is what every caller meant before the
 * column existed. Passed, it asks about ONE performance: a park panel lists
 * an hourly show once per showtime, and lighting all four of those bells for
 * a reminder that can only be about one of them is the bug this answers.
 *
 * A follow that named no performance still answers yes to every one of them,
 * because that is what it does: the API notifies before whichever comes next,
 * so a bell beside 14:00 with an open-ended follow behind it really is armed.
 * That also keeps every browser holding the old bare-string format rendering
 * exactly as it did.
 */
export function showFollowMatchesLocal(showId: string, startTime?: string | null): boolean {
  const entry = getShowFollowLocal(showId);
  if (!entry) return false;
  if (!startTime || entry.startTime === null) return true;
  return isSameInstant(entry.startTime, startTime);
}

/**
 * Whether two ISO strings name the same moment.
 *
 * Compared as instants and not as text, because one side has been sitting in
 * `localStorage` since some earlier visit and the other was just rendered: a
 * `+02:00` that comes back as `Z`, or a dropped `.000`, is the same
 * performance, and string equality would quietly unlight every stored pin the
 * day the API's serialization moves. An unparseable value matches nothing —
 * that is the honest answer for a mirror entry we cannot read.
 */
export function isSameInstant(a: string, b: string): boolean {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && left === right;
}

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
