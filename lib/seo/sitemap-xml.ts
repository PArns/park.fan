import { locales, SITE_URL } from '@/i18n/config';

/**
 * XML escaping for sitemap `<loc>` values.
 *
 * Lived twice, byte for byte, in `app/sitemap-attractions/[locale]/route.ts` and
 * `app/sitemap-calendar/[locale]/route.ts` — each with a docblock calling itself „the same helper
 * the other one uses", which is exactly the arrangement where a fix reaches one file and the
 * other keeps emitting the bug. And the bug here is not cosmetic: a malformed `<loc>` invalidates
 * the whole document, and a sitemap is rejected whole, silently, per locale. The slugs come from
 * `getGeoStructure()`, i.e. upstream data this app does not control.
 */
export function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

/**
 * A sitemap INDEX over one child per locale, which is the shape both large sitemaps use.
 *
 * `pathFor` builds each child's URL from its locale — `/sitemap-attractions/de.xml`,
 * `/sitemap-calendar/de.xml`. The index itself is what Search Console is pointed at, so its own
 * URL never changes even when what it lists does.
 */
export function localeSitemapIndex(pathFor: (locale: string) => string): Response {
  const children = locales
    .map((locale) => `<sitemap><loc>${xmlEscape(`${SITE_URL}${pathFor(locale)}`)}</loc></sitemap>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children}\n</sitemapindex>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
