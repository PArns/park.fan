import { localeSitemapIndex } from '@/lib/seo/sitemap-xml';

/**
 * Sitemap index over `/sitemap-attractions/<locale>.xml`: one file would hit the 50,000-URL and
 * 50 MB ceilings. hreflang stays out of the children because every attraction page serves its
 * alternates from its `<head>`. The URL is the one submitted in Search Console. See
 * docs/seo/sitemaps.md.
 */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return localeSitemapIndex((locale) => `/sitemap-attractions/${locale}.xml`);
}
