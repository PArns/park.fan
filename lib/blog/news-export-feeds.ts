import { selectGuides, selectNews } from './news-blocks';

/**
 * Where the native app's news and guides export lives (written by `scripts/news-export.mjs`,
 * docs/features/media-database.md#news-for-the-app): the bucket's public host, its two feeds and
 * the list per feed and locale that the app and the API's push job read.
 */

/** The bucket's public host. */
export const MEDIA_EXPORT_BASE = 'https://media.park.fan';

/** The export's post feeds: each a folder of its own on the bucket, with the posts that go into it. */
export const EXPORT_FEEDS = {
  news: selectNews,
  guides: selectGuides,
} as const;

/** One feed of the export, `news` or `guides`. */
export type ExportFeed = keyof typeof EXPORT_FEEDS;

/** The list of one feed in one locale: `https://media.park.fan/news/de.json`. */
export function exportListUrl(feed: ExportFeed, locale: string): string {
  return `${MEDIA_EXPORT_BASE}/${feed}/${locale}.json`;
}
