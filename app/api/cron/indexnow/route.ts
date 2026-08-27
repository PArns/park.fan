import { NextResponse } from 'next/server';
import { submitUrlsToIndexNow } from '@/lib/indexnow';
import { locales, SITE_URL } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { getParkPaths, getAttractionPaths, localizedUrls } from '@/lib/content-urls';
import { getContentLastmodIndex } from '@/lib/seo/content-changes/store';

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
 * Everything, once a week (Mondays, UTC).
 *
 * IndexNow is a changed-URL protocol, and this route used to hand it all 46,000
 * every morning, which is the same "everything changed" non-signal the sitemap's
 * missing `<lastmod>` was. Now it submits what the content-change crawl says
 * moved. The weekly sweep is the safety net for the failure mode that costs the
 * most and is the hardest to notice: a fingerprint that stops detecting anything
 * would otherwise mean this route quietly submits nothing, forever.
 */
function isFullSweepDay(now: Date): boolean {
  return now.getUTCDay() === 1;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = [];
  const now = new Date();

  // ── Static pages (high-value, matches sitemap priority ≥ 0.7) ─────────────
  for (const locale of locales) {
    urls.push(`${BASE_URL}/${locale}`); // home
    urls.push(`${BASE_URL}/${locale}/${HOWTO_SEGMENTS[locale]}`); // guide
    urls.push(`${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale]}`); // glossary overview
  }

  // ── Park + attraction pages ───────────────────────────────────────────────
  // The interesting case is the first: the catalog paths whose content actually
  // moved, per the crawl that ran half an hour earlier. An empty index means the
  // crawl has never run or could not be read, and then the honest thing is the
  // old behaviour — submit the lot — rather than an empty ping.
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

  // ── Blog pages — index, every post, every category, every tag ─────────────
  // Submitted in full every day, unlike the catalog above. Seven posts across six
  // locales plus their categories and tags is a few hundred URLs, and the index,
  // category and tag pages genuinely reshuffle whenever anything is published, so
  // there is nothing here worth a change detector.
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

  // `?dry=1` builds the URL list and submits nothing. The only way to see WHICH
  // URLs a run would ping — the selection is the interesting half now that it is
  // no longer "all of them", and it cannot be inspected by running the real thing.
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
