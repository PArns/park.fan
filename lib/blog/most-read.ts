import 'server-only';
import type { Locale } from '@/i18n/config';
import { api } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { listArticlesByRecency, listNewsByDate } from '@/lib/blog/listing';
import type { BlogListItem } from '@/lib/blog/types';
import { toMenuPost } from '@/lib/navigation/blog-menu';
import { MOST_READ_SEED } from '@/lib/blog/most-read-seed.generated';
import {
  MOST_READ_ASK_FOR,
  MOST_READ_DAYS,
  MOST_READ_LIMIT,
  type MostReadKind,
  type MostReadRanking,
} from '@/lib/blog/most-read-config';

/**
 * The most read articles and news of one language, from the API's page-view ranking
 * (`/v1/page-views/top`), resolved against this locale's manifest. See
 * docs/features/most-read.md.
 */

/** What a most-read row draws, and nothing else: the list is fetched on every page with a menu. */
export interface MostReadPost {
  /** The post's `translationKey`: the same in every language, and what the views are counted by. */
  key: string;
  /** Locale-relative URL of the post, from `postPath`. */
  path: string;
  title: string;
  /** Articles: the category label over the title. */
  category?: string;
  /** News: the day it went out, which `NewsAge` prints. */
  date?: string;
  image?: string;
  imagePosition?: string;
  /** The post's slug in this locale, for `BlogCoverFallback`. */
  slug: string;
  /** Views in the window; 0 for a post the list was filled up with. */
  views: number;
}

export interface MostRead {
  articles: MostReadPost[];
  news: MostReadPost[];
}

/** One ranking. Throws on an API failure, which the route answers with a 502 nobody caches. */
async function topViews(kind: MostReadKind, locale: Locale): Promise<MostReadRanking> {
  const top = await api.get<{ items: MostReadRanking }>('/v1/page-views/top', {
    params: { kind, locale, days: MOST_READ_DAYS[kind], limit: MOST_READ_ASK_FOR },
    next: { revalidate: CACHE_TTL.pageViews, tags: ['page-views'] },
  });
  return top.items;
}

function toMostReadPost(post: BlogListItem, locale: Locale, news: boolean, views: number) {
  // No excerpt: a most-read row prints none.
  const row = toMenuPost(post, locale, 0);
  return {
    key: post.translationKey,
    path: row.path,
    title: row.title,
    ...(news ? { date: post.frontmatter.date } : row.category ? { category: row.category } : {}),
    ...(row.image && { image: row.image, imagePosition: row.imagePosition }),
    slug: post.slug,
    views,
  } satisfies MostReadPost;
}

/**
 * The posts behind the ranking, most read first, always {@link MOST_READ_LIMIT} + 1 long (one spare
 * for the post that leaves itself out). A key the manifest does not know is dropped, which keeps a
 * junk write to the API off the site. Where fewer posts were read in the window, the newest unread
 * ones follow with 0 views: a tie broken by recency, so every list has the height its placeholder
 * reserved. `posts` comes newest first.
 */
export function resolveMostRead(
  ranking: MostReadRanking,
  posts: readonly BlogListItem[],
  locale: Locale,
  news: boolean
): MostReadPost[] {
  const want = MOST_READ_LIMIT + 1;
  const byKey = new Map(posts.map((post) => [post.translationKey, post]));
  const ranked = ranking.flatMap(({ key, views }) => {
    const post = byKey.get(key);
    return post && views > 0 ? [toMostReadPost(post, locale, news, views)] : [];
  });
  const listed = new Set(ranked.map((post) => post.key));
  const filler = posts
    .filter((post) => !listed.has(post.translationKey))
    .slice(0, Math.max(0, want - ranked.length))
    .map((post) => toMostReadPost(post, locale, news, 0));
  return [...ranked, ...filler].slice(0, want);
}

function resolveLists(
  locale: Locale,
  rankings: Partial<Record<MostReadKind, MostReadRanking>>
): MostRead {
  return {
    articles: resolveMostRead(rankings.article ?? [], listArticlesByRecency(locale), locale, false),
    news: resolveMostRead(rankings.news ?? [], listNewsByDate(locale), locale, true),
  };
}

/** Both lists for a locale, current: the articles of the last 30 days, the news of the last 7. */
export async function getMostRead(locale: Locale): Promise<MostRead> {
  const [article, news] = await Promise.all([
    topViews('article', locale),
    topViews('news', locale),
  ]);
  return resolveLists(locale, { article, news });
}

/**
 * Both lists as the last build saw them (`scripts/generate-most-read-seed.mjs`), for a page to
 * render into its HTML: a crawler finds the links, and the browser swaps in {@link getMostRead}'s
 * after load. No request and no `revalidate`, so the page keeps its own cache window. A build
 * that could not reach the API renders the newest posts.
 */
export function getMostReadSeed(locale: Locale): MostRead {
  return resolveLists(locale, MOST_READ_SEED.rankings[locale] ?? {});
}
