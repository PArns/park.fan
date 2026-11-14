/**
 * The park the visitor's last chat with Parky was about, so on a later visit he can pick up there
 * („Unser letztes Thema: Toverland"). The park's name, its slug where known and the time, in this
 * browser's local storage only; the privacy policy says so. Every access is guarded: blocked
 * storage only means Parky does not bring it up.
 */

const KEY = 'parkfan_parky_last_park';
/** When this tab's visit began, so a park remembered in it is not yet "last time". */
const SINCE_KEY = 'parkfan:assistant-since';
/** Older than this, the last chat is no longer worth bringing up. */
export const LAST_PARK_WITHIN_MS = 30 * 86_400_000;
const MAX_NAME = 120;
const SLUG = /^[a-z0-9-]{1,120}$/;

/** The park a chat was about. */
export interface LastPark {
  name: string;
  slug: string | null;
  at: number;
}

/** When this visit began: the first time Parky's code asked, in this tab. */
function visitStart(now: number): number | null {
  try {
    const stored = Number(window.sessionStorage.getItem(SINCE_KEY));
    if (stored > 0) return stored;
    window.sessionStorage.setItem(SINCE_KEY, String(now));
    return now;
  } catch {
    return null;
  }
}

/** A stored record read leniently: anything odd is no record. */
export function readLastPark(raw: string | null): LastPark | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LastPark>;
    if (typeof value.name !== 'string' || !value.name.trim() || typeof value.at !== 'number') {
      return null;
    }
    return {
      name: value.name.trim().slice(0, MAX_NAME),
      slug: typeof value.slug === 'string' && SLUG.test(value.slug) ? value.slug : null,
      at: value.at,
    };
  } catch {
    return null;
  }
}

/** Keep the park a chat is about; the newest wins. */
export function rememberLastPark(name: string, slug: string | null, now = Date.now()): void {
  const clean = name.trim().slice(0, MAX_NAME);
  if (!clean) return;
  visitStart(now);
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ name: clean, ...(slug && SLUG.test(slug) && { slug }), at: now })
    );
  } catch {
    // Private mode or a full store: Parky simply does not bring it up next time.
  }
}

/**
 * The last chat's park when this is a later visit and that chat was within
 * {@link LAST_PARK_WITHIN_MS}; null otherwise, and on the visit it was remembered in.
 */
export function lastParkBack(now = Date.now()): LastPark | null {
  const since = visitStart(now);
  if (since === null) return null;
  let record: LastPark | null;
  try {
    record = readLastPark(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
  if (!record || record.at >= since || now - record.at > LAST_PARK_WITHIN_MS) return null;
  return record;
}
