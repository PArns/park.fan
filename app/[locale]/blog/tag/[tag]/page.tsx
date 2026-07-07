import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { BLOG_POSTS_PER_PAGE, listPosts, hasPublishedPosts } from '@/lib/blog';
import { findCanonicalTag, listTags, normalizeTagSlug } from '@/lib/blog/tags';
import { BlogPostGrid } from '@/components/blog/blog-post-grid';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { BlogBottomSections } from '@/components/blog/blog-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>;
}

/**
 * Pre-generate one page per (locale × tag) so every tag in every post becomes
 * an indexable archive. Tag slugs are normalised to lowercase + hyphens.
 */
export async function generateStaticParams() {
  const out: Array<{ locale: string; tag: string }> = [];
  for (const locale of locales) {
    for (const tag of listTags(locale as Locale)) {
      out.push({ locale, tag: tag.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  if (!routing.locales.includes(locale as Locale)) return {};
  const canonicalTag = findCanonicalTag(locale as Locale, tag);
  if (!canonicalTag) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', 'tag', tag]);
  const fullTitle = `#${canonicalTag} | ${t('title')} · park.fan`;
  const description = t('tag.description', { tag: canonicalTag });

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      url: `${SITE_URL}/${locale}/blog/tag/${tag}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/tag/${tag}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/blog/tag/${tag}`),
        'x-default': `${SITE_URL}/en/blog/tag/${tag}`,
      },
      types: {
        'application/rss+xml': `${SITE_URL}/${locale}/blog/feed.xml`,
      },
    },
  };
}

export default async function BlogTagPage({ params }: TagPageProps) {
  const { locale, tag } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const canonicalTag = findCanonicalTag(locale as Locale, tag);
  if (!canonicalTag) notFound();

  const t = await getTranslations('blog');
  const allPosts = listPosts(locale as Locale).filter((p) =>
    (p.frontmatter.tags ?? []).some((x) => normalizeTagSlug(x) === tag)
  );
  if (allPosts.length === 0) notFound();

  const visiblePosts = allPosts.slice(0, BLOG_POSTS_PER_PAGE);

  const breadcrumbs: Breadcrumb[] = [{ name: t('blog'), url: '/blog' }];
  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    { name: `#${canonicalTag}`, url: `/blog/tag/${tag}` },
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`#${canonicalTag} · ${t('title')}`}
        description={t('tag.description', { tag: canonicalTag })}
        posts={visiblePosts}
        path={`/blog/tag/${tag}`}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />

      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={`#${canonicalTag}`}
          variant="plain"
          className="mb-6"
        />

        <BlogSectionHeader
          as="h1"
          badge={t('tag.label')}
          badgeIcon={Tag}
          title={`#${canonicalTag}`}
          meta={t('tag.postsCount', { count: allPosts.length })}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <BlogPostGrid posts={visiblePosts} />
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <BlogCategoryTree locale={locale as Locale} />
            <BlogTagCloud locale={locale as Locale} activeSlug={tag} />
          </aside>
        </div>
      </div>

      <BlogBottomSections locale={locale} />
    </>
  );
}
