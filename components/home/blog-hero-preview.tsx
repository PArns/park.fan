import Image from 'next/image';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listPosts } from '@/lib/blog/listing';
import { versionedPath } from '@/lib/media/focus';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import type { BlogListItem } from '@/lib/blog/types';
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

      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <HeroPreviewCard key={post.translationKey} post={post} locale={locale} />
        ))}
      </div>
    </div>
  );
}

interface HeroPreviewCardProps {
  post: BlogListItem;
  locale: Locale;
}

function HeroPreviewCard({ post, locale }: HeroPreviewCardProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, slug, readingTimeMinutes } = post;
  const date = new Date(frontmatter.date);
  const categoryPath = frontmatter.category ?? '';
  const lastSegment = categoryPath.split('/').filter(Boolean).pop() ?? '';
  const categoryLabel = categoryPath
    ? resolveCategoryLabel(categoryPath, locale, lastSegment)
    : null;
  const cover = versionedPath(frontmatter.coverImage?.src);

  return (
    <Link
      href={`/blog/${slug}` as '/'}
      className="group border-border/50 bg-background/60 hover:border-primary/40 hover:bg-background flex flex-col overflow-hidden rounded-2xl border transition-colors"
      prefetch={false}
    >
      {cover && (
        // 16:9 gives all three photos the same shape whatever their source crop is; the
        // sidecar's focal point decides what survives it.
        <div className="bg-muted relative aspect-16/9 w-full overflow-hidden">
          <Image
            src={cover}
            alt={frontmatter.coverImage?.alt ?? frontmatter.title}
            fill
            sizes="(max-width: 767px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-wider uppercase">
          {categoryLabel && <span className="text-primary">{categoryLabel}</span>}
          {categoryLabel && <span aria-hidden>·</span>}
          <span className="normal-case">
            {f.dateTime(date, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-base leading-snug font-bold transition-colors">
          {frontmatter.title}
        </h3>
        {frontmatter.excerpt && (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {frontmatter.excerpt}
          </p>
        )}
        {/* mt-auto pins the footer to the bottom, so all three line up even when one title
            wraps to two lines and its neighbours do not. */}
        {readingTimeMinutes > 0 && (
          <div className="text-muted-foreground/80 mt-auto pt-3 text-xs">
            {t('readingTime', { minutes: readingTimeMinutes })}
          </div>
        )}
      </div>
    </Link>
  );
}
