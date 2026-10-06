/**
 * "New on the blog since your last visit": the decision, without any UI. Client-safe: the browser
 * fetches the newest posts from `/api/blog-latest/<locale>` and compares them with what it stored.
 *
 * A post's `date` is a day, not an instant, so the record holds the translation keys the visitor
 * was shown plus the newest date among them. A post is new when its key is not in the set and it
 * is not older than that date; the floor keeps a post that dropped off the list from coming back
 * as new. Keys rather than slugs, which differ per locale. News counts too: this announces what
 * arrived, and news arrives most often.
 */

/** One post as the endpoint sends it — already resolved for the requested locale. */
export interface LatestPost {
  /** Translation key — the same across locales. */
  key: string;
  /** Locale-relative URL of the post (`/blog/…` or `/news/…`, see `lib/blog/paths.ts`). */
  path: string;
  title: string;
  /** Publication day, `YYYY-MM-DD`. */
  date: string;
  /** Category label in the requested locale. */
  category?: string;
  /** Versioned 16:9 cover crop, where the post has one. */
  image?: string;
  /** The cover's focal point as a CSS `object-position`, resolved by the route. */
  imagePosition?: string;
}

/**
 * The toast's strings, sent with the posts rather than through `NextIntlClientProvider`.
 * The watcher sits in the locale layout, so a `useTranslations` there would put these strings
 * into the chrome namespaces every page serializes — for a toast most page views never show.
 */
export interface LatestPostsLabels {
  eyebrow: string;
  read: string;
  close: string;
  /** `{count}` is replaced with the number of further new posts. */
  moreOne: string;
  moreOther: string;
  allPosts: string;
}

export interface LatestPostsPayload {
  labels: LatestPostsLabels;
  /** Newest first, by publication date. */
  posts: LatestPost[];
}

export interface SeenRecord {
  newest: string;
  keys: string[];
}

export const SEEN_STORAGE_KEY = 'pf:blog-seen';

/**
 * When this browser last asked for the list, in epoch milliseconds. In `localStorage` rather than
 * a per-session flag, so every tab shares one clock and a tab kept open for days still asks again.
 */
export const CHECKED_AT_STORAGE_KEY = 'pf:blog-seen-checked-at';

/**
 * How long one answer counts. The same ten minutes the browser may keep `/api/blog-latest` for
 * (`max-age=600`): asking sooner would only be answered from the HTTP cache.
 */
export const CHECK_INTERVAL_MS = 10 * 60_000;

/**
 * Is it time to ask again? If so, the check is claimed before the request goes out, so a second
 * tab or a second trigger in this one waits for the next interval instead of asking alongside.
 *
 * `false` when storage throws: without it there is no record of a last visit to compare with,
 * so there is nothing worth asking for.
 */
export function claimCheck(now: number = Date.now()): boolean {
  try {
    const last = Number(localStorage.getItem(CHECKED_AT_STORAGE_KEY));
    // A time in the future is a clock that was wrong or has been set back: ask, rather than
    // wait for that clock to catch up.
    const recent = Number.isFinite(last) && last > 0 && last <= now;
    if (recent && now - last < CHECK_INTERVAL_MS) return false;
    localStorage.setItem(CHECKED_AT_STORAGE_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

function isSeenRecord(value: unknown): value is SeenRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.newest === 'string' &&
    Array.isArray(record.keys) &&
    record.keys.every((key) => typeof key === 'string')
  );
}

/** `null` for a first visit, a cleared browser, or storage that throws (private mode). */
export function readSeen(): SeenRecord | null {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSeenRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Remember every post in the list as seen. */
export function writeSeen(posts: readonly LatestPost[]): void {
  if (posts.length === 0) return;
  const record: SeenRecord = {
    newest: posts.reduce((max, post) => (post.date > max ? post.date : max), posts[0].date),
    keys: posts.map((post) => post.key),
  };
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage blocked: the toast simply never has a "last visit" to compare with.
  }
}

/** The posts the visitor has not been shown yet, newest first. */
export function unseenPosts(seen: SeenRecord, posts: readonly LatestPost[]): LatestPost[] {
  const known = new Set(seen.keys);
  return posts.filter((post) => !known.has(post.key) && post.date >= seen.newest);
}
