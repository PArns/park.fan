/** A post slug, translation key or author key that is safe to put into a `content/blog` path. */
export const BLOG_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/** A locale folder under `content/blog`, such as `de` or `pt-br`. */
export const BLOG_LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;
