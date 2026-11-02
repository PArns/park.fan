import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { NewsRow, ROW_LABEL_CLASS } from '@/components/blog/news-row';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { listArticlesByRecency, listNewsByDate } from '@/lib/blog/listing';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import type { Locale } from '@/i18n/config';
import { STORY_SECTION_RULED } from './section-chrome';

/** The newest articles, one row of cards on a desktop. */
const GUIDES = 3;

/** The newest news, two rows of three on a desktop and a short list on a phone. */
const NEWS = 6;

/**
 * „Neu auf park.fan": the six newest news posts, then the three newest articles, the homepage's one
 * reading chapter, right under the hero: what happened in the parks is the first thing a visitor
 * reads. News is drawn a size below the articles, as everywhere ({@link NewsRow}). The
 * manifest is read synchronously, so the chapter is in the first HTML without a `<Suspense>`,
 * and it changes with every deploy that brings a post, which is the homepage's freshest content.
 * Renders nothing where the locale publishes no posts.
 */
export async function HomeReading({ locale }: { locale: Locale }) {
  const posts = listArticlesByRecency(locale).slice(0, GUIDES);
  const news = listNewsByDate(locale).slice(0, NEWS);
  if (posts.length === 0 && news.length === 0) return null;

  const [t, tBlog] = await Promise.all([
    getTranslations('homeStory.reading'),
    getTranslations('blog'),
  ]);

  return (
    <section className={STORY_SECTION_RULED} {...linkBlockAttributes('posts')}>
      <div className="container mx-auto">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Newspaper}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            id="neu"
          />
        </Reveal>

        <Reveal>
          <NewsRow locale={locale} posts={news} markMostRead />
        </Reveal>

        {posts.length > 0 && (
          <Reveal className="mt-12">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <span className={ROW_LABEL_CLASS}>
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {resolveCategoryLabel('guides', locale, 'Guides')}
              </span>
              <Link
                href="/blog"
                prefetch={false}
                className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
              >
                {tBlog('home.viewAll')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.translationKey} post={post} markMostRead />
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
