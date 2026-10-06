'use client';

/**
 * Which pairing the server last confirmed, since the toggle cannot read it off anything else: the
 * browser's one push subscription is shared with ride alerts and followed shows, a stored trip id
 * only proves a plan was uploaded once, and no endpoint answers which trip a subscription names.
 *
 * So this keeps the server's own 2xx, remembered against the exact pair it was given for, written
 * after the POST answers and nowhere else. A rotated endpoint or a replaced trip id no longer
 * matches, and the switch reads `off`. A pairing that dies on the server unannounced still reads
 * `on` until the next sync gets its 404. See docs/features/trip-planner.md#push-notifications.
 */

const ARMED_KEY = 'parkfan_push_armed';

/** The pair a `POST /api/push/subscriptions` was accepted for. */
export interface ArmedPush {
  endpoint: string;
  tripId: string;
}

/** What the server last confirmed, or `null`. Safe to call before mount. */
export function readArmedPush(): ArmedPush | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(ARMED_KEY);
  } catch {
    // A private window, or site data blocked: push does not work here, so "off".
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { endpoint, tripId } = parsed as Partial<ArmedPush>;
    // Anything but two non-empty strings is not a pairing.
    if (typeof endpoint !== 'string' || !endpoint) return null;
    if (typeof tripId !== 'string' || !tripId) return null;
    return { endpoint, tripId };
  } catch {
    return null;
  }
}

/**
 * Remember that the server accepted this endpoint for this trip. Called on the 2xx only, or the
 * record would be a guess again.
 */
export function rememberArmedPush(endpoint: string, tripId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ARMED_KEY, JSON.stringify({ endpoint, tripId }));
  } catch {
    // Nothing lost that matters: the switch reads `off` on the next mount, an understatement.
  }
}

/**
 * Drop the record, when switching off. The failure paths of switching on do not: the record
 * describes a pair, not an attempt, and a second tab may have armed the same pair.
 */
export function forgetArmedPush(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ARMED_KEY);
  } catch {
    // A storage that refuses reads as "nothing armed".
  }
}

/**
 * Whether the stored record covers exactly this pair, given the live endpoint and trip id, so a
 * mismatch on either side is `false`.
 */
export function pushIsArmedFor(
  endpoint: string | null | undefined,
  tripId: string | null | undefined
): boolean {
  if (!endpoint || !tripId) return false;
  const armed = readArmedPush();
  return armed !== null && armed.endpoint === endpoint && armed.tripId === tripId;
}
