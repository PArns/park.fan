import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, CalendarRange, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
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
  const [t, tBlog] = await Promise.all([
    getTranslations('homeStory.blog'),
    getTranslations('blog'),
  ]);

  return (
    <section className="border-border border-t px-4 py-16 sm:py-18">
      <div className="container mx-auto">
        <Reveal>
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

        <Reveal>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <Link
              href={`/${BEST_TIME_SEGMENTS[locale]}` as '/'}
              prefetch={false}
              className="border-border bg-card hover:border-primary/40 group rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
            >
              <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                <CalendarRange className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{t('bestTimeTitle')}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {t('bestTimeText')}
              </p>
              <ArrowRight
                className="text-primary mt-3 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link
              href={`/${GLOSSARY_SEGMENTS[locale]}` as '/'}
              prefetch={false}
              className="border-border bg-card hover:border-primary/40 group flex flex-col rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
            >
              <span className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{t('glossaryCta')}</h3>
              <ArrowRight
                className="text-primary mt-auto h-4 w-4 pt-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>

        {children}
      </div>
    </section>
  );
}
