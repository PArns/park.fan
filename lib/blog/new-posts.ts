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
/** Set once per browser session, so the check costs one request per visit, not per page. */
export const CHECKED_SESSION_KEY = 'pf:blog-seen-checked';

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
