import { locales } from '@/i18n/config';
import { listPosts } from '@/lib/blog/listing';
import { buildNewsSitemap } from '@/lib/seo/news-sitemap';

/**
 * Google News sitemap: the news posts of the last two days, per locale, with `<news:news>`,
 * because a news post is worth less every day it waits for a normal crawl. See
 * `lib/seo/news-sitemap.ts` and docs/seo/sitemaps.md.
 *
 * `revalidate` is this route's own window: it makes no fetch, it reads the post manifest and
 * today's date, so an hour is how long a post may linger after UTC midnight moves the window.
 * Next needs the literal here, `CACHE_TTL` cannot be referenced.
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
