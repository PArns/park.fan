import {
  localeFromSitemapFile,
  localeSitemapParams,
  urlsetResponse,
  xmlEscape,
} from '@/lib/seo/sitemap-xml';
import { getAttractionPaths } from '@/lib/content-urls';
import { getContentLastmodIndex } from '@/lib/seo/content-changes/store';
import { SITE_URL } from '@/i18n/config';
import { notFound } from 'next/navigation';

/**
 * One attraction sitemap per locale, `/sitemap-attractions/<locale>.xml`, so no file nears the
 * 50,000-URL ceiling and Search Console reports coverage per locale. See docs/seo/sitemaps.md.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return localeSitemapParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const locale = localeFromSitemapFile((await params).locale);
  if (!locale) notFound();

  const [paths, lastmod] = await Promise.all([getAttractionPaths(), getContentLastmodIndex()]);
  const urls = paths.map((path) => {
    // `<lastmod>` is the only one of these tags Google reads. A path the content-change detector
    // has never seen gets no tag rather than a guess. See lib/seo/content-changes/fingerprint.ts.
    const changedAt = lastmod.get(path);
    return `<url><loc>${xmlEscape(`${SITE_URL}/${locale}${path}`)}</loc>${
      changedAt ? `<lastmod>${changedAt}</lastmod>` : ''
    }<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  });

  return urlsetResponse(urls);
}
