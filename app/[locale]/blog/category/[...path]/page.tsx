import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FolderTree } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { generateAlternateLanguages, locales, localeToOpenGraphLocale } from '@/i18n/config';
import { BLOG_POSTS_PER_PAGE, listPosts } from '@/lib/blog';
import {
  buildCategoryTree,
  categoryPathBreadcrumbs,
  filterPostsByCategory,
  parseCategoryPath,
  resolveCategoryLabel,
} from '@/lib/blog/categories';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { BlogBottomSections } from '@/components/blog/blog-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface CategoryPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

// Statically generated for every category in every locale. See the index
// page for the pagination plan when post counts grow past one page.

export async function generateStaticParams() {
  const out: Array<{ locale: string; path: string[] }> = [];
  for (const locale of locales) {
    const { flat } = buildCategoryTree(locale);
    for (const path of flat.keys()) {
      out.push({ locale, path: path.split('/') });
    }
  }
  return out;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, path } = await params;
  if (!routing.locales.includes(locale as Locale)) return {};
  const fullPath = path.join('/');
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
      url: `https://park.fan/${locale}/blog/category/${fullPath}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: `https://park.fan/${locale}/blog/category/${fullPath}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/blog/category/${fullPath}`),
        'x-default': `https://park.fan/en/blog/category/${fullPath}`,
      },
    },
  };
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { locale, path } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
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
        url: `/blog/category/${cp}`,
      };
    }),
  ];

  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    { name: label, url: `/blog/category/${fullPath}` },
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · ${t('title')}`}
        description={t('category.description', { category: label })}
        posts={visiblePosts}
        path={`/blog/category/${fullPath}`}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />
      <div className="relative isolate">
        <div
          className="from-primary/5 via-background to-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b"
          aria-hidden="true"
        />
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
            <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                {visiblePosts.map((post) => (
                  <BlogPostCard key={post.translationKey} post={post} />
                ))}
              </div>
            </div>
            <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              <BlogCategoryTree locale={locale as Locale} activePath={fullPath} />
              <BlogTagCloud locale={locale as Locale} />
            </aside>
          </div>
        </div>
      </div>

      <BlogBottomSections locale={locale} />
    </>
  );
}
