/**
 * Where a blog post lives, decided in one place.
 *
 * News posts (`category: news`, or a subcategory of it) are served under `/news/<slug>`, every
 * other post under `/blog/<slug>`. The content files stay in `content/blog/<locale>/` either way;
 * only the URL differs. Every link, canonical, hreflang, sitemap entry and feed item asks this
 * module, so no second place builds `/blog/` or `/news/` for a post. See
 * `docs/rules/news-live-under-news.md`.
 *
 * Client-safe on purpose: no manifest import, no `server-only`, so client components (the
 * new-posts toast, the card views) and `proxy.ts` can use it as well.
 */

/** The category path that marks a post as news. Subcategories (`news/…`) count too. */
export const NEWS_CATEGORY = 'news';

/** Locale-relative path of the news overview, which replaces `/blog/category/news`. */
export const NEWS_INDEX_PATH = '/news';

export function isNewsCategory(category: string | null | undefined): boolean {
  return category === NEWS_CATEGORY || !!category?.startsWith(`${NEWS_CATEGORY}/`);
}

/**
 * Locale-relative path of a post: `/news/<slug>` for news, `/blog/<slug>` for everything else.
 * Prefix `/${locale}` (or `${SITE_URL}/${locale}`) for an absolute URL.
 */
export function postPath(post: {
  slug: string;
  frontmatter: { category?: string | null };
}): string {
  return isNewsCategory(post.frontmatter.category) ? newsPostPath(post.slug) : `/blog/${post.slug}`;
}

/** {@link postPath} for a list that holds news only and carries no frontmatter. */
export function newsPostPath(slug: string): string {
  return `${NEWS_INDEX_PATH}/${slug}`;
}

/**
 * Locale-relative path of a category listing. The news category itself is the news overview;
 * every other category keeps its `/blog/category/…` page.
 */
export function categoryPath(path: string): string {
  return path === NEWS_CATEGORY ? NEWS_INDEX_PATH : `/blog/category/${path}`;
}
