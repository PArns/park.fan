import { ArrowRight, Newspaper } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listPosts } from '@/lib/blog/listing';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import type { Locale } from '@/i18n/config';

interface BlogHeroPreviewProps {
  locale: Locale;
}

/**
 * The "latest posts" strip directly below the hero: three cards across the full container
 * width, each with its cover photo, category, title and the opening lines of the post. The
 * full {@link LatestBlogSection} further down lists the same posts again — this is what a
 * visitor sees who scrolls one notch off the hero and stops, so it has to be worth stopping at.
 *
 * It used to live INSIDE the hero as a row of thumbnail-sized links. The hero now fills the
 * fold on its own, so this sits on the page background and can afford the space.
 */
export async function BlogHeroPreview({ locale }: BlogHeroPreviewProps) {
  const t = await getTranslations('blog');
  const posts = listPosts(locale).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <div className="border-border/60 bg-card/60 w-full rounded-3xl border p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          {/* sr-only h2 keeps the document outline correct (hero h1 → this section
              → post h3) without turning the eyebrow label into all-caps heading text. */}
          <h2 className="sr-only">{t('home.heading')}</h2>
          <Newspaper className="h-4 w-4" aria-hidden />
          {t('home.heading')}
        </div>
        <Link
          href="/blog"
          prefetch={false}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          {t('home.viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* The same BlogPostCard the rest of the site uses — photo behind two glass panels, the
          ParkCard/AttractionCard visual language. This strip used to draw its own look-alike
          (photo on top, text below), which made the first blog cards a visitor sees the only
          ones on the site that do not match the cards around them. */}
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.translationKey} post={post} />
        ))}
      </div>
    </div>
  );
}
