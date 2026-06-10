import { NextResponse } from 'next/server';
import { submitUrlsToIndexNow } from '@/lib/indexnow';
import { locales, SITE_URL } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { getParkPaths, getAttractionPaths, localizedUrls } from '@/lib/content-urls';

const BASE_URL = SITE_URL;

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = [];

  // ── Static pages (high-value, matches sitemap priority ≥ 0.7) ─────────────
  for (const locale of locales) {
    urls.push(`${BASE_URL}/${locale}`); // home
    urls.push(`${BASE_URL}/${locale}/howto`); // guide
    urls.push(`${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale]}`); // glossary overview
  }

  // ── Park pages (shared URL set with the prewarm crawler) ────────────────────
  try {
    urls.push(...localizedUrls(await getParkPaths(), BASE_URL));
  } catch (error) {
    console.error('[IndexNow] Failed to fetch geo structure:', error);
    return NextResponse.json({ error: 'Failed to fetch geo structure' }, { status: 500 });
  }

  // ── Attraction pages (long-tail SEO, same filter as sitemap) ───────────────
  try {
    urls.push(...localizedUrls(await getAttractionPaths(), BASE_URL));
  } catch (error) {
    console.error('[IndexNow] Failed to fetch attractions:', error);
    // Non-fatal — continue with what we have
  }

  // ── Blog pages — index, every post, every category, every tag ─────────────
  try {
    const { listPosts, getTranslationIndex } = await import('@/lib/blog');
    const { buildCategoryTree } = await import('@/lib/blog/categories');
    const { listTags } = await import('@/lib/blog/tags');
    const translationIndex = getTranslationIndex();

    for (const locale of locales) {
      urls.push(`${BASE_URL}/${locale}/blog`);
      // Posts — only real translations; EN-fallback URLs canonicalize to the
      // EN original and shouldn't be submitted.
      for (const [, localeMap] of translationIndex) {
        const slug = localeMap.get(locale);
        if (slug) urls.push(`${BASE_URL}/${locale}/blog/${slug}`);
      }
      // Categories + tags
      const { flat } = buildCategoryTree(locale);
      for (const path of flat.keys()) {
        urls.push(`${BASE_URL}/${locale}/blog/category/${path}`);
      }
      for (const tag of listTags(locale)) {
        urls.push(`${BASE_URL}/${locale}/blog/tag/${tag.slug}`);
      }
    }
    // Stable order is good for IndexNow — same URL hash on repeated pings.
    void listPosts;
  } catch (error) {
    console.error('[IndexNow] Failed to collect blog URLs:', error);
  }

  // IndexNow accepts up to 10 000 URLs per request
  const BATCH_SIZE = 10_000;
  const batches: Promise<void>[] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(submitUrlsToIndexNow(urls.slice(i, i + BATCH_SIZE)));
  }
  await Promise.all(batches);

  return NextResponse.json({ submitted: urls.length });
}
