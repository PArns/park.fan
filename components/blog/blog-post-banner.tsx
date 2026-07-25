import Image from 'next/image';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@/i18n/navigation';
import { BLOG_TOP_ID } from '@/lib/blog/toc';
import { resolveAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import type { BlogPost } from '@/lib/blog/types';

interface BlogPostBannerProps {
  post: BlogPost;
  currentLocale: Locale;
  /** Small eyebrow above the title — the category, or the blog badge. */
  kicker: string;
}

/**
 * Full-bleed article hero: the cover photo runs edge-to-edge behind the header
 * bar (which floats transparent over it), with the title, excerpt and byline in
 * white on top and a theme-aware fade into the page at the bottom — the same
 * language as the Fancast page and the best-time hub. Covers without an image
 * fall back to a dark brand gradient so the floating header stays legible.
 */
export function BlogPostBanner({ post, currentLocale, kicker }: BlogPostBannerProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, readingTimeMinutes } = post;

  // Match the route's cover rule: skip SVG covers (a PNG is generated for OG).
  const cover =
    frontmatter.coverImage?.src && !/\.svg(\?|$)/i.test(frontmatter.coverImage.src)
      ? frontmatter.coverImage.src
      : null;
  const coverAlt = frontmatter.coverImage?.alt ?? frontmatter.title;

  const author = resolveAuthor(frontmatter.author, currentLocale);
  const authorHref = author.key ? (`/blog/authors/${author.key}` as '/') : null;
  const date = new Date(frontmatter.date);
  const updatedAt = frontmatter.updatedAt ? new Date(frontmatter.updatedAt) : null;

  const authorInner = (
    <>
      <Avatar className="ring-border size-9 ring-2">
        {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
        <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
          {author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-foreground font-semibold underline-offset-4 [.group:hover_&]:underline">
        {author.name}
      </span>
    </>
  );

  return (
    <header className="relative isolate -mt-14 flex min-h-[58vh] items-end overflow-hidden sm:min-h-[66vh]">
      {cover ? (
        <Image src={cover} alt={coverAlt} fill priority sizes="100vw" className="object-cover" />
      ) : (
        <div className="from-primary/15 via-background to-muted absolute inset-0 bg-gradient-to-br" />
      )}
      {/* Title/excerpt/byline sit directly on the cover (no panel). Readability
          comes from a theme-aware tint that fades into the page background — a dark
          tint in dark mode, a light tint in light mode — so the cover never gets a
          dark overlay in light mode and never fades dark→white. */}
      <div
        aria-hidden
        className="from-background via-background/70 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t"
      />
      <div
        aria-hidden
        className="from-background/40 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
      />

      <div className="text-foreground relative container mx-auto px-4 pt-32 pb-14 sm:pb-20">
        <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="bg-primary inline-block h-2 w-2 rounded-full" />
          {kicker}
        </p>
        <h1
          id={BLOG_TOP_ID}
          className="text-foreground max-w-4xl scroll-mt-24 text-3xl font-black tracking-tight sm:text-5xl"
        >
          {frontmatter.title}
        </h1>
        <p className="text-foreground/80 mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          {frontmatter.excerpt}
        </p>

        <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {authorHref ? (
            <Link
              href={authorHref}
              className="group flex items-center gap-2.5"
              aria-label={author.name}
            >
              {authorInner}
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">{authorInner}</div>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <time dateTime={frontmatter.date}>
              {f.dateTime(date, { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          </span>
          {updatedAt && updatedAt.getTime() !== date.getTime() && (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" />
              {t('updatedOn', {
                date: f.dateTime(updatedAt, { day: 'numeric', month: 'long', year: 'numeric' }),
              })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t('readingTime', { minutes: readingTimeMinutes })}
          </span>
        </div>
      </div>
    </header>
  );
}
