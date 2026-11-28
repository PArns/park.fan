import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FolderTree } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata, alternateLanguages } from '@/lib/utils/metadata';
import { listArticles, hasPublishedPosts } from '@/lib/blog/listing';
import {
  categoryPathBreadcrumbs,
  filterPostsByCategory,
  parseCategoryPath,
  resolveCategoryLabel,
} from '@/lib/blog/categories';
import { hasPage, paginate, pagedPath, pagedTitle, splitPageSegments } from '@/lib/blog/pagination';
import { BlogCategoryPills } from '@/components/blog/blog-post-stream';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { categoryPath, NEWS_CATEGORY } from '@/lib/blog/paths';
import { BlogListingPage } from '@/components/blog/blog-listing-page';

/**
 * Metadata for a blog category listing at `/blog/category/[...path]`, where the path may end in
 * `/page/<n>` (`splitPageSegments`). Articles only: the news category's posts live under `/news`
 * (`NewsIndexPageBody`). Canonical, hreflang and breadcrumbs come from `categoryPath`
 * (`lib/blog/paths.ts`); a later page is its own canonical, like every listing page.
 */
export async function buildCategoryMetadata(locale: string, path: string[]): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const split = splitPageSegments(path);
  if (!split) return {};
  const { segments, page } = split;
  const fullPath = segments.join('/');
  const href = pagedPath(categoryPath(fullPath), page);
  const lastSegment = segments[segments.length - 1] ?? '';
  const label = resolveCategoryLabel(fullPath, locale as Locale, lastSegment);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', ...segments]);
  const fullTitle = pagedTitle(label, page, t('pagination.pageLabel', { page }));
  const description = t('category.description', { category: label });
  const categorySegments = parseCategoryPath(fullPath);

  return {
    title: { absolute: fullTitle },
    description,
    ...buildOpenGraphMetadata({
      locale,
      title: fullTitle,
      description,
      url: `${SITE_URL}/${locale}${href}`,
      ogImageUrl,
      alternateLocale: false,
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}${href}`,
      languages: alternateLanguages((l) =>
        hasPage(filterPostsByCategory(listArticles(l), categorySegments).length, page) ? href : null
      ),
      // No per-category feed (a few categories over few posts would repeat one post at a second
      // URL), so a category page points at the locale's main feed, as autodiscovery asks.
      types: blogFeedAlternates(locale as Locale),
    },
  };
}

/**
 * Renders a page of a blog category listing: breadcrumbs, the category pills, the category's
 * articles in the blog's stream and the page links, plus Blog and BreadcrumbList JSON-LD. 404s
 * for an unknown or empty category and for a page it does not have; `news` redirects to `/news`.
 */
export async function BlogCategoryPageBody({ locale, path }: { locale: string; path: string[] }) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  // `/blog/category/news` is `/news` now. The proxy 308s it before anything renders
  // (`lib/blog/news-redirects-rule.ts`); this is the net behind it.
  if (path.join('/') === NEWS_CATEGORY) permanentRedirect(`/${locale}/news`);
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const split = splitPageSegments(path);
  if (!split) notFound();
  const segments = parseCategoryPath(split.segments.join('/'));
  if (segments.length === 0) notFound();

  const t = await getTranslations('blog');
  const all = listArticles(locale as Locale);
  const allInCategory = filterPostsByCategory(all, segments);
  if (allInCategory.length === 0) notFound();

  const fullPath = segments.join('/');
  const current = paginate(allInCategory, split.page);
  if (!current) notFound();

  const label = resolveCategoryLabel(fullPath, locale as Locale, segments[segments.length - 1]);

  // Blog → ancestor categories; the category itself is the listing's own crumb.
  const ancestorCrumbs = categoryPathBreadcrumbs(fullPath).slice(0, -1);
  const ancestors: Breadcrumb[] = [
    { name: t('blog'), url: '/blog' },
    ...ancestorCrumbs.map((crumbSegments) => {
      const cp = crumbSegments.join('/');
      return {
        name: resolveCategoryLabel(cp, locale as Locale, crumbSegments[crumbSegments.length - 1]),
        url: categoryPath(cp),
      };
    }),
  ];

  return (
    <BlogListingPage
      locale={locale}
      label={label}
      description={t('category.description', { category: label })}
      basePath={categoryPath(fullPath)}
      ancestors={ancestors}
      badge={t('category.label')}
      badgeIcon={FolderTree}
      postsCount={t('category.postsCount', { count: allInCategory.length })}
      current={current}
    >
      <BlogCategoryPills locale={locale as Locale} active={segments[0]} total={all.length} />
    </BlogListingPage>
  );
}
