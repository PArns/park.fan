import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, CalendarRange, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { MobileMore } from '@/components/common/mobile-more';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { NewsRow } from '@/components/blog/news-row';
import type { Locale } from '@/i18n/config';

/**
 * The editorial chapter: the blog, plus the two evergreen hubs a reader who got
 * this far is most likely to want next.
 *
 * The post grid itself stays {@link LatestBlogSection} and comes in as a slot —
 * it reads the generated manifest synchronously and has its own
 * `BlogSectionHeader`, so it is wrapped rather than rebuilt.
 *
 * The two cards are here rather than in the chapters they belong to because
 * both are *destinations*, not explanations: the calendar chapter already links
 * to the best-time hub in passing, and this is where a reader is browsing rather
 * than learning.
 */
export async function BlogChapter({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // `variant="bare"` drops LatestBlogSection's own BlogSectionHeader, and with
  // it the homepage's only body link to the blog index — the hub would otherwise
  // be reachable from the chrome alone. It moves onto the chapter heading.
  const [t, tBlog, tCommon] = await Promise.all([
    getTranslations('homeStory.blog'),
    getTranslations('blog'),
    getTranslations('common'),
  ]);

  return (
    <section className="border-border border-t px-4 py-16 sm:py-18">
      {/* On a phone the posts come first and the two hub cards open on request, under the
          news (`order`), so the button does not sit between the heading and the posts. */}
      <div className="container mx-auto @max-[768px]/page:flex @max-[768px]/page:flex-col">
        <Reveal containsGlass>
          <ChapterHeading
            variant="tile"
            icon={Newspaper}
            kicker={t('kicker')}
            title={t('title')}
            hint={t('lead')}
            action={
              <Link
                href="/blog"
                prefetch={false}
                className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                {tBlog('home.viewAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
            id="blog"
          />
        </Reveal>

        <MobileMore
          label={tCommon('showMore')}
          className="@max-[768px]/page:order-2 @max-[768px]/page:mt-8"
          buttonClassName="@max-[768px]/page:order-1"
        >
          <Reveal>
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <Link
                href={`/${BEST_TIME_SEGMENTS[locale]}` as '/'}
                prefetch={false}
                className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
              >
                <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                  <CalendarRange className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{t('bestTimeTitle')}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {t('bestTimeText')}
                </p>
              </Link>

              <Link
                href={`/${GLOSSARY_SEGMENTS[locale]}` as '/'}
                prefetch={false}
                className="border-border bg-card hover:border-primary/40 rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
              >
                <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{t('glossaryCta')}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {t('glossaryText')}
                </p>
              </Link>
            </div>
          </Reveal>
        </MobileMore>

        {children}

        {/* News under the articles, a size smaller — see `NewsRow`. */}
        <NewsRow locale={locale} className="mt-8" />
      </div>
    </section>
  );
}
