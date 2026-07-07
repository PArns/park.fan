import { getAttractionPaths, localizedUrls } from '@/lib/content-urls';
import { SITE_URL } from '@/i18n/config';

/**
 * Attraction sitemap — separate from app/sitemap.ts on purpose.
 *
 * ~5.8k attractions × 6 locales ≈ 35k URLs: with the full per-entry hreflang
 * alternate block (like the main sitemap emits) the XML would approach the
 * 50 MB sitemap limit, so entries here are lean <loc>-only. That's fine —
 * hreflang is optional in sitemaps and every attraction page already emits
 * the complete alternate set in its <head> via generateMetadata.
 *
 * Noindex variant slugs are excluded by getAttractionPaths (same base-exists
 * rule as the attraction page and the IndexNow submitter).
 */
export const revalidate = 86400;

function xmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

export async function GET(): Promise<Response> {
  const paths = await getAttractionPaths();
  const urls = localizedUrls(paths, SITE_URL).map(
    (url) =>
      `<url><loc>${xmlEscape(url)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
