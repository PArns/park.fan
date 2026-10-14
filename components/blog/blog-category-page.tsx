import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FolderTree } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { listArticles, hasPublishedPosts } from '@/lib/blog/listing';
import {
  categoryPathBreadcrumbs,
  filterPostsByCategory,
  parseCategoryPath,
  resolveCategoryLabel,
} from '@/lib/blog/categories';
import {
  hasPage,
  listingAlternates,
  paginate,
  pagedPath,
  pagedTitle,
  splitPageSegments,
} from '@/lib/blog/pagination';
import { BlogCategoryPills, BlogPostStream } from '@/components/blog/blog-post-stream';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { categoryPath, NEWS_CATEGORY } from '@/lib/blog/paths';

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
  const fullTitle = `${pagedTitle(label, page, t('pagination.pageLabel', { page }))} | ${t('title')} · park.fan`;
  const description = t('category.description', { category: label });
  const categorySegments = parseCategoryPath(fullPath);

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      url: `${SITE_URL}/${locale}${href}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: `${SITE_URL}/${locale}${href}`,
      languages: listingAlternates((l) =>
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
  const { page } = current;
  const totalItems = allInCategory.length;
  const pageLabel = t('pagination.pageLabel', { page });

  const label = resolveCategoryLabel(fullPath, locale as Locale, segments[segments.length - 1]);

  // Build the project-standard Breadcrumb[] shape: Blog → ancestor categories.
  // The current page (label) is passed via `currentPage` so BreadcrumbNav
  // renders it un-linked, exactly like the geo pages.
  const ancestorCrumbs = categoryPathBreadcrumbs(fullPath).slice(0, -1);
  const breadcrumbs: Breadcrumb[] = [
    { name: t('blog'), url: '/blog' },
    ...ancestorCrumbs.map((crumbSegments) => {
      const cp = crumbSegments.join('/');
      return {
        name: resolveCategoryLabel(cp, locale as Locale, crumbSegments[crumbSegments.length - 1]),
        url: categoryPath(cp),
      };
    }),
  ];

  // A later page names the category as a crumb and itself as the current page.
  const categoryCrumb: Breadcrumb = { name: label, url: categoryPath(fullPath) };
  const visibleBreadcrumbs = page > 1 ? [...breadcrumbs, categoryCrumb] : breadcrumbs;
  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    categoryCrumb,
    ...(page > 1 ? [{ name: pageLabel, url: pagedPath(categoryPath(fullPath), page) }] : []),
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · ${t('title')}`}
        description={t('category.description', { category: label })}
        posts={current.items}
        path={pagedPath(categoryPath(fullPath), page)}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={visibleBreadcrumbs}
          currentPage={page > 1 ? pageLabel : label}
          variant="plain"
          className="mb-6"
        />

        <BlogSectionHeader
          as="h1"
          badge={t('category.label')}
          badgeIcon={FolderTree}
          title={label}
          meta={
            page > 1
              ? `${t('category.postsCount', { count: totalItems })} · ${t('pagination.pageOf', { page, total: current.pageCount })}`
              : t('category.postsCount', { count: totalItems })
          }
        />

        <div className="max-w-5xl">
          <BlogCategoryPills locale={locale as Locale} active={segments[0]} total={all.length} />
          <BlogPostStream locale={locale as Locale} posts={current.items} />
          <ListingPagination
            base={categoryPath(fullPath)}
            page={page}
            pageCount={current.pageCount}
          />
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
