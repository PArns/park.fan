import { getTranslations } from 'next-intl/server';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { NewsList, type NewsListItem } from '@/components/blog/news-list';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { listNewsByDate, NEWS_CATEGORY } from '@/lib/blog/listing';
import { versionedPath } from '@/lib/media/focus';
import { cn } from '@/lib/utils';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

/** A listing item as {@link NewsList} draws it — cover versioned, like every other card. */
export function toNewsListItem(post: BlogListItem): NewsListItem {
  const src = post.frontmatter.coverImage?.src;
  return {
    slug: post.slug,
    title: post.frontmatter.title,
    date: post.frontmatter.date,
    image: versionedPath(src) ?? src ?? null,
  };
}

/**
 * The news posts as one row of their own, under the articles.
 *
 * News is short and will be published far more often than the guides, so it gets
 * a line of its own instead of a share of the article slots — a small label, a link
 * to the news category and a {@link NewsList}. The articles above keep their space
 * however many notes land in a week.
 *
 * `posts` defaults to the three newest news posts; the park and ride pages pass
 * their own. Nothing is dropped for its age — news is content and stays listed;
 * each item shows how old it is instead (`NewsAge`). Synchronous
 * manifest data, so no `<Suspense>`: see `BlogTeaserBand`. Renders nothing when
 * there is no news.
 */
export async function NewsRow({
  locale,
  posts,
  boxed = false,
  className,
}: {
  locale: Locale;
  posts?: readonly BlogListItem[];
  /**
   * Draw the row on a card of its own instead of under a hairline. For the park and
   * ride pages, whose sections stand on the park photo: bare text there is unreadable.
   */
  boxed?: boolean;
  className?: string;
}) {
  const items = (posts ?? listNewsByDate(locale).slice(0, 3)).map(toNewsListItem);
  if (items.length === 0) return null;

  const t = await getTranslations('navigation');
  const label = resolveCategoryLabel(NEWS_CATEGORY, locale, 'News');

  return (
    <div
      className={cn(
        boxed
          ? 'border-border bg-card rounded-2xl border p-4 shadow-sm'
          : 'border-border/60 border-t pt-4',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-[0.12em] uppercase">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        <Link
          href={`/blog/category/${NEWS_CATEGORY}` as '/'}
          prefetch={false}
          className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
        >
          {t('allNews')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <NewsList items={items} className="sm:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
