import type { MostRead, MostReadPost } from '@/lib/blog/most-read';

/** The two rankings the site shows. A client-safe module: the lists and their labels read it. */
export type MostReadKind = 'article' | 'news';

/** The window each ranking sums over, in UTC days with today included. */
export const MOST_READ_DAYS: Record<MostReadKind, number> = { article: 30, news: 7 };

/** How many posts a most-read list shows. */
export const MOST_READ_LIMIT = 5;

/**
 * The keys asked of the API per ranking. Far more than a list shows, because the API knows keys,
 * not posts: a key the manifest has no post for (a removed post, a key someone made up) is dropped,
 * and a handful of those must not empty the list.
 */
export const MOST_READ_ASK_FOR = 40;

/** One ranking as the API returns it: keys and counts, most viewed first. */
export type MostReadRanking = { key: string; views: number }[];

/**
 * Every ranking as the last build saw it (`lib/blog/most-read-seed.generated.ts`, written by
 * `scripts/generate-most-read-seed.mjs`). `at` is null where the build did not ask the API.
 */
export interface MostReadSeed {
  at: string | null;
  rankings: Partial<Record<string, Partial<Record<MostReadKind, MostReadRanking>>>>;
}

/**
 * The views the first post needs before it is called the most read (flame, badge). Below it a
 * single reader decides, and in a quiet language that is noise.
 */
export const MOST_READ_LEADER_MIN_VIEWS = 5;

/**
 * `data` with only `kind`'s list: what a page that shows one kind hands its client component, so
 * the other list does not ride along in the page's payload.
 */
export function mostReadSeedOf(data: MostRead, kind: MostReadKind): MostRead {
  return kind === 'article'
    ? { articles: data.articles, news: [] }
    : { articles: [], news: data.news };
}

/** The kind's list in a {@link MostRead}. */
export function mostReadList(data: MostRead | undefined, kind: MostReadKind): MostReadPost[] {
  return (kind === 'article' ? data?.articles : data?.news) ?? [];
}

/**
 * The `translationKey` of the kind's most read post, or `undefined` while no post has clearly
 * earned it: at least {@link MOST_READ_LEADER_MIN_VIEWS} views and more than the second, so a tie
 * is nobody's. One question for the flame in the lists and the badge on covers and the banner.
 */
export function mostReadLeader(data: MostRead | undefined, kind: MostReadKind): string | undefined {
  const [first, second] = mostReadList(data, kind);
  if (!first || first.views < MOST_READ_LEADER_MIN_VIEWS) return undefined;
  return first.views > (second?.views ?? 0) ? first.key : undefined;
}

/**
 * The posts a list shows, each with its place in the whole ranking: without `excludeKey` (the post
 * the reader is on), cut to {@link MOST_READ_LIMIT}. Under the leader's own page the places run
 * from 2. The API route sends one spare, so leaving the current post out still fills the list.
 */
export function mostReadShown(
  data: MostRead | undefined,
  kind: MostReadKind,
  excludeKey?: string
): { post: MostReadPost; rank: number }[] {
  return mostReadList(data, kind)
    .map((post, index) => ({ post, rank: index + 1 }))
    .filter(({ post }) => post.key !== excludeKey)
    .slice(0, MOST_READ_LIMIT);
}
