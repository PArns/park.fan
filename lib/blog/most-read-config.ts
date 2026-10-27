import type { MostRead, MostReadPost } from '@/lib/blog/most-read';

/** The two rankings the site shows. A client-safe module: the lists and their labels read it. */
export type MostReadKind = 'article' | 'news';

/** The window each ranking sums over, in UTC days with today included. */
export const MOST_READ_DAYS: Record<MostReadKind, number> = { article: 30, news: 7 };

/** How many posts a most-read list shows. */
export const MOST_READ_LIMIT = 5;

/** The kind's list in a {@link MostRead}. */
export function mostReadList(data: MostRead | undefined, kind: MostReadKind): MostReadPost[] {
  return (kind === 'article' ? data?.articles : data?.news) ?? [];
}

/**
 * The posts a list shows: the ranking without `excludeKey` (the post the reader is on), cut to
 * {@link MOST_READ_LIMIT}. The API sends one spare, so leaving the current post out still fills it.
 */
export function mostReadShown(
  data: MostRead | undefined,
  kind: MostReadKind,
  excludeKey?: string
): MostReadPost[] {
  return mostReadList(data, kind)
    .filter((post) => post.key !== excludeKey)
    .slice(0, MOST_READ_LIMIT);
}
