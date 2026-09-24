import { getTranslations } from 'next-intl/server';
import { ArrowRight, Newspaper } from 'lucide-react';
import { buttonLinkProps } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { PageSection } from '@/components/common/page-section';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { NewsRow } from '@/components/blog/news-row';
import { hasPublishedPosts, isNewsPost } from '@/lib/blog/listing';
import { getPostsForPark, getPostsForRide } from '@/lib/blog/backlinks';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

/**
 * "This park / this ride in our blog" — the counterpart to the park and ride
 * references inside a post. Renders the articles that mention THIS page's
 * subject (body references plus the frontmatter configuration, see
 * `lib/blog/backlinks.ts`), using the same BlogPostCard as the blog index so
 * the tiles match the rest of the site.
 *
 * Pure static content (the generated blog manifest, no API call and no clock),
 * so it never competes with the live queries or with the park page's load-last
 * best-travel-time data.
 *
 * Articles and news are split: the grid holds articles only, and news about the
 * park gets a smaller row under it ({@link NewsRow}), newest first, each item
 * with its age. News will outnumber the articles, and in one ranked grid a busy
 * news month would take every slot a guide to the park had.
 *
 * Two exports because the two pages have different rhythms: the park page
 * builds its lower sections from frosted panels (like "Parks in der Nähe"),
 * the ride page from `PageSection` chapters. The lookup, the empty-state rule
 * and the card grid are shared.
 */

/** 3 fills exactly one row of the grid below. */
const DEFAULT_LIMIT = 3;
/** News under the grid: one row at `lg`. */
const NEWS_LIMIT = 3;

/** Articles for the grid and the newest news for the row under it, from one ranked list. */
function splitPosts(posts: BlogListItem[], limit: number) {
  const articles = posts.filter((post) => !isNewsPost(post)).slice(0, limit);
  const news = posts
    .filter(isNewsPost)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
    .slice(0, NEWS_LIMIT);
  return { articles, news };
}

interface ParkBlogPostsSectionProps {
  locale: Locale;
  parkSlug: string;
  /** `continent/country/city` — disambiguates park slugs that exist twice. */
  geoPath: string;
  parkName: string;
  limit?: number;
  className?: string;
}

interface AttractionBlogPostsSectionProps extends Omit<ParkBlogPostsSectionProps, 'parkName'> {
  attractionSlug: string;
  attractionName: string;
}

export async function ParkBlogPostsSection({
  locale,
  parkSlug,
  geoPath,
  parkName,
  limit = DEFAULT_LIMIT,
  className,
}: ParkBlogPostsSectionProps) {
  // Locale-scoped: a language without its own blog surfaces (no published post,
  // nav link hidden, /blog 404s) must not link into one from a park page.
  if (!hasPublishedPosts(locale)) return null;

  const { articles, news } = splitPosts(getPostsForPark(locale, parkSlug, { geoPath }), limit);
  if (articles.length === 0 && news.length === 0) return null;

  const t = await getTranslations('parks.blogPosts');

  return (
    <section className={className}>
      <ChapterHeading
        icon={Newspaper}
        title={t('title', { park: parkName })}
        badge={<AllPostsLink label={t('viewAll')} />}
        hint={t('intro', { park: parkName })}
        frosted
        className="mb-4"
      />

      <BlogPostsGrid posts={articles} />
      <NewsRow locale={locale} posts={news} boxed className={articles.length > 0 ? 'mt-4' : ''} />
    </section>
  );
}

export async function AttractionBlogPostsSection({
  locale,
  parkSlug,
  attractionSlug,
  geoPath,
  attractionName,
  limit = DEFAULT_LIMIT,
  className,
}: AttractionBlogPostsSectionProps) {
  if (!hasPublishedPosts(locale)) return null;

  const { articles, news } = splitPosts(
    getPostsForRide(locale, parkSlug, attractionSlug, { geoPath }),
    limit
  );
  if (articles.length === 0 && news.length === 0) return null;

  const t = await getTranslations('attractions.blogPosts');

  return (
    // No intro line here: on the ride page the chapters go straight from the
    // frosted heading into their content, and a muted paragraph would sit
    // unreadable on the ride photo behind it.
    <PageSection
      icon={Newspaper}
      title={t('title', { ride: attractionName })}
      badge={<AllPostsLink label={t('viewAll')} />}
      frosted
      className={className}
    >
      <BlogPostsGrid posts={articles} />
      <NewsRow locale={locale} posts={news} boxed className={articles.length > 0 ? 'mt-4' : ''} />
    </PageSection>
  );
}

/** buttonLinkProps, not `<Button asChild>` — server component, see conventions §14. */
function AllPostsLink({ label }: { label: string }) {
  return (
    <Link
      href={'/blog' as '/'}
      prefetch={false}
      {...buttonLinkProps({ variant: 'outline', size: 'sm', className: 'rounded-full' })}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

/**
 * No shared row template on the wrapper — BlogPostCard carries its own
 * (`row-span-3` + subgrid), see CLAUDE.md on the spotlight cards.
 */
function BlogPostsGrid({ posts }: { posts: BlogListItem[] }) {
  if (posts.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-5 @min-[1024px]/page:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post.translationKey} post={post} />
      ))}
    </div>
  );
}
