import { locales } from '@/i18n/config';
import { listPosts } from '@/lib/blog/listing';
import { buildNewsSitemap } from '@/lib/seo/news-sitemap';

/**
 * Google News sitemap: the news posts of the last two days, per locale, with `<news:news>`.
 *
 * The other sitemaps list every URL once and let a crawler come back to it; this one exists
 * because a news post is worth less every day it waits for that crawl. A Halloween date announced
 * in September has to rank in September. See `lib/seo/news-sitemap.ts` for the window and
 * `docs/seo/sitemaps.md` for where it sits among the other three.
 *
 * `revalidate` is this route's own window, not a call site's: the route makes no fetch, it reads
 * the build's post manifest and today's date. An hour is how long a post may linger or wait after
 * UTC midnight moves the window. Next needs the literal here, `CACHE_TTL` cannot be referenced.
 */
export const revalidate = 3600;

export function GET(): Response {
  const today = new Date().toISOString().slice(0, 10);
  const xml = buildNewsSitemap(
    locales.map((locale) => [locale, listPosts(locale)] as const),
    today
  );

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
