import { getTranslations } from 'next-intl/server';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { listArticlesByRecency, listNewsByDate } from '@/lib/blog/listing';
import { getMostReadSeed } from '@/lib/blog/most-read';
import type { Locale } from '@/i18n/config';
import { HomeStop } from './home-stop';
import { NewsBoard } from './news-board';

/** The most read articles on the board. */
const ARTICLES = 4;

/** The newest news on the board. */
const NEWS = 6;

/**
 * News and guides, the homepage's first stop under the hero: the six newest news posts and the
 * four most read articles of the last 30 days, as the build's seed ranks them (`getMostReadSeed`,
 * which falls back to the newest), on one board ({@link NewsBoard}). Both are read synchronously, so
 * the stop is in the first HTML without a `<Suspense>`, and it changes with every deploy that
 * brings a post, which is the homepage's freshest content. Renders nothing where the locale
 * publishes no posts.
 */
export async function HomeReading({ locale }: { locale: Locale }) {
  const byKey = new Map(listArticlesByRecency(locale).map((post) => [post.translationKey, post]));
  const articles = getMostReadSeed(locale)
    .articles.flatMap((read) => byKey.get(read.key) ?? [])
    .slice(0, ARTICLES);
  const news = listNewsByDate(locale).slice(0, NEWS);
  if (articles.length === 0 && news.length === 0) return null;

  const t = await getTranslations('homeStory.reading');

  return (
    <HomeStop
      stacked
      block="posts"
      // The first stop sits right under the hero, which already ends in room of its own.
      className="[&>div]:pt-8 sm:[&>div]:pt-12"
      heading={<ChapterHeading variant="stop" title={t('title')} hint={t('lead')} id="neu" />}
    >
      <Reveal>
        <NewsBoard locale={locale} news={news} articles={articles} />
      </Reveal>
    </HomeStop>
  );
}
