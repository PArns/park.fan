import { NextResponse } from 'next/server';
import { submitUrlsToIndexNow } from '@/lib/indexnow';
import { locales, SITE_URL } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { getParkPaths, getAttractionPaths, localizedUrls } from '@/lib/content-urls';
import { getContentLastmodIndex } from '@/lib/seo/content-changes/store';
import { cronUnauthorized } from '@/lib/security/cron-auth';

const BASE_URL = SITE_URL;

export const maxDuration = 60;

/**
 * How far back a content-change date counts as "recent enough to submit".
 *
 * The crawl and this run are both daily, so one day would do — two absorbs a
 * skipped crawl without dropping the change it would have reported.
 */
const RECENT_DAYS = 2;

/**
 * Everything, once a week (Mondays, UTC); other days submit only what the content-change crawl
 * says moved. The sweep is the safety net for a fingerprint that silently stops detecting anything.
 */
function isFullSweepDay(now: Date): boolean {
  return now.getUTCDay() === 1;
}

export async function GET(request: Request) {
  const denied = cronUnauthorized(request);
  if (denied) return denied;

  const urls: string[] = [];
  const now = new Date();

  // Static pages, the sitemap's priority ≥ 0.7.
  for (const locale of locales) {
    urls.push(`${BASE_URL}/${locale}`);
    urls.push(`${BASE_URL}/${locale}/${HOWTO_SEGMENTS[locale]}`);
    urls.push(`${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale]}`);
  }

  // Park and attraction pages whose content moved, per the crawl that ran half an hour earlier.
  // An empty index means the crawl never ran or could not be read, and then all are submitted.
  const lastmod = await getContentLastmodIndex();
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - RECENT_DAYS);
  const since = cutoff.toISOString().slice(0, 10);

  const fullSweep = lastmod.size === 0 || isFullSweepDay(now);
  let catalogPaths: string[];
  if (fullSweep) {
    try {
      catalogPaths = await getParkPaths();
    } catch (error) {
      console.error('[IndexNow] Failed to fetch geo structure:', error);
      return NextResponse.json({ error: 'Failed to fetch geo structure' }, { status: 500 });
    }
    try {
      catalogPaths.push(...(await getAttractionPaths()));
    } catch (error) {
      console.error('[IndexNow] Failed to fetch attractions:', error);
      // Non-fatal — continue with what we have.
    }
  } else {
    catalogPaths = [...lastmod]
      .filter(([, changedAt]) => changedAt >= since)
      .map(([contentPath]) => contentPath);
  }
  urls.push(...localizedUrls(catalogPaths, BASE_URL));

  // Blog pages in full every day: a few hundred URLs, and the index, category and tag pages
  // reshuffle on every publication.
  try {
    const { listPosts, listNewsByDate, getMetaIndex } = await import('@/lib/blog');
    const { buildCategoryTree } = await import('@/lib/blog/categories');
    const { listTags } = await import('@/lib/blog/tags');
    const { categoryPath, NEWS_INDEX_PATH, postPath } = await import('@/lib/blog/paths');
    const metaIndex = getMetaIndex();

    for (const locale of locales) {
      urls.push(`${BASE_URL}/${locale}/blog`);
      // The news overview, where the locale has news (it 404s otherwise).
      if (listNewsByDate(locale).length > 0) urls.push(`${BASE_URL}/${locale}${NEWS_INDEX_PATH}`);
      // Posts — only real translations; EN-fallback URLs canonicalize to the
      // EN original and shouldn't be submitted.
      for (const [, localeMap] of metaIndex) {
        const entry = localeMap.get(locale);
        if (entry) {
          urls.push(
            `${BASE_URL}/${locale}${postPath({ slug: entry.slug, frontmatter: entry.fm })}`
          );
        }
      }
      const { flat } = buildCategoryTree(locale);
      for (const path of flat.keys()) {
        urls.push(`${BASE_URL}/${locale}${categoryPath(path)}`);
      }
      for (const tag of listTags(locale)) {
        urls.push(`${BASE_URL}/${locale}/blog/tag/${tag.slug}`);
      }
    }
    void listPosts;
  } catch (error) {
    console.error('[IndexNow] Failed to collect blog URLs:', error);
  }

  // `?dry=1` builds the URL list and submits nothing: the only way to see which URLs a run would
  // ping.
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  if (!dry) {
    // IndexNow accepts up to 10 000 URLs per request
    const BATCH_SIZE = 10_000;
    const batches: Promise<void>[] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      batches.push(submitUrlsToIndexNow(urls.slice(i, i + BATCH_SIZE)));
    }
    await Promise.all(batches);
  }

  return NextResponse.json({
    submitted: dry ? 0 : urls.length,
    dry,
    urls: urls.length,
    fullSweep,
    catalogPaths: catalogPaths.length,
    changedSince: fullSweep ? null : since,
    ...(dry && { sample: urls.slice(0, 20) }),
  });
}
