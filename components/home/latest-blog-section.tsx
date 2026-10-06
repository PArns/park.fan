import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { listArticlesByRecency } from '@/lib/blog/listing';
import type { Locale } from '@/i18n/config';

// Articles only: news posts have their own row (`NewsRow`), see `isNewsPost`.
interface LatestBlogSectionProps {
  locale: Locale;
  limit?: number;
  /**
   * `section` (default) is the standalone tinted band with its own `BlogSectionHeader`. `bare`
   * returns the post grid alone, for a caller that already opened the chapter (the homepage
   * story's `BlogChapter`). `lead` is `bare` with a front page's hierarchy: the newest post as one
   * big card and the next ones as rows beside it.
   */
  variant?: 'section' | 'bare' | 'lead';
}

/**
 * How many rows stand beside the `lead` variant's feature card, and how many a phone gets. Six
 * rows end near the card's lower edge at desktop width, and the grid stretches whichever column
 * ends first; below `lg` the columns stack and every extra row is more to scroll past.
 */
const LEAD_ROWS = 6;
const LEAD_ROWS_PHONE = 4;

/**
 * The newest blog articles, as a tinted section, a bare grid or a lead layout (see `variant`). The
 * default `limit` of 6 fills two rows of the 3-column grid and three of the 2-column one.
 */
export async function LatestBlogSection({
  locale,
  limit = 6,
  variant = 'section',
}: LatestBlogSectionProps) {
  const t = await getTranslations('blog');
  const posts = listArticlesByRecency(locale).slice(0, variant === 'lead' ? LEAD_ROWS + 1 : limit);
  if (posts.length === 0) return null;

  if (variant === 'lead') {
    const [lead, ...rest] = posts;
    return (
      // Below `lg` the lead post is a `BlogPostRow` too, so its gap to the rows under it is
      // theirs. The two columns stretch rather than keeping their own heights, so the shorter one
      // grows into the difference instead of leaving a hole under it.
      <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
        <BlogPostCard post={lead} variant="feature" />
        {rest.length > 0 && (
          // A gap, not a divided list: the row carries its own hover fill, and a
          // border between two of them cuts straight through it.
          <div className="flex flex-col gap-2 lg:gap-1">
            {rest.map((post, index) => (
              <BlogPostCard
                key={post.translationKey}
                post={post}
                variant="compact"
                className={index >= LEAD_ROWS_PHONE ? 'hidden lg:flex' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const grid = (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post.translationKey} post={post} />
      ))}
    </div>
  );

  if (variant === 'bare') return grid;

  return (
    <section className="bg-muted/30 relative isolate px-4 py-14">
      <div
        className="from-primary/5 via-background/0 to-background/0 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br"
        aria-hidden="true"
      />
      <div className="container mx-auto">
        <BlogSectionHeader
          glass={false}
          badge={t('badge')}
          title={t('home.heading')}
          intro={t('home.intro')}
          action={{
            label: t('home.viewAll'),
            href: '/blog',
            icon: ArrowRight,
          }}
        />
        {grid}
      </div>
    </section>
  );
}
