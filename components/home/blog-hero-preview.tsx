import Image from 'next/image';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useFormatter } from 'next-intl';
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
 * Compact "latest posts" strip: the first thing below the hero, three small cards from
 * `listPosts` plus an inline "view all" link. The full {@link LatestBlogSection} further down
 * lists the same posts at full size — this is the version for visitors who scroll one notch off
 * the hero and stop.
 *
 * It used to live INSIDE the hero, under the glass card. The hero now fills the fold on its
 * own, so the strip sits on the page background instead of the photo and carries a plain card
 * surface rather than the glass it needed over the photo.
 */
export async function BlogHeroPreview({ locale }: BlogHeroPreviewProps) {
  const t = await getTranslations('blog');
  const posts = listPosts(locale).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    // Shrinks to its content (sm:w-fit) so a single post stays compact instead of stretching
    // one card across the full width.
    <div className="relative mx-auto flex w-full max-w-5xl justify-center">
      <div className="border-border/60 bg-card/60 w-full rounded-2xl border p-4 shadow-sm sm:w-fit sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            {/* sr-only h2 keeps the document outline correct (hero h1 → this section
                → post h3) without turning the eyebrow label into all-caps heading text. */}
            <h2 className="sr-only">{t('home.heading')}</h2>
            <Newspaper className="h-3.5 w-3.5" aria-hidden />
            {t('home.heading')}
          </div>
          <Link
            href="/blog"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
          >
            {t('home.viewAll')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {posts.map((post) => (
            <div key={post.translationKey} className="w-full sm:w-[17rem]">
              <HeroPreviewCard post={post} locale={locale} />
            </div>
          ))}
        </div>
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
  const { frontmatter, slug } = post;
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
      className="group border-border/50 bg-background/60 hover:border-primary/40 hover:bg-background flex items-start gap-3 overflow-hidden rounded-xl border p-2 transition-colors"
      prefetch={false}
    >
      {cover && (
        <div className="bg-muted relative h-[68px] w-20 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={cover}
            alt={frontmatter.coverImage?.alt ?? frontmatter.title}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </div>
      )}
      {/*
        Three-row grid keeps every card visually aligned regardless of title
        length: category in a fixed-height top row, title reserves room for
        2 lines via min-h so 1-line titles don't drift the date up, date
        always sits at the bottom of the same h-[68px] block as the image.
      */}
      <div className="grid h-[68px] min-w-0 flex-1 grid-rows-[auto_1fr_auto] content-between">
        <div className="text-muted-foreground text-[10px] leading-tight font-semibold tracking-wider uppercase">
          {categoryLabel ?? ' '}
        </div>
        <h3 className="text-foreground group-hover:text-primary mt-0.5 line-clamp-2 self-start text-[13px] leading-tight font-semibold transition-colors">
          {frontmatter.title}
        </h3>
        <div className="text-muted-foreground text-[11px]">
          {f.dateTime(date, { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </Link>
  );
}
