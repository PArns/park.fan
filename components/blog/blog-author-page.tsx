import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { listArticles, hasPublishedPosts } from '@/lib/blog/listing';
import { getAuthor, resolveAuthor } from '@/lib/blog/authors';
import type { BlogListItem } from '@/lib/blog/types';
import { hasPage, listingAlternates, paginate, pagedPath, pagedTitle } from '@/lib/blog/pagination';
import { BlogAuthorProfile } from '@/components/blog/blog-author-profile';
import { BlogPostStream } from '@/components/blog/blog-post-stream';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { blogFeedAlternates } from '@/lib/blog/feed';

/** Locale-relative path of an author page's first page. */
function authorPath(author: string): string {
  return `/blog/authors/${author}`;
}

/**
 * The author's articles in a locale. Their news posts live under `/news`, never under `/blog`.
 */
export function listAuthorArticles(locale: Locale, author: string): BlogListItem[] {
  return listArticles(locale).filter(
    (p) => resolveAuthor(p.frontmatter.author, locale).key === author
  );
}

/** Metadata for page `page` of the author page at `/blog/authors/[author]`. */
export async function buildAuthorMetadata(
  locale: string,
  author: string,
  page: number
): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const entry = getAuthor(author, locale as Locale);
  if (!entry) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', 'author', author]);
  const fullTitle = `${pagedTitle(entry.name, page, t('pagination.pageLabel', { page }))} | ${t('title')} · park.fan`;
  const description = entry.bio ?? t('author.description', { name: entry.name });
  const path = pagedPath(authorPath(author), page);

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'park.fan',
      type: 'profile',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: entry.name }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      // The first page exists in every locale, the author's profile with or without posts.
      languages: listingAlternates((l) =>
        page === 1 || hasPage(listAuthorArticles(l, author).length, page) ? path : null
      ),
      types: blogFeedAlternates(locale as Locale),
    },
  };
}

/**
 * Renders page `page` of an author page: the profile, the author's articles in the blog's stream
 * and the page links, plus Blog and BreadcrumbList JSON-LD. Page 1 stands with no posts at all
 * (the profile is the page); a later page the author does not have is a 404.
 */
export async function BlogAuthorPageBody({
  locale,
  author,
  page,
}: {
  locale: string;
  author: string;
  page: number;
}) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const entry = getAuthor(author, locale as Locale);
  if (!entry) notFound();

  const t = await getTranslations('blog');
  const allPosts = listAuthorArticles(locale as Locale, author);
  const current = allPosts.length > 0 ? paginate(allPosts, page) : null;
  if (!current && page > 1) notFound();

  const pageLabel = t('pagination.pageLabel', { page });
  const breadcrumbs: Breadcrumb[] = [{ name: t('blog'), url: '/blog' }];
  const authorCrumb: Breadcrumb = { name: entry.name, url: authorPath(author) };
  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    authorCrumb,
    ...(page > 1 ? [{ name: pageLabel, url: pagedPath(authorPath(author), page) }] : []),
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${entry.name} · ${t('title')}`}
        description={entry.bio ?? t('author.description', { name: entry.name })}
        posts={current?.items ?? []}
        path={pagedPath(authorPath(author), page)}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />

      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={page > 1 ? [...breadcrumbs, authorCrumb] : breadcrumbs}
          currentPage={page > 1 ? pageLabel : entry.name}
          variant="plain"
          className="mb-6"
        />

        <BlogAuthorProfile author={entry} />

        <h2 className="text-foreground mt-10 mb-6 text-xl font-bold sm:text-2xl">
          {t('author.postsBy', { name: entry.name })}
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            {page > 1
              ? `${t('author.postsCount', { count: allPosts.length })} · ${t('pagination.pageOf', { page, total: current?.pageCount ?? 1 })}`
              : t('author.postsCount', { count: allPosts.length })}
          </span>
        </h2>

        <div className="max-w-5xl">
          {current ? (
            <>
              <BlogPostStream locale={locale as Locale} posts={current.items} />
              <ListingPagination
                base={authorPath(author)}
                page={page}
                pageCount={current.pageCount}
              />
            </>
          ) : (
            <p className="text-muted-foreground">{t('author.noPosts')}</p>
          )}
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
