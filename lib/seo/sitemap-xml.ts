import { locales, SITE_URL, type Locale } from '@/i18n/config';

const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8' };

/**
 * Escapes a value for XML text or a quoted attribute, in the sitemaps and the blog feed.
 *
 * Not cosmetic: a malformed `<loc>` invalidates the whole document, and a sitemap is rejected
 * whole, silently, per locale. The slugs come from `getGeoStructure()`, i.e. upstream data this
 * app does not control.
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

  return new Response(xml, { headers: XML_HEADERS });
}

/** The `<locale>.xml` segments a per-locale child sitemap is generated for. */
export function localeSitemapParams(): { locale: string }[] {
  return locales.map((locale) => ({ locale: `${locale}.xml` }));
}

/** The locale a child sitemap's `<locale>.xml` segment names, or null when it names none. */
export function localeFromSitemapFile(fileName: string): Locale | null {
  const locale = fileName.replace(/\.xml$/, '');
  return locales.includes(locale as Locale) ? (locale as Locale) : null;
}

/** A `<urlset>` sitemap document over the given `<url>` entries. */
export function urlsetResponse(urls: string[]): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, { headers: XML_HEADERS });
}
