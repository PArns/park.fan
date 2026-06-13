import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BlogLanguageNotice } from '@/components/blog/blog-language-notice';
import { Link } from '@/i18n/navigation';
import { BLOG_TOP_ID } from '@/lib/blog/toc';
import { resolveAuthor } from '@/lib/blog/authors';
import type { Locale } from '@/i18n/config';
import type { BlogPost } from '@/lib/blog/types';

interface BlogPostHeroProps {
  post: BlogPost;
  currentLocale: Locale;
  availableTranslations: Partial<Record<Locale, string>>;
}

/**
 * Inner content of the blog post header — slots inside the page-level
 * GlassCard, mirroring the park detail page header (h1 + subtitle row +
 * separator + meta). The cover image is rendered separately as a fixed
 * ParkBackground in the page route.
 */
export function BlogPostHero({ post, currentLocale, availableTranslations }: BlogPostHeroProps) {
  const f = useFormatter();
  const t = useTranslations('blog');
  const { frontmatter, readingTimeMinutes, isFallback, loadedLocale } = post;

  const author = resolveAuthor(frontmatter.author, currentLocale);
  const authorHref = author.key ? (`/blog/authors/${author.key}` as '/') : null;
  const authorInner = (
    <>
      <Avatar className="size-9">
        {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
        <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
          {author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-sm leading-tight">
        <div className="text-foreground [.group:hover_&]:text-primary font-semibold underline-offset-4 transition-colors [.group:hover_&]:underline">
          {author.name}
        </div>
        {author.bio && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{author.bio}</div>
        )}
      </div>
    </>
  );

  const date = new Date(frontmatter.date);
  const updatedAt = frontmatter.updatedAt ? new Date(frontmatter.updatedAt) : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex-1">
        <h1
          id={BLOG_TOP_ID}
          className="text-foreground scroll-mt-24 text-3xl leading-tight font-bold tracking-tight md:text-4xl"
        >
          {frontmatter.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed sm:text-lg">
          {frontmatter.excerpt}
        </p>

        <div className="border-border/60 mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-5">
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
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={frontmatter.date}>
                {f.dateTime(date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </span>
            {updatedAt && updatedAt.getTime() !== date.getTime() && (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                {t('updatedOn', {
                  date: f.dateTime(updatedAt, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t('readingTime', { minutes: readingTimeMinutes })}
            </span>
          </div>
        </div>

        <BlogLanguageNotice
          currentLocale={currentLocale}
          loadedLocale={loadedLocale}
          isFallback={isFallback}
          availableTranslations={availableTranslations}
        />
      </div>
    </div>
  );
}
