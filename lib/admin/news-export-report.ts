import 'server-only';

import buildInfo from '@/build-info.json';
import { locales } from '@/i18n/config';
import {
  compareExportFeed,
  parseExportList,
  type ExportListReading,
  type NewsExportReport,
  type SitePostRef,
} from '@/lib/admin/news-export-lag';
import { newsExportWorkflowUrl } from '@/lib/admin/news-export-run';
import { listPosts } from '@/lib/blog/listing';
import { EXPORT_FEEDS, exportListUrl, type ExportFeed } from '@/lib/blog/news-export-feeds';
import { withZoneOffset } from '@/lib/blog/published-at';

/**
 * How long a list read from the bucket is reused: the list's own `max-age`, so the check is never
 * further behind than the app, however often it is asked. In memory rather than the Data Cache,
 * which would store all twelve lists again every window to serve a handful of readers.
 */
const LIST_TTL_MS = 5 * 60_000;
const LIST_TIMEOUT_MS = 8_000;

/** Only a list that was read is kept: a failed read says nothing settled about the bucket. */
const lists = new Map<string, { readAt: number; reading: ExportListReading }>();

async function readList(
  url: string,
  now: number
): Promise<{ readAt: number; reading: ExportListReading }> {
  const kept = lists.get(url);
  if (kept && now - kept.readAt < LIST_TTL_MS) return kept;
  let reading: ExportListReading;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
    });
    reading = response.ok
      ? parseExportList(await response.json().catch(() => null))
      : { state: 'failed', message: `HTTP ${response.status}` };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    reading = { state: 'failed', message: timedOut ? 'keine Antwort' : 'nicht erreichbar' };
  }
  const read = { readAt: now, reading };
  if (reading.state === 'ok') lists.set(url, read);
  return read;
}

/** The site's posts of a feed in a locale, selected by the same function the export uses. */
function sitePosts(feed: ExportFeed, locale: (typeof locales)[number]): SitePostRef[] {
  return EXPORT_FEEDS[feed](listPosts(locale)).map((post) => ({
    translationKey: post.translationKey,
    slug: post.slug,
    title: post.frontmatter.title,
    publishedAt: withZoneOffset(post.frontmatter.date, post.frontmatter.time),
  }));
}

/**
 * The app's news and guides export on media.park.fan against this deployment's posts, per feed:
 * when it last ran, its newest post and the site's, and what it is missing. The admin's route and
 * the API's server route answer with it; the lists are read here so no browser asks the bucket.
 */
export async function buildNewsExportReport(): Promise<NewsExportReport> {
  const now = Date.now();
  const feeds = Object.keys(EXPORT_FEEDS) as ExportFeed[];
  const reads = await Promise.all(
    feeds.flatMap((feed) =>
      locales.map(async (locale) => ({
        feed,
        locale,
        ...(await readList(exportListUrl(feed, locale), now)),
      }))
    )
  );

  const deployedAt = buildInfo.buildDate ?? null;
  return {
    checkedAt: new Date(Math.min(...reads.map((read) => read.readAt))).toISOString(),
    deployedAt,
    feeds: feeds.map((feed) =>
      compareExportFeed({
        feed,
        site: Object.fromEntries(locales.map((locale) => [locale, sitePosts(feed, locale)])),
        exported: Object.fromEntries(
          reads.filter((read) => read.feed === feed).map((read) => [read.locale, read.reading])
        ),
        deployedAt,
        now,
      })
    ),
    workflowUrl: newsExportWorkflowUrl(),
  };
}
