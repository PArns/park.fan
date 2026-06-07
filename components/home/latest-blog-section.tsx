import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { listPosts } from '@/lib/blog';
import type { Locale } from '@/i18n/config';

interface LatestBlogSectionProps {
  locale: Locale;
  limit?: number;
}

export async function LatestBlogSection({ locale, limit = 3 }: LatestBlogSectionProps) {
  const t = await getTranslations('blog');
  const posts = listPosts(locale).slice(0, limit);
  if (posts.length === 0) return null;

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.translationKey} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
