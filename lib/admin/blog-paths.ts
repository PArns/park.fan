/** A post slug, translation key or author key that is safe to put into a `content/blog` path. */
export const BLOG_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Whether the editor may offer `key` as a new author key or category slug: lowercase, and the
 * shape the save route checks with {@link BLOG_SLUG_RE}, so a key the form accepts is never one
 * the server then refuses (a trailing dash was).
 */
export function isBlogKey(key: string): boolean {
  return BLOG_SLUG_RE.test(key) && key === key.toLowerCase();
}

/** A locale folder under `content/blog`, such as `de` or `pt-br`. */
export const BLOG_LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;
