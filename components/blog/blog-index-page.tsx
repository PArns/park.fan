import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { listArticlesByRecency, hasPublishedPosts } from '@/lib/blog/listing';
import { hasPage, listingAlternates, paginate, pagedPath, pagedTitle } from '@/lib/blog/pagination';
import { BlogCategoryPills, BlogPostStream } from '@/components/blog/blog-post-stream';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { ListingSearch } from '@/components/blog/listing-search';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { LandingHero, HERO_FLOW_INTO_PULL } from '@/components/marketing/editorial-ui';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { cn } from '@/lib/utils';

/**
 * The blog hero's photo, asked of the media database so the path carries its content version and
 * the park can change which photo it is.
 */
const BLOG_HERO_IMAGE =
  getParkBackgroundImage('europa-park') ?? '/media/europa-park/background.jpg';

/** Locale-relative path of the blog index, page 1. */
const BLOG_INDEX_PATH = '/blog';

/**
 * Metadata for page `page` of the blog index. Every page is its own canonical and indexable:
 * pointing page 2 at page 1 would tell Google the posts on it are not worth reaching. The OG card
 * is the index's for all of them.
 */
export async function buildBlogIndexMetadata(locale: string, page: number): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog']);
  // A keyword-bearing <title>; the generic "Blog" stays the breadcrumb label.
  const fullTitle = `${pagedTitle(t('heroTitle'), page, t('pagination.pageLabel', { page }))} | park.fan`;
  const url = `${SITE_URL}/${locale}${pagedPath(BLOG_INDEX_PATH, page)}`;
  return {
    title: { absolute: fullTitle },
    description: t('description'),
    openGraph: {
      title: fullTitle,
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as Locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url,
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
      canonical: url,
      languages: listingAlternates((l) =>
        hasPage(listArticlesByRecency(l).length, page) ? pagedPath(BLOG_INDEX_PATH, page) : null
      ),
      types: blogFeedAlternates(locale as Locale),
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

/**
 * Page `page` of the blog index: the articles, newest first, in the stream `/news` draws, with the
 * search over every article and the categories as pills above and the page links below. Page 1 opens with the photo hero, a later
 * page with the compact head, so the list is on the first screen of every page after the first.
 * News has its own section at `/news` and is never listed here.
 */
export async function BlogIndexPageBody({ locale, page }: { locale: string; page: number }) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  // No posts listed for THIS locale → the blog doesn't exist here (yet).
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const [t, tLanding] = await Promise.all([getTranslations('blog'), getTranslations('landing')]);
  const allPosts = listArticlesByRecency(locale as Locale);

  if (allPosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-4">{t('empty')}</p>
      </div>
    );
  }

  const current = paginate(allPosts, page);
  if (!current) notFound();

  const list = (
    <div className="max-w-5xl">
      <ListingSearch scope="articles">
        <BlogCategoryPills locale={locale as Locale} active={null} total={allPosts.length} />
        <BlogPostStream locale={locale as Locale} posts={current.items} />
        <ListingPagination base={BLOG_INDEX_PATH} page={page} pageCount={current.pageCount} />
      </ListingSearch>
    </div>
  );

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={t('badge')}
        description={t('description')}
        posts={current.items}
        path={pagedPath(BLOG_INDEX_PATH, page)}
      />
      {page === 1 ? (
        <>
          <LandingHero
            kicker={tLanding('blog.kicker')}
            title={t('heroTitle')}
            tagline={t('intro')}
            imageSrc={BLOG_HERO_IMAGE}
            imageAlt={t('heroTitle')}
            scrollLabel={tLanding('scroll')}
            flowInto
          />
          {/* Pulled up over the hero on phones — see `HERO_FLOW_INTO_PULL`, which owns
              the number so it stays paired with the hero's own bottom padding.
              `relative` puts this above the hero's stacking context. */}
          <div
            id="start"
            className={cn(
              'relative container mx-auto px-4 pt-0 pb-10 sm:py-14',
              HERO_FLOW_INTO_PULL
            )}
          >
            {list}
          </div>
        </>
      ) : (
        <>
          <LandingHero
            variant="compact"
            kicker={tLanding('blog.kicker')}
            title={t('heroTitle')}
            tagline={t('pagination.pageOf', { page, total: current.pageCount })}
          />
          <div className="container mx-auto px-4 pt-8 pb-10 sm:pt-10 sm:pb-14">{list}</div>
        </>
      )}

      <PageBottomSections locale={locale} />
    </>
  );
}
