import 'server-only';
import { getMostReadSeed, resolveMostRead } from '@/lib/blog/most-read';
import { listArticlesByRecency } from '@/lib/blog/listing';
import { pickHeroNews, type HeroReading } from '@/lib/home/hero-search';
import type { LatestNews } from '@/components/blog/latest-news-chip';
import type { Locale } from '@/i18n/config';

/**
 * The hero's two posts as the build saw them: the most read news post the chip does not show, and
 * the newest guide. Read from the manifest and the build's ranking, so the homepage keeps its own
 * cache window; the browser swaps in the current ranking after load.
 */
export function getHeroReading(locale: Locale, latestNews: LatestNews | null): HeroReading {
  const skipNewsSlug = latestNews?.slug ?? null;
  return {
    news: pickHeroNews(getMostReadSeed(locale).news, skipNewsSlug),
    // An empty ranking resolves to the newest posts in order, which is the row shape wanted here.
    guide: resolveMostRead([], listArticlesByRecency(locale), locale, false)[0] ?? null,
    skipNewsSlug,
    // Without a news post there is no label, and no news row to carry one.
    newsLabel: latestNews?.label ?? '',
  };
}
