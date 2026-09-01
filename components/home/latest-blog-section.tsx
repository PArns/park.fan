import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { listPostsByRecency } from '@/lib/blog/listing';
import type { Locale } from '@/i18n/config';

interface LatestBlogSectionProps {
  locale: Locale;
  limit?: number;
  /**
   * `section` (default) is the standalone tinted band with its own
   * `BlogSectionHeader`. `bare` returns the post grid alone, for a caller that
   * has already opened the chapter — the homepage story wraps this in
   * `BlogChapter`, and a nested `<section>` there would stack a second tint and
   * a second heading inside the first.
   *
   * `lead` is `bare` with a front page's hierarchy: the newest post as one big
   * card, the four after it as rows beside it. Six equal cards say "here is an
   * archive"; one large one says "read this". Both variants are the same
   * `BlogPostCard` in its `feature` and `compact` shapes, which the component
   * already had and nothing used.
   */
  variant?: 'section' | 'bare' | 'lead';
}

// 6 fills exactly two rows of the 3-column grid below (and three rows of the
// 2-column `sm` layout), so the section never ends on a ragged half-row.
export async function LatestBlogSection({
  locale,
  limit = 6,
  variant = 'section',
}: LatestBlogSectionProps) {
  const t = await getTranslations('blog');
  const posts = listPostsByRecency(locale).slice(0, variant === 'lead' ? 5 : limit);
  if (posts.length === 0) return null;

  if (variant === 'lead') {
    const [lead, ...rest] = posts;
    return (
      // Below `lg` the lead post is a `BlogPostRow` too, so its gap to the four
      // under it has to be the gap between them — at `gap-6` it read as a
      // separate block rather than the first row of the list.
      <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-6">
        <BlogPostCard post={lead} variant="feature" />
        {rest.length > 0 && (
          // A gap, not a divided list: the row carries its own hover fill, and a
          // border between two of them cuts straight through it.
          <div className="flex flex-col gap-2 lg:gap-1">
            {rest.map((post) => (
              <BlogPostCard key={post.translationKey} post={post} variant="compact" />
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
