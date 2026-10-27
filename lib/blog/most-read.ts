import 'server-only';
import type { Locale } from '@/i18n/config';
import { api } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { listArticles, listNewsByDate } from '@/lib/blog/listing';
import { categoryPath } from '@/lib/blog/paths';
import { resolveNewsPark, type NewsPark } from '@/lib/blog/news-park';
import type { BlogListItem } from '@/lib/blog/types';
import { toMenuPost, type BlogMenuPost } from '@/lib/navigation/blog-menu';
import { MOST_READ_DAYS, MOST_READ_LIMIT, type MostReadKind } from '@/lib/blog/most-read-config';

/**
 * The most read articles and news of one language, from the API's page-view ranking
 * (`/v1/page-views/top`), resolved against this locale's manifest. See
 * docs/features/most-read.md.
 */

/** Fewer posts with a count than this, and the list is left out rather than drawn half empty. */
const MIN_POSTS = 3;

/** The posts asked for: the list's length, one spare for the post that leaves itself out, slack. */
const ASK_FOR = MOST_READ_LIMIT + 6;

/** The menu row of a post, plus what the most-read lists need beside it. */
export interface MostReadPost extends BlogMenuPost {
  /** The post's `translationKey`: the same in every language, and what the views are counted by. */
  key: string;
  /** The post's slug in this locale, for `BlogCoverFallback`. */
  slug: string;
  /** Articles only: the locale-relative path of its category page, for the label over the title. */
  categoryPath?: string;
  /** News only: the park it is about. */
  park?: NewsPark;
}

export interface MostRead {
  articles: MostReadPost[];
  news: MostReadPost[];
}

interface TopPageViews {
  items: { key: string; views: number }[];
}

/** One ranking, keys only. An API failure is an empty ranking: the lists are an extra. */
async function topKeys(kind: MostReadKind, locale: Locale): Promise<string[]> {
  try {
    const top = await api.get<TopPageViews>('/v1/page-views/top', {
      params: { kind, locale, days: MOST_READ_DAYS[kind], limit: ASK_FOR },
      next: { revalidate: CACHE_TTL.pageViews, tags: ['page-views'] },
    });
    return top.items.map((item) => item.key);
  } catch {
    return [];
  }
}

/**
 * The posts behind the keys, in ranking order. A key the manifest does not know (a post since
 * removed, a key nobody published) is dropped here, which is what keeps a junk write to the API off
 * the site.
 */
export async function resolveMostRead(
  keys: string[],
  posts: readonly BlogListItem[],
  locale: Locale,
  news: boolean
): Promise<MostReadPost[]> {
  const byKey = new Map(posts.map((post) => [post.translationKey, post]));
  const found = keys.flatMap((key) => byKey.get(key) ?? []).slice(0, MOST_READ_LIMIT + 1);
  if (found.length < MIN_POSTS) return [];
  return Promise.all(
    found.map(async (post) => {
      const row = toMenuPost(post, locale, 140);
      const park = news ? await resolveNewsPark(post.translationKey) : null;
      const category = news ? undefined : post.frontmatter.category;
      return {
        ...row,
        // A news post shows its age, so it carries the day it went out, as in the search index.
        ...(news && { date: post.frontmatter.date, updated: false }),
        key: post.translationKey,
        slug: post.slug,
        ...(category && { categoryPath: categoryPath(category) }),
        ...(park && { park }),
      };
    })
  );
}

/**
 * Both lists for a locale: the articles of the last 30 days, the news of the last 7. Each holds one
 * post more than it shows, so a post page can leave itself out and still list five.
 */
export async function getMostRead(locale: Locale): Promise<MostRead> {
  const [articleKeys, newsKeys] = await Promise.all([
    topKeys('article', locale),
    topKeys('news', locale),
  ]);
  const [articles, news] = await Promise.all([
    resolveMostRead(articleKeys, listArticles(locale), locale, false),
    resolveMostRead(newsKeys, listNewsByDate(locale), locale, true),
  ]);
  return { articles, news };
}
