import 'server-only';
import { getMostReadSeed, resolveMostRead } from '@/lib/blog/most-read';
import { listArticlesByRecency, listNewsByDate } from '@/lib/blog/listing';
import { trimExcerpt } from '@/lib/navigation/blog-menu';
import { pickHeroNews, type HeroReading } from '@/lib/home/hero-search';
import type { LatestNews } from '@/components/blog/latest-news-chip';
import type { Locale } from '@/i18n/config';

/** How many of the newest news posts carry their teaser along, beyond the seed's list. */
const NEWS_EXCERPTS = 10;

/** A teaser's length: two lines of the hero's post row, cut at a word. */
const EXCERPT_CHARS = 110;

/**
 * The hero's two posts as the build saw them: the most read news post the chip does not show, and
 * the newest guide. Read from the manifest and the build's ranking, so the homepage keeps its own
 * cache window; the browser swaps in the current ranking after load.
 */
export function getHeroReading(locale: Locale, latestNews: LatestNews | null): HeroReading {
  const skipNewsSlug = latestNews?.slug ?? null;
  const seedNews = getMostReadSeed(locale).news;
  const articles = listArticlesByRecency(locale);
  const news = listNewsByDate(locale);
  // The seed's list and the newest news: a week's ranking almost always picks one of them.
  const newsKeys = new Set([
    ...seedNews.map((post) => post.key),
    ...news.slice(0, NEWS_EXCERPTS).map((post) => post.translationKey),
  ]);
  const excerpts: Record<string, string> = {};
  for (const post of [articles[0], ...news.filter((p) => newsKeys.has(p.translationKey))]) {
    const excerpt = post && trimExcerpt(post.frontmatter.excerpt, EXCERPT_CHARS);
    if (excerpt) excerpts[post.translationKey] = excerpt;
  }
  return {
    news: pickHeroNews(seedNews, skipNewsSlug),
    // An empty ranking resolves to the newest posts in order, which is the row shape wanted here.
    guide: resolveMostRead([], articles, locale, false)[0] ?? null,
    skipNewsSlug,
    // Without a news post there is no label, and no news row to carry one.
    newsLabel: latestNews?.label ?? '',
    excerpts,
  };
}
