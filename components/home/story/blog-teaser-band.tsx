import { getTranslations } from 'next-intl/server';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { listArticlesByRecency } from '@/lib/blog/listing';
import { NewsRow } from '@/components/blog/news-row';
import type { Locale } from '@/i18n/config';

/**
 * The three newest articles, in a card directly under the hero, the one place that reaches a
 * reader who has not decided to scroll. From `lg` up only; the blog chapter further down carries
 * the same posts, and news has its own row ({@link NewsRow}). No `<Suspense>`:
 * `listArticlesByRecency` reads the manifest synchronously, and a boundary would drop the band out
 * of the first HTML and shift the page when it returns. `BlogPostCard` brings its own row
 * template, see docs/rules/blog-spotlight-cards.md. Renders nothing where the locale publishes no
 * posts.
 */
export async function BlogTeaserBand({ locale }: { locale: Locale }) {
  const [t, tBlog] = await Promise.all([
    getTranslations('homeStory.blogTeaser'),
    getTranslations('blog'),
  ]);

  const posts = listArticlesByRecency(locale).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    // Desktop only: on a phone this band would be a screen and a half of blog before the site has
    // said what it is. Phones meet the blog in the chapter further down.
    <section className="hidden px-4 pt-8 pb-4 lg:block">
      <div className="container mx-auto">
        <div className="border-border bg-card/40 rounded-2xl border p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
              <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
              {t('label')}
            </span>
            <Link
              href="/blog"
              prefetch={false}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {tBlog('home.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.translationKey} post={post} />
            ))}
          </div>

          <NewsRow locale={locale} className="mt-5" />
        </div>
      </div>
    </section>
  );
}
