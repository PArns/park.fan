import { FolderOpen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import {
  FILTER_PILL_ROW_CLASS,
  filterPillClass,
  PostStreamEntry,
  PostStreamGroups,
  PostStreamLabel,
  type PostStreamGroup,
} from '@/components/blog/post-stream';
import { MostReadBadge } from '@/components/blog/most-read-badge';
import { listTopCategories, resolveCategoryLabel } from '@/lib/blog/categories';
import { lastTouched } from '@/lib/blog/listing';
import { categoryPath, postPath } from '@/lib/blog/paths';
import type { BlogListItem } from '@/lib/blog/types';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

/** The group a post is listed under: its publication month, `YYYY-MM`, or the featured posts. */
const FEATURED_GROUP = 'featured';

/**
 * One page of a blog listing (the index, a category, a tag, an author) in the stream `/news`
 * draws (`PostStreamGroups`), grouped by the month a post went out. The listings keep publication
 * order, so a page holds the same posts until a new one is published; `updatedAt` shows in the
 * row instead. Featured posts sort first in `listArticles` and get a group of their own, so a
 * month is never split around them.
 */
export async function BlogPostStream({
  locale,
  posts,
}: {
  locale: Locale;
  posts: readonly BlogListItem[];
}) {
  const t = await getTranslations('blog');
  const monthFormat = getDateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayFormat = getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const groups: PostStreamGroup[] = [];
  for (const post of posts) {
    const key = post.frontmatter.featured ? FEATURED_GROUP : post.frontmatter.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        heading: (
          <h2 className="text-foreground text-sm font-semibold">
            {key === FEATURED_GROUP ? (
              t('featured')
            ) : (
              <time dateTime={key}>{monthFormat.format(new Date(`${key}-01T00:00:00Z`))}</time>
            )}
          </h2>
        ),
        items: [],
      };
      groups.push(group);
    }

    const { frontmatter } = post;
    const category = frontmatter.category;
    const updated = lastTouched(frontmatter);
    const src = frontmatter.coverImage?.src;
    group.items.push({
      key: post.translationKey,
      node: (
        <PostStreamEntry
          href={postPath(post)}
          title={frontmatter.title}
          excerpt={frontmatter.excerpt}
          label={
            category ? (
              <PostStreamLabel href={categoryPath(category)} icon={FolderOpen}>
                {resolveCategoryLabel(
                  category,
                  locale,
                  category.split('/').filter(Boolean).pop() ?? ''
                )}
              </PostStreamLabel>
            ) : undefined
          }
          meta={
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <time dateTime={frontmatter.date}>
                {dayFormat.format(new Date(frontmatter.date))}
              </time>
              <span aria-hidden="true">·</span>
              <span>{t('readingTime', { minutes: post.readingTimeMinutes })}</span>
              {updated !== frontmatter.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t('updatedOn', { date: dayFormat.format(new Date(updated)) })}</span>
                </>
              )}
              {post.isFallback && (
                <Badge variant="outline" className="h-4 text-[9px] tracking-wider uppercase">
                  {post.loadedLocale}
                </Badge>
              )}
            </span>
          }
          image={versionedPath(src) ?? src ?? null}
          imagePosition={objectPositionForSrc(src, '50% 50%')}
          fallbackSlug={post.slug}
          badge={<MostReadBadge kind="article" postKey={post.translationKey} variant="auto" />}
        />
      ),
    });
  }

  return <PostStreamGroups groups={groups} />;
}

/**
 * The blog's categories as pills over a listing, the look of the park filter on `/news`, but
 * links: each category is a page of its own. `active` is the top-level category the page lists,
 * `null` on the index, where "all" is the chosen one.
 */
export async function BlogCategoryPills({
  locale,
  active,
  total,
}: {
  locale: Locale;
  active: string | null;
  /** How many articles the index lists, on the "all" pill. */
  total: number;
}) {
  const t = await getTranslations('blog');
  const categories = listTopCategories(locale);
  if (categories.length < 2) return null;

  return (
    <nav aria-label={t('categories')}>
      <ul className={FILTER_PILL_ROW_CLASS}>
        <li>
          <Link
            href="/blog"
            prefetch={false}
            aria-current={active === null ? 'true' : undefined}
            className={filterPillClass(active === null)}
          >
            {t('filter.all')}
            <span className="tabular-nums opacity-70">{total}</span>
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.path}>
            <Link
              href={categoryPath(category.path) as '/'}
              prefetch={false}
              aria-current={active === category.path ? 'true' : undefined}
              className={filterPillClass(active === category.path)}
            >
              {category.label}
              <span className="tabular-nums opacity-70">{category.postCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
