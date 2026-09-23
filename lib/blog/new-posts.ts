/**
 * "New on the blog since your last visit" — the part that decides, without any UI.
 *
 * Client-safe on purpose: no `server-only`, no manifest import. The browser gets the newest
 * posts from `/api/blog-latest/<locale>` (a static JSON file per locale), compares them with
 * what it stored the last time, and only then loads the toast.
 *
 * ## What "seen" means
 *
 * A post's `date` is a calendar day, not an instant, so "published after the last visit" cannot
 * be answered with a timestamp: a post dated today and put live this afternoon would be missed
 * by a visit this morning, and one put live this morning would show up again. So the record
 * holds the posts themselves — the translation keys of the newest posts the visitor was shown,
 * and the newest date among them. A post is new when it is not in that set and is not older
 * than that date. The date floor keeps a post that merely dropped out of the list (because
 * several newer ones arrived) from reading as new when it comes back.
 *
 * A post back-dated to before the last visit is not announced. That is accepted: the toast is
 * about what arrived, and a back-dated post says it did not.
 *
 * Keys, not slugs: a slug differs per locale, so switching the language would announce every
 * post again.
 *
 * News and articles alike. The teaser surfaces keep the two apart (`isNewsPost`), but this is
 * not a teaser: it announces what arrived, and news is what arrives most often.
 */

/** One post as the endpoint sends it — already resolved for the requested locale. */
export interface LatestPost {
  /** Translation key — the same across locales. */
  key: string;
  slug: string;
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
 * When this browser last asked for the list, in epoch milliseconds. In `localStorage`, so every
 * tab of the site shares one clock and the check costs one request per interval, not per page.
 *
 * It replaced a once-per-session flag in `sessionStorage`, which never expired while the tab
 * lived. A tab left open, a tab the browser restores on startup and an installed app all keep
 * their session for days, so a reload after a news post went live never asked again — only a
 * new tab did.
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
