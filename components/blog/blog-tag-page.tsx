import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { listArticles, hasPublishedPosts } from '@/lib/blog/listing';
import {
  buildTagAlternates,
  findCanonicalTag,
  isIndexableTag,
  normalizeTagSlug,
} from '@/lib/blog/tags';
import { paginate, pagedPath, pagedTitle } from '@/lib/blog/pagination';
import { BlogPostStream } from '@/components/blog/blog-post-stream';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { Breadcrumb } from '@/lib/api/types';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { NEWS_ONLY_TAGS } from '@/lib/blog/news-redirects';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';

/** Locale-relative path of a tag archive's first page. */
function tagPath(tag: string): string {
  return `/blog/tag/${tag}`;
}

/** Metadata for page `page` of the tag archive at `/blog/tag/[tag]`. */
export async function buildTagMetadata(
  locale: string,
  tag: string,
  page: number
): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const canonicalTag = findCanonicalTag(locale as Locale, tag);
  if (!canonicalTag) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  const ogImageUrl = getOgImageUrl([locale, 'blog', 'tag', tag]);
  const fullTitle = `${pagedTitle(`#${canonicalTag}`, page, t('pagination.pageLabel', { page }))} | ${t('title')} · park.fan`;
  const description = t('tag.description', { tag: canonicalTag });
  const tagAlternates = buildTagAlternates(locale as Locale, tag, page);
  const url = `${SITE_URL}/${locale}${pagedPath(tagPath(tag), page)}`;

  return {
    title: { absolute: fullTitle },
    description,
    // A tag archive below TAG_INDEX_MIN_POSTS is one post's teaser at a second URL, so it is
    // `noindex, follow`. Page metadata replaces the layout's `robots` object rather than merging
    // into it, so `googleBot` is restated here.
    ...(isIndexableTag(locale as Locale, tag)
      ? {}
      : {
          robots: {
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
          },
        }),
    openGraph: {
      title: fullTitle,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      url,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [ogImageUrl] },
    alternates: {
      canonical: url,
      // Tag slugs are translated ("wartezeiten" / "wait-times"), so buildTagAlternates resolves
      // each locale's slug and omits locales where the tag has no such page.
      languages: {
        ...tagAlternates,
        ...(tagAlternates['en'] && { 'x-default': tagAlternates['en'] }),
      },
      types: blogFeedAlternates(locale as Locale),
    },
  };
}

/**
 * Renders page `page` of a tag archive: breadcrumbs, the tag's articles in the blog's stream and
 * the page links, plus Blog and BreadcrumbList JSON-LD. Articles only, like `listTags` counts
 * them; news is never listed under `/blog`.
 */
export async function BlogTagPageBody({
  locale,
  tag,
  page,
}: {
  locale: string;
  tag: string;
  page: number;
}) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const canonicalTag = findCanonicalTag(locale as Locale, tag);
  if (!canonicalTag) {
    // A tag only news carries has no archive here. The proxy 308s it to `/news` before anything
    // renders (`lib/blog/news-redirects-rule.ts`); this is the net behind it.
    if (NEWS_ONLY_TAGS[locale]?.includes(tag)) permanentRedirect(`/${locale}${NEWS_INDEX_PATH}`);
    notFound();
  }

  const t = await getTranslations('blog');
  const allPosts = listArticles(locale as Locale).filter((p) =>
    (p.frontmatter.tags ?? []).some((x) => normalizeTagSlug(x) === tag)
  );
  if (allPosts.length === 0) notFound();
  const current = paginate(allPosts, page);
  if (!current) notFound();

  const label = `#${canonicalTag}`;
  const pageLabel = t('pagination.pageLabel', { page });
  const breadcrumbs: Breadcrumb[] = [{ name: t('blog'), url: '/blog' }];
  const tagCrumb: Breadcrumb = { name: label, url: tagPath(tag) };
  const seoBreadcrumbs: Breadcrumb[] = [
    ...breadcrumbs,
    tagCrumb,
    ...(page > 1 ? [{ name: pageLabel, url: pagedPath(tagPath(tag), page) }] : []),
  ];

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · ${t('title')}`}
        description={t('tag.description', { tag: canonicalTag })}
        posts={current.items}
        path={pagedPath(tagPath(tag), page)}
      />
      <BreadcrumbStructuredData breadcrumbs={seoBreadcrumbs} locale={locale} />

      <div className="container mx-auto px-4 py-10 sm:py-14">
        <BreadcrumbNav
          breadcrumbs={page > 1 ? [...breadcrumbs, tagCrumb] : breadcrumbs}
          currentPage={page > 1 ? pageLabel : label}
          variant="plain"
          className="mb-6"
        />

        <BlogSectionHeader
          as="h1"
          badge={t('tag.label')}
          badgeIcon={Tag}
          title={label}
          meta={
            page > 1
              ? `${t('tag.postsCount', { count: allPosts.length })} · ${t('pagination.pageOf', { page, total: current.pageCount })}`
              : t('tag.postsCount', { count: allPosts.length })
          }
        />

        <div className="max-w-5xl">
          <BlogPostStream locale={locale as Locale} posts={current.items} />
          <ListingPagination base={tagPath(tag)} page={page} pageCount={current.pageCount} />
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
