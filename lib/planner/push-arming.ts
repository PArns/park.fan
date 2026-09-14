'use client';

/**
 * Which pairing the server last confirmed, and why the switch cannot be read
 * off anything else.
 *
 * The question the toggle has to answer on mount is narrow: **is THIS browser's
 * push subscription armed on the server for THIS trip?** Neither half of that
 * is visible locally. The browser holds one push subscription for the whole
 * origin (`lib/push/push-registration.ts` shares it with ride alerts and
 * followed shows), so its presence only proves that something on this site uses
 * push; and a stored trip id only proves that a plan was uploaded at some
 * point. The link between the two is made by `POST /api/push/subscriptions`,
 * and that is precisely the step that can fail — a network hiccup after the
 * plan was stored leaves both halves standing with nothing joining them, and
 * `existing && getTripId()` read that as "on" for ever after (PAR-177).
 *
 * There is no read to ask instead: `/v1/push/subscriptions` answers `POST` and
 * `DELETE` and nothing else, and the two push GETs that do exist list a
 * browser's ride alerts and followed shows without ever naming the
 * subscription's `tripId`. So what is kept here is the next best thing and not
 * the same thing as the old guess — **the server's own 2xx, remembered against
 * the exact pair it was given for.** It is written after the POST answers and
 * nowhere else.
 *
 * Both halves expire the record by themselves, which is what makes it worth
 * more than a boolean: a push service that rotates the endpoint, or a trip that
 * 404s and is replaced by a fresh id, no longer matches, and the switch reads
 * `off` — which is the honest answer in both cases, since the subscription the
 * server holds is then pointing at something this browser no longer has.
 *
 * What it cannot see is a pairing that dies on the server with nobody telling
 * this browser (a swept or expired trip). That reads `on` until the next sync
 * gets its 404; the dangling reference behind it is PAR-131 and is older than
 * this file.
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
    // A private window, or site data blocked. Push does not work here at all,
    // and reporting "off" is the right end of that.
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { endpoint, tripId } = parsed as Partial<ArmedPush>;
    // Anything but two non-empty strings is not a pairing, whatever wrote it.
    if (typeof endpoint !== 'string' || !endpoint) return null;
    if (typeof tripId !== 'string' || !tripId) return null;
    return { endpoint, tripId };
  } catch {
    return null;
  }
}

/**
 * Remember that the server accepted this endpoint for this trip.
 *
 * Called on the 2xx and nowhere else — a record written before the answer would
 * be the very guess this replaces.
 */
export function rememberArmedPush(endpoint: string, tripId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ARMED_KEY, JSON.stringify({ endpoint, tripId }));
  } catch {
    // Nothing to do, and nothing lost that matters: the switch will read `off`
    // on the next mount, which understates rather than overstates.
  }
}

/**
 * Drop the record.
 *
 * Switching off calls this, and **the failure paths of switching on do not** —
 * the record describes a pair, not an attempt. A second tab may have armed the
 * very same endpoint and trip id (both are shared through `localStorage` and
 * the origin's one subscription), so clearing it because one tab's POST hit a
 * network hiccup would report `off` over a pairing that is armed. A first
 * attempt has no record to leave standing, so that path still reads `off`.
 */
export function forgetArmedPush(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ARMED_KEY);
  } catch {
    // Same as above: a storage that refuses reads as "nothing armed".
  }
}

/**
 * Whether the stored record covers exactly this pair.
 *
 * Both arguments are the live values — the subscription's current endpoint and
 * the trip id as it stands now — so a mismatch on either side is a `false`
 * rather than a stale `true`.
 */
export function pushIsArmedFor(
  endpoint: string | null | undefined,
  tripId: string | null | undefined
): boolean {
  if (!endpoint || !tripId) return false;
  const armed = readArmedPush();
  return armed !== null && armed.endpoint === endpoint && armed.tripId === tripId;
}
