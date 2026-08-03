import { getTranslations } from 'next-intl/server';
import { ArrowRight, Newspaper } from 'lucide-react';
import { buttonLinkProps } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { hasPublishedPosts } from '@/lib/blog/listing';
import { getPostsForPark } from '@/lib/blog/park-posts';
import type { Locale } from '@/i18n/config';

interface ParkBlogPostsSectionProps {
  locale: Locale;
  parkSlug: string;
  /** `continent/country/city` — disambiguates park slugs that exist twice. */
  geoPath: string;
  parkName: string;
  /** 3 fills exactly one row of the grid below. */
  limit?: number;
  className?: string;
}

/**
 * "This park in our blog" — the counterpart to the park/ride references inside
 * a post. Renders the articles that mention THIS park (body references plus the
 * frontmatter configuration, see `lib/blog/park-posts.ts`), using the same
 * BlogPostCard as the blog index so the tiles match the rest of the site.
 *
 * Pure static content (the generated blog manifest, no API call and no clock),
 * so it never competes with the park page's live queries or its load-last
 * best-travel-time data.
 */
export async function ParkBlogPostsSection({
  locale,
  parkSlug,
  geoPath,
  parkName,
  limit = 3,
  className,
}: ParkBlogPostsSectionProps) {
  // Locale-scoped: a language without its own blog surfaces (no published post,
  // nav link hidden, /blog 404s) must not link into one from a park page.
  if (!hasPublishedPosts(locale)) return null;

  const posts = getPostsForPark(locale, parkSlug, { geoPath, limit });
  if (posts.length === 0) return null;

  const t = await getTranslations('parks.blogPosts');

  return (
    <section className={className}>
      <div className="bg-background/70 mb-4 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold">{t('title', { park: parkName })}</h2>
          </div>
          {/* buttonLinkProps, not `<Button asChild>` — server component, see conventions §14. */}
          <Link
            href={'/blog' as '/'}
            prefetch={false}
            {...buttonLinkProps({ variant: 'outline', size: 'sm', className: 'rounded-full' })}
          >
            {t('viewAll')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{t('intro', { park: parkName })}</p>
      </div>

      {/* No shared row template on the wrapper — BlogPostCard carries its own
          (`row-span-3` + subgrid), see CLAUDE.md on the spotlight cards. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.translationKey} post={post} />
        ))}
      </div>
    </section>
  );
}
