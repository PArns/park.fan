import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FolderTree } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { generateAlternateLanguages, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { BLOG_POSTS_PER_PAGE, listPosts, hasPublishedPosts } from '@/lib/blog/listing';
import {
  categoryPathBreadcrumbs,
  filterPostsByCategory,
  parseCategoryPath,
  resolveCategoryLabel,
} from '@/lib/blog/categories';
import { BlogPostGrid } from '@/components/blog/blog-post-grid';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
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
 * A category listing, shared by `/blog/category/[...path]` and `/news`. The news category's
 * listing is the news overview at `/news` (`categoryPath` in `lib/blog/paths.ts`); every other
 * category keeps its `/blog/category/…` URL. Canonical, hreflang and breadcrumbs all come from
 * `categoryPath`, so the two routes cannot disagree about which URL a category has.
 */
export async function buildCategoryMetadata(locale: string, path: string[]): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const fullPath = path.join('/');
  const href = categoryPath(fullPath);
  const lastSegment = path[path.length - 1] ?? '';
  const label = resolveCategoryLabel(fullPath, locale as Locale, lastSegment);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', ...path]);
  const fullTitle = `${label} | ${t('title')} · park.fan`;
  const description = t('category.description', { category: label });

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
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${href}`),
        'x-default': `${SITE_URL}/en${href}`,
      },
      // The one blog listing that never had this. There is no per-category feed
      // — three categories over seven posts would mostly be one post at a
      // second URL — so a category page points at the locale's feed, which is
      // also what the autodiscovery spec asks for: one link, the main feed.
      types: blogFeedAlternates(locale as Locale),
    },
  };
}

export async function BlogCategoryPageBody({
  locale,
  path,
  section,
}: {
  locale: string;
  path: string[];
  section: 'blog' | 'news';
}) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  // `/blog/category/news` is `/news` now. The proxy 308s it before anything renders
  // (`lib/blog/news-redirects-rule.ts`); this is the net behind it.
  if (section === 'blog' && path.join('/') === NEWS_CATEGORY) permanentRedirect(`/${locale}/news`);
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const segments = parseCategoryPath(path.join('/'));
  if (segments.length === 0) notFound();

  const t = await getTranslations('blog');
  const all = listPosts(locale as Locale);
  const allInCategory = filterPostsByCategory(all, segments);
  if (allInCategory.length === 0) notFound();

  const fullPath = segments.join('/');
  const visiblePosts = allInCategory.slice(0, BLOG_POSTS_PER_PAGE);
  const totalItems = allInCategory.length;

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

  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    { name: label, url: categoryPath(fullPath) },
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · ${t('title')}`}
        description={t('category.description', { category: label })}
        posts={visiblePosts}
        path={categoryPath(fullPath)}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={label}
          variant="plain"
          className="mb-6"
        />

        <BlogSectionHeader
          as="h1"
          badge={t('category.label')}
          badgeIcon={FolderTree}
          title={label}
          meta={t('category.postsCount', { count: totalItems })}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <BlogPostGrid posts={visiblePosts} />
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <BlogCategoryTree locale={locale as Locale} activePath={fullPath} />
            <BlogTagCloud locale={locale as Locale} />
          </aside>
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
