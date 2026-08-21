import { getAttractionPaths } from '@/lib/content-urls';
import { locales, SITE_URL, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';

/**
 * One attraction sitemap per locale, addressed as `/sitemap-attractions/<locale>.xml`.
 *
 * The single combined file this replaces held 42,606 URLs — 7,101 attractions
 * × 6 locales — against the format's hard ceiling of 50,000. That left room for
 * 1,232 more attractions on a catalogue that went from ~5,800 to 7,101 in about
 * a year, so the file was going to stop validating on its own schedule. Split by
 * locale each child holds 7,101 and the ceiling stops being a deadline.
 *
 * Search Console also reports coverage per sitemap file, so a per-locale split
 * turns one undiagnosable number into six comparable ones.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale: `${locale}.xml` }));
}

function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale: fileName } = await params;
  const locale = fileName.replace(/\.xml$/, '');
  if (!locales.includes(locale as Locale)) notFound();

  const paths = await getAttractionPaths();
  const urls = paths.map(
    (path) =>
      `<url><loc>${xmlEscape(`${SITE_URL}/${locale}${path}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
