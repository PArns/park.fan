import { localeSitemapIndex } from '@/lib/seo/sitemap-xml';

/**
 * Sitemap index over `/sitemap-calendar/<locale>.xml`, kept out of `app/sitemap.ts` because the
 * month pages with their hreflang block pushed that file toward the 50 MB limit, and a file over it
 * is rejected whole. No hreflang in the children, as for `/sitemap-attractions.xml`. The ceiling
 * belongs to `PARK_CALENDAR_MONTH_SPAN`, not to today's count: widening `back` puts the bytes back.
 * See docs/seo/sitemaps.md.
 */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return localeSitemapIndex((locale) => `/sitemap-calendar/${locale}.xml`);
}
