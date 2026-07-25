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
import { BlogPostGrid } from '@/components/blog/blog-post-grid';
import { BlogCategoryTree } from '@/components/blog/blog-category-tree';
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud';
import { BlogBottomSections } from '@/components/blog/blog-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { Hero } from '@/components/marketing/editorial-ui';
import { getOgImageUrl } from '@/lib/utils/og-image';

/** Scenic establishing shot for the blog hero (distinct from Fancast/the hub). */
const BLOG_HERO_IMAGE = '/images/parks/europa-park/background.jpg';

const SCROLL_LABELS: Record<Locale, string> = {
  de: 'Scrollen',
  en: 'Scroll',
  es: 'Desliza',
  fr: 'Défiler',
  it: 'Scorri',
  nl: 'Scroll',
};

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
  // Descriptive, keyword-bearing <title> (the generic "Blog" stays as the H1
  // fallback / breadcrumb label; the meta title carries the topic for search).
  const fullTitle = `${t('heroTitle')} | park.fan`;
  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as Locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/blog`,
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
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/blog`),
        'x-default': `${SITE_URL}/en/blog`,
      },
      types: {
        'application/rss+xml': `${SITE_URL}/${locale}/blog/feed.xml`,
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
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }
  // No posts listed for THIS locale → the blog doesn't exist here (yet).
  if (!hasPublishedPosts(locale as Locale)) notFound();
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
  // via the category tree on the right-hand sidebar. All posts use the same
  // uniform card grid as the category pages (no separate full-width feature —
  // it stretched portrait covers into a thin panoramic strip).
  const visiblePosts = allPosts.slice(0, BLOG_POSTS_PER_PAGE);

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={t('badge')}
        description={t('description')}
        posts={visiblePosts}
        path="/blog"
      />
      <Hero
        kicker={t('badge')}
        title={t('heroTitle')}
        tagline={t('intro')}
        imageSrc={BLOG_HERO_IMAGE}
        imageAlt={t('heroTitle')}
        stats={[]}
        scrollLabel={SCROLL_LABELS[locale as Locale]}
        titleClassName="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl"
      />

      <div id="start" className="container mx-auto px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <BlogPostGrid posts={visiblePosts} />
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <BlogCategoryTree locale={locale as Locale} />
            <BlogTagCloud locale={locale as Locale} />
          </aside>
        </div>
      </div>

      <BlogBottomSections locale={locale} />
    </>
  );
}
