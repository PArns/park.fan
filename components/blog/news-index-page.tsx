import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Megaphone } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
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
import { BlogStructuredData } from '@/components/seo/blog-structured-data';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import type { BlogListItem } from '@/lib/blog/types';

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
      park: park?.slug ?? null,
      node: <NewsStreamEntry post={post} park={park} />,
    });
  }

  // The filter offers the parks that have news, most news first, then by name.
  const parkCounts = new Map<string, NewsStreamPark>();
  for (const { park } of withParks) {
    if (!park) continue;
    const entry = parkCounts.get(park.slug) ?? { slug: park.slug, name: park.name, count: 0 };
    entry.count += 1;
    parkCounts.set(park.slug, entry);
  }
  const parks = [...parkCounts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, locale)
  );

  return (
    <>
      <BlogStructuredData
        locale={locale}
        name={`${label} · park.fan`}
        description={t('intro')}
        posts={[...posts]}
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
