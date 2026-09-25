import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { isNewsPost, listArticles, listNewsByDate, listPosts } from '@/lib/blog/listing';
import { postPath } from '@/lib/blog/paths';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface BlogPostNavProps {
  locale: Locale;
  currentTranslationKey: string;
}

/**
 * Previous / next links between adjacent posts of the same section: an article
 * walks the blog's listing order (`listArticles`), a news post walks the news
 * (`listNewsByDate`), so neither section hands its reader over to the other.
 * Renders nothing when the current post can't be located or has no neighbours.
 */
export async function BlogPostNav({ locale, currentTranslationKey }: BlogPostNavProps) {
  const t = await getTranslations('blog');
  const current = listPosts(locale).find((p) => p.translationKey === currentTranslationKey);
  if (!current) return null;
  const posts = isNewsPost(current) ? listNewsByDate(locale) : listArticles(locale);
  const idx = posts.findIndex((p) => p.translationKey === currentTranslationKey);
  if (idx === -1) return null;

  const prev = posts[idx - 1];
  const next = posts[idx + 1];
  if (!prev && !next) return null;

  // Two neighbours share a row; a lone neighbour spans the full column width so
  // the nav never renders as a stranded half-width card.
  const both = Boolean(prev && next);

  return (
    <nav
      aria-label={t('postNav.label')}
      className={cn('mt-8 grid gap-3', both && 'sm:grid-cols-2')}
    >
      {prev && (
        <Link
          href={postPath(prev) as '/'}
          className="border-border/60 bg-background/60 hover:border-primary/40 hover:bg-background/80 group flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md transition-colors"
        >
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('postNav.previous')}
          </span>
          <span className="text-foreground group-hover:text-primary line-clamp-2 font-semibold transition-colors">
            {prev.frontmatter.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={postPath(next) as '/'}
          className={cn(
            'border-border/60 bg-background/60 hover:border-primary/40 hover:bg-background/80 group flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md transition-colors',
            both && 'text-right sm:col-start-2'
          )}
        >
          <span
            className={cn(
              'text-muted-foreground inline-flex items-center gap-1 text-xs font-medium',
              both && 'justify-end'
            )}
          >
            {t('postNav.next')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-foreground group-hover:text-primary line-clamp-2 font-semibold transition-colors">
            {next.frontmatter.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
