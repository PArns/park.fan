import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { locales, localeToOpenGraphLocale, SITE_URL } from '@/i18n/config';
import { hasPublishedPosts, listNewsByDate, NEWS_CATEGORY } from '@/lib/blog/listing';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { NEWS_INDEX_PATH, postPath } from '@/lib/blog/paths';
import { resolveNewsPark, type NewsPark } from '@/lib/blog/news-park';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { LandingHero } from '@/components/marketing/editorial-ui';
import { NewsAge } from '@/components/blog/news-age';
import { NewsParkLabel } from '@/components/blog/news-park-label';
import { NewsUpdateBadge } from '@/components/blog/news-update-badge';
import { NewsStream, type NewsStreamPark } from '@/components/blog/news-stream';
import { PostStreamEntry, type PostStreamGroup } from '@/components/blog/post-stream';
import { ListingPagination } from '@/components/blog/listing-pagination';
import { ListingSearch } from '@/components/blog/listing-search';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { NewsListingStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { fitWithin, MAX_TITLE_LENGTH } from '@/lib/utils/metadata';
import { hasPage, listingAlternates, paginate, pagedPath, pagedTitle } from '@/lib/blog/pagination';

/**
 * The news overview's own metadata for page `page`: a title carrying the search phrase
 * ("Freizeitpark-News"), the card from `/api/og/<locale>/news`, and the page's own URL as the
 * canonical whatever `?park=` says (the filter adds no URLs, see `NewsStream`).
 */
export async function buildNewsIndexMetadata(locale: string, page: number): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const [t, tBlog] = await Promise.all([
    getTranslations({ locale, namespace: 'news' }),
    getTranslations({ locale, namespace: 'blog' }),
  ]);
  const name = pagedTitle(t('metaTitle'), page, tBlog('pagination.pageLabel', { page }));
  const title = fitWithin(MAX_TITLE_LENGTH, `${name} | park.fan`, name);
  const description = t('metaDescription');
  const path = pagedPath(NEWS_INDEX_PATH, page);
  const url = `${SITE_URL}/${locale}${path}`;
  const ogImageUrl = getOgImageUrl([locale, 'news']);

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      locale: localeToOpenGraphLocale[locale as Locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
    alternates: {
      canonical: url,
      languages: listingAlternates((l) => (hasPage(listNewsByDate(l).length, page) ? path : null)),
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
 * Page `page` of the news overview at `/news`: a stream of dated notes, newest day first
 * (`PostStreamGroups`, the list the blog listings draw by month). Each day opens with its date and
 * age ({@link NewsAge}); each note carries its park, its title, its teaser and a small cover. All
 * news is listed, page by page — nothing drops out for its age
 * (`docs/rules/news-is-set-apart-from-the-articles.md`). The park filter works on the page it is
 * on, so it offers that page's parks.
 */
export async function NewsIndexPageBody({ locale, page }: { locale: string; page: number }) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const all = listNewsByDate(locale as Locale);
  if (all.length === 0) notFound();
  const current = paginate(all, page);
  if (!current) notFound();

  const [t, tBlog, tLanding] = await Promise.all([
    getTranslations('news'),
    getTranslations('blog'),
    getTranslations('landing.news'),
  ]);
  const label = resolveCategoryLabel(NEWS_CATEGORY, locale as Locale, 'News');
  const path = pagedPath(NEWS_INDEX_PATH, page);

  const withParks = await Promise.all(
    current.items.map(async (post) => ({
      post,
      park: await resolveNewsPark(post.translationKey),
    }))
  );

  // The filter's key per park. A bare slug is not unique (`lib/blog/park-resolver.ts`): Paris and
  // Anaheim both have a `disneyland-park`, and one pill for the two would mix their news. So the
  // key is the slug where it names one park on this page, and slug plus city where it does not.
  const hrefsBySlug = new Map<string, Set<string>>();
  for (const { park } of withParks) {
    if (!park) continue;
    const hrefs = hrefsBySlug.get(park.slug) ?? new Set<string>();
    hrefs.add(park.href);
    hrefsBySlug.set(park.slug, hrefs);
  }
  const filterKey = (park: NewsPark) =>
    (hrefsBySlug.get(park.slug)?.size ?? 0) > 1
      ? `${park.slug}-${park.href.split('/').at(-2)}`
      : park.slug;

  // Days, newest first — `listNewsByDate` is already sorted, so a day is a run of equal dates.
  const groups: PostStreamGroup[] = [];
  for (const { post, park } of withParks) {
    const day = post.frontmatter.date;
    let group = groups[groups.length - 1];
    if (!group || group.key !== day) {
      group = {
        key: day,
        heading: (
          <h2>
            <NewsAge date={day} className="text-sm sm:whitespace-normal" />
          </h2>
        ),
        items: [],
      };
      groups.push(group);
    }
    const src = post.frontmatter.coverImage?.src;
    group.items.push({
      key: post.translationKey,
      filterKey: park ? filterKey(park) : null,
      node: (
        <PostStreamEntry
          href={postPath(post)}
          title={post.frontmatter.title}
          excerpt={post.frontmatter.excerpt}
          label={
            park || post.updatedOn ? (
              <span className="flex flex-wrap items-center gap-2">
                {post.updatedOn && <NewsUpdateBadge date={post.updatedOn} />}
                {park && <NewsParkLabel park={park} />}
              </span>
            ) : undefined
          }
          image={versionedPath(src) ?? src ?? null}
          imagePosition={objectPositionForSrc(src, '50% 50%')}
          fallbackSlug={post.slug}
        />
      ),
    });
  }

  // The filter offers the parks with news on this page, most news first, then by name.
  const parkCounts = new Map<string, NewsStreamPark>();
  for (const { park } of withParks) {
    if (!park) continue;
    const key = filterKey(park);
    const entry = parkCounts.get(key) ?? { slug: key, name: park.name, count: 0 };
    entry.count += 1;
    parkCounts.set(key, entry);
  }
  const parks = [...parkCounts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, locale)
  );

  return (
    <>
      <NewsListingStructuredData
        locale={locale}
        name={`${label} · park.fan`}
        description={t('metaDescription')}
        posts={current.items}
        path={path}
      />
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: label, url: NEWS_INDEX_PATH },
          ...(page > 1 ? [{ name: tBlog('pagination.pageLabel', { page }), url: path }] : []),
        ]}
        locale={locale}
      />
      {/* A tool page: the compact head (docs/product/landing-pages.md §1). No action button in
          it — the list is the page, and the search and the park filter under the head are what
          there is to operate (§4). The count stays a small line under the lead. */}
      <LandingHero
        variant="compact"
        kicker={tLanding('kicker')}
        title={label}
        tagline={
          <>
            {t('intro')}
            <span className="text-muted-foreground mt-2 block text-xs">
              {page > 1
                ? `${t('count', { count: all.length })} · ${tBlog('pagination.pageOf', { page, total: current.pageCount })}`
                : t('count', { count: all.length })}
            </span>
          </>
        }
      />

      {/* The stream keeps `max-w-5xl` but starts at the `container` edge with the head. */}
      <div className="container mx-auto px-4 pt-8 pb-10 sm:pt-10 sm:pb-14">
        <div className="max-w-5xl">
          <ListingSearch scope="news">
            <NewsStream
              groups={groups}
              parks={parks}
              filterLabel={t('filter.label')}
              allLabel={t('filter.all')}
            />
            <ListingPagination base={NEWS_INDEX_PATH} page={page} pageCount={current.pageCount} />
          </ListingSearch>
        </div>
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}
