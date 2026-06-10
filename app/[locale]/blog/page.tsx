import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { generateAlternateLanguages, locales, localeToOpenGraphLocale } from '@/i18n/config';
import {BLOG_POSTS_PER_PAGE, listPosts, hasPublishedPosts } from '@/lib/blog';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { BlogBottomSections } from '@/components/blog/blog-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface BlogIndexPageProps {
  params: Promise<{ locale: string }>;
}

// Statically generated at build time. Pagination via `?page=N` would force a
// dynamic render — when the post count grows past one page we'll add a
// path-based `/blog/page/[n]` route, generateStaticParams for it, and keep
// this index static.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog']);
  const fullTitle = `${t('title')} | park.fan`;
  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as Locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/blog`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/blog`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/blog`),
        'x-default': 'https://park.fan/en/blog',
      },
      types: {
        'application/rss+xml': `https://park.fan/${locale}/blog/feed.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  // No published posts → the blog doesn't exist for the frontend.
  if (!hasPublishedPosts()) notFound();
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const allPosts = listPosts(locale as Locale);

  if (allPosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-4">{t('empty')}</p>
      </div>
    );
  }

  // Render up to BLOG_POSTS_PER_PAGE on the index. Older posts stay reachable
  // via the category tree on the right-hand sidebar.
  const visiblePosts = allPosts.slice(0, BLOG_POSTS_PER_PAGE);
  const [feature, ...rest] = visiblePosts;

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={t('title')}
        description={t('description')}
        posts={visiblePosts}
        path="/blog"
      />
      <div className="relative isolate">
        <div
          className="from-primary/5 via-background to-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b"
          aria-hidden="true"
        />
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <BlogSectionHeader
            as="h1"
            badge={t('badge')}
            title={t('title')}
            intro={t('intro')}
          />

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-10">
              {feature && <BlogPostCard post={feature} variant="feature" />}
              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {rest.map((post) => (
                    <BlogPostCard key={post.translationKey} post={post} />
                  ))}
                </div>
              )}
            </div>
            <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              <BlogCategoryTree locale={locale as Locale} />
              <BlogTagCloud locale={locale as Locale} />
            </aside>
          </div>
        </div>
      </div>

      <BlogBottomSections locale={locale} />
    </>
  );
}
