import { localeSitemapIndex } from '@/lib/seo/sitemap-xml';

/**
 * Sitemap INDEX for the attraction pages.
 *
 * This URL used to be the urlset itself: 42,606 `<loc>` entries (7,101
 * attractions × 6 locales) in one 6.98 MiB file. Two ceilings were closing in on
 * it — 50,000 URLs per file, which left room for 1,232 more attractions, and
 * 50 MB uncompressed, which is what an `xhtml:link` block per entry would have
 * cost (the alternates are seven near-full URLs each, so annotating this file
 * measured 49 MiB, 98 % of the limit).
 *
 * The URL stays what it is because it is the one submitted in Search Console;
 * only its content changed, from a urlset to an index over
 * `/sitemap-attractions/<locale>.xml`. hreflang stays out of the children: every
 * attraction page already serves the full alternate set from its `<head>`, which
 * Google weighs the same, so the 42 MB would buy a second copy of a signal that
 * is already there.
 */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return localeSitemapIndex((locale) => `/sitemap-attractions/${locale}.xml`);
}
