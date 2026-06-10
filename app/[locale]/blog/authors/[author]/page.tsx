import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { BLOG_POSTS_PER_PAGE, listPosts, hasPublishedPosts } from '@/lib/blog';
import { getAuthor, listAuthorKeys, resolveAuthor } from '@/lib/blog/authors';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogAuthorProfile } from '@/components/blog/blog-author-profile';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
import { BlogBottomSections } from '@/components/blog/blog-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface AuthorPageProps {
  params: Promise<{ locale: string; author: string }>;
}

/** One page per (locale × registry author). */
export async function generateStaticParams() {
  const out: Array<{ locale: string; author: string }> = [];
  for (const locale of locales) {
    for (const author of listAuthorKeys()) {
      out.push({ locale, author });
    }
  }
  return out;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { locale, author } = await params;
  if (!routing.locales.includes(locale as Locale)) return {};
  const entry = getAuthor(author, locale as Locale);
  if (!entry) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', 'author', author]);
  const fullTitle = `${entry.name} | ${t('title')} · park.fan`;
  const description = entry.bio ?? t('author.description', { name: entry.name });

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      url: `${SITE_URL}/${locale}/blog/authors/${author}`,
      siteName: 'park.fan',
      type: 'profile',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: entry.name }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/authors/${author}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/blog/authors/${author}`),
        'x-default': `${SITE_URL}/en/blog/authors/${author}`,
      },
      types: {
        'application/rss+xml': `${SITE_URL}/${locale}/blog/feed.xml`,
      },
    },
  };
}

export default async function BlogAuthorPage({ params }: AuthorPageProps) {
  const { locale, author } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts()) notFound();
  setRequestLocale(locale);

  const entry = getAuthor(author, locale as Locale);
  if (!entry) notFound();

  const t = await getTranslations('blog');
  const allPosts = listPosts(locale as Locale).filter(
    (p) => resolveAuthor(p.frontmatter.author, locale as Locale).key === author
  );
  const visiblePosts = allPosts.slice(0, BLOG_POSTS_PER_PAGE);

  const breadcrumbs: Breadcrumb[] = [{ name: t('blog'), url: '/blog' }];
  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    { name: entry.name, url: `/blog/authors/${author}` },
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${entry.name} · ${t('title')}`}
        description={entry.bio ?? t('author.description', { name: entry.name })}
        posts={visiblePosts}
        path={`/blog/authors/${author}`}
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
            currentPage={entry.name}
            variant="plain"
            className="mb-6"
          />

          <BlogAuthorProfile author={entry} />

          <h2 className="text-foreground mt-10 mb-6 text-xl font-bold sm:text-2xl">
            {t('author.postsBy', { name: entry.name })}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {t('author.postsCount', { count: allPosts.length })}
            </span>
          </h2>

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            {visiblePosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {visiblePosts.map((post) => (
                  <BlogPostCard key={post.translationKey} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('author.noPosts')}</p>
            )}
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
