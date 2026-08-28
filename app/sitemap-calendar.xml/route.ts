import { localeSitemapIndex } from '@/lib/seo/sitemap-xml';

/**
 * Sitemap INDEX for the park calendar's month pages.
 *
 * These URLs spent one build inside `app/sitemap.ts` and that is how the ceiling got measured:
 * 212 parks × 22 months × 6 locales is 27,984 entries, and with the seven-alternate `xhtml:link`
 * block that file carries per URL, the main sitemap came out at **39.5 MB against a 50 MB
 * limit** — 32,748 URLs of headroom on the count, and almost none on the bytes. A file over the
 * limit is rejected whole, so the next handful of parks would have taken the park pages, the geo
 * hubs, the glossary and the blog down with the calendar.
 *
 * Same split, and the same reasoning, as `/sitemap-attractions.xml`: an index over one file per
 * locale, and **no hreflang in the children**. Every month page already serves the complete
 * alternate set from its own `<head>`, which Google weighs the same; repeating it here would buy
 * a second copy of a signal that is already there, at the price that caused the split.
 */
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return localeSitemapIndex((locale) => `/sitemap-calendar/${locale}.xml`);
}
