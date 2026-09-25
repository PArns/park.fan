import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Megaphone } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import {
  generateAlternateLanguages,
  locales,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { hasPublishedPosts, listNewsByDate, NEWS_CATEGORY } from '@/lib/blog/listing';
import { resolveCategoryLabel } from '@/lib/blog/categories';
import { NEWS_INDEX_PATH, postPath } from '@/lib/blog/paths';
import { resolveNewsPark, type NewsPark } from '@/lib/blog/news-park';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { BlogSectionHeader } from '@/components/blog/blog-section-header';
import { NewsAge } from '@/components/blog/news-age';
import { NewsParkLabel } from '@/components/blog/news-park-label';
import {
  NewsStream,
  type NewsStreamGroup,
  type NewsStreamPark,
} from '@/components/blog/news-stream';
import { PageBottomSections } from '@/components/common/page-bottom-sections';
import { NewsListingStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { BlogListItem } from '@/lib/blog/types';
import { blogFeedAlternates } from '@/lib/blog/feed';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { fitWithin, MAX_TITLE_LENGTH } from '@/lib/utils/metadata';

/**
 * The overview's own metadata. It used to borrow the blog category's, which titled it
 * "News | Blog · park.fan", described it as "all blog posts in the category News" and asked the OG
 * route for a card at `blog/news` — a post slug that does not exist, so the card's title was the
 * word "news". The page is not a blog category any more, so none of that fits: the title carries
 * the search phrase ("Freizeitpark-News"), the card is `/api/og/<locale>/news`, and the canonical
 * is `/news` whatever `?park=` says (the filter adds no URLs, see `NewsStream`).
 */
export async function buildNewsIndexMetadata(locale: string): Promise<Metadata> {
  if (!routing.locales.includes(locale as Locale)) return {};
  const t = await getTranslations({ locale, namespace: 'news' });
  const title = fitWithin(MAX_TITLE_LENGTH, `${t('metaTitle')} | park.fan`, t('metaTitle'));
  const description = t('metaDescription');
  const url = `${SITE_URL}/${locale}${NEWS_INDEX_PATH}`;
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
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${NEWS_INDEX_PATH}`),
        'x-default': `${SITE_URL}/en${NEWS_INDEX_PATH}`,
      },
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
 * The news overview at `/news`: a stream of dated notes, newest day first, not the blog's card
 * grid. Each day opens with its date and age ({@link NewsAge}); each note carries its park, its
 * title, one line of teaser and a small cover. All news is listed — nothing drops out for its
 * age (`docs/rules/news-is-set-apart-from-the-articles.md`).
 */
export async function NewsIndexPageBody({ locale }: { locale: string }) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  if (!hasPublishedPosts(locale as Locale)) notFound();
  setRequestLocale(locale);

  const posts = listNewsByDate(locale as Locale);
  if (posts.length === 0) notFound();

  const t = await getTranslations('news');
  const label = resolveCategoryLabel(NEWS_CATEGORY, locale as Locale, 'News');

  const withParks = await Promise.all(
    posts.map(async (post) => ({ post, park: await resolveNewsPark(post.translationKey) }))
  );

  // The filter's key per park. A bare slug is not unique (`lib/blog/park-resolver.ts`): Paris and
  // Anaheim both have a `disneyland-park`, and one pill for the two would mix their news. So the
  // key is the slug where it names one park among the news, and slug plus city where it does not.
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
  const groups: NewsStreamGroup[] = [];
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
    group.items.push({
      key: post.translationKey,
      park: park ? filterKey(park) : null,
      node: <NewsStreamEntry post={post} park={park} />,
    });
  }

  // The filter offers the parks that have news, most news first, then by name.
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
        posts={posts}
        path={NEWS_INDEX_PATH}
      />
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: label, url: NEWS_INDEX_PATH }]}
        locale={locale}
      />
      <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <BlogSectionHeader
          as="h1"
          glass={false}
          title={
            <span className="inline-flex items-center gap-3">
              <Megaphone className="text-primary h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
              {label}
            </span>
          }
          intro={t('intro')}
          meta={t('count', { count: posts.length })}
          className="mb-8"
        />

        <NewsStream
          groups={groups}
          parks={parks}
          filterLabel={t('filter.label')}
          allLabel={t('filter.all')}
        />
      </div>

      <PageBottomSections locale={locale} />
    </>
  );
}

/** One note in the stream. The title and the cover link the post; the park label its park. */
function NewsStreamEntry({ post, park }: { post: BlogListItem; park: NewsPark | null }) {
  const href = postPath(post) as '/';
  const src = post.frontmatter.coverImage?.src;
  const image = versionedPath(src) ?? src ?? null;

  return (
    <article className="border-border bg-card flex gap-4 rounded-2xl border p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        {park && <NewsParkLabel park={park} />}
        <h3 className="mt-2 text-base leading-snug font-bold text-pretty sm:text-lg">
          <Link href={href} prefetch={false} className="hover:text-primary transition-colors">
            {post.frontmatter.title}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
          {post.frontmatter.excerpt}
        </p>
      </div>
      {image && (
        <Link
          href={href}
          prefetch={false}
          tabIndex={-1}
          aria-hidden="true"
          className="bg-muted relative block aspect-[16/10] w-24 shrink-0 self-start overflow-hidden rounded-xl sm:w-40"
        >
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 160px, 96px"
            style={{ objectPosition: objectPositionForSrc(src, '50% 50%') }}
            className="object-cover"
          />
        </Link>
      )}
    </article>
  );
}
