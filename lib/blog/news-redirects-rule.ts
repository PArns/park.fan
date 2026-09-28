import { isValidLocale } from '@/i18n/config';
import { NEWS_CATEGORY, NEWS_INDEX_PATH } from './paths';
import { NEWS_ONLY_TAGS, NEWS_POST_TARGETS } from './news-redirects';

/**
 * The 308s that moved news out of the blog, decided from the URL alone so `proxy.ts` can answer
 * them before anything renders. Same construction as `lib/parks/calendar-redirects.ts`, for the
 * same reason: a `permanentRedirect()` thrown from the post page carries the locale layout as its
 * body (`docs/rules/a-redirect-thrown-from-a-render-carries-the-layout-as-its-body.md`).
 *
 * - `/<locale>/blog/<slug>` of a news post → `/<locale>/news/<slug>`, where `<slug>` is the one
 *   that locale serves the post under. A slug from another locale lands on the canonical URL in
 *   the same hop instead of taking the post page's canonical-slug redirect afterwards.
 * - `/<locale>/blog/category/news` → `/<locale>/news`.
 * - `/<locale>/blog/tag/<slug>` of a tag only news carries → `/<locale>/news`. The tag archives
 *   count articles only, so such an archive has nothing left to list; it was in the sitemap while
 *   `/blog` listed news, and a 404 there throws away what it earned.
 *
 * Which slugs are news is not decided here: `scripts/generate-blog-manifest.mjs` writes that list
 * (`./news-redirects.ts`) from the same frontmatter the post page reads. Everything else returns
 * `null` and falls through to the route unchanged. The post and category pages keep their own
 * `permanentRedirect` behind this as a net, so the rule is applied there and anticipated here.
 */
export function newsRedirect(pathname: string): string | null {
  const parts = pathname.split('/');
  const [, locale, blogSegment] = parts;
  if (blogSegment !== 'blog' || !isValidLocale(locale)) return null;

  // '', locale, 'blog', slug
  if (parts.length === 4) {
    const target = NEWS_POST_TARGETS[locale]?.[parts[3]];
    return target ? `/${locale}/news/${target}` : null;
  }

  // '', locale, 'blog', 'category', 'news'
  if (parts.length === 5 && parts[3] === 'category' && parts[4] === NEWS_CATEGORY) {
    return `/${locale}${NEWS_INDEX_PATH}`;
  }

  // '', locale, 'blog', 'tag', <slug>
  if (parts.length === 5 && parts[3] === 'tag' && NEWS_ONLY_TAGS[locale]?.includes(parts[4])) {
    return `/${locale}${NEWS_INDEX_PATH}`;
  }

  return null;
}
