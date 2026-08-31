import { getTranslations } from 'next-intl/server';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { listPostsByRecency } from '@/lib/blog/listing';
import type { Locale } from '@/i18n/config';

/**
 * The three newest posts, in a card directly under the hero.
 *
 * It stands where the park shortcut row used to: the first thing under the fold,
 * which is the only place on this page that reaches a reader who has not decided
 * to scroll yet. Three rather than six — this is the blog saying hello, not the
 * blog index, and `/blog` is one link away in the same row.
 *
 * From `lg` up only. The blog chapter further down carries the same posts in a
 * different shape (a lead card with four beside it), so nothing is lost on a
 * phone; what would be lost by keeping this one there is the fold.
 *
 * **No `<Suspense>`, and that is the point.** `listPostsByRecency` reads the
 * generated manifest synchronously, so there is no async work to defer and a
 * boundary here would drop the band out of the first HTML and put it back a
 * moment later — a shift on the highest-traffic page in the app, for nothing.
 * Synchronous data belongs inline, at full height.
 *
 * `BlogPostCard` brings its own row template (`grid-template-rows` on the card,
 * never on this wrapper): the cards lay out with `row-span-3` + `subgrid`, and a
 * shared wrapper template collapses against the panels' negative margins and
 * slices the title. See the blog-spotlight note in CLAUDE.md.
 *
 * Renders nothing where the locale publishes no posts, which is the same
 * condition the blog routes 404 under.
 */
export async function BlogTeaserBand({ locale }: { locale: Locale }) {
  const [t, tBlog] = await Promise.all([
    getTranslations('homeStory.blogTeaser'),
    getTranslations('blog'),
  ]);

  const posts = listPostsByRecency(locale).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    // Desktop only. On a phone this band would be three full-height cards
    // between the hero and the first chapter — a screen and a half of blog
    // before the site has said what it is. Phones meet the blog further down,
    // in the chapter, which is where the reading order puts it anyway.
    <section className="hidden px-4 pt-8 pb-4 lg:block">
      <div className="container mx-auto">
        <div className="border-border bg-card/40 rounded-2xl border p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
              <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
              {t('label')}
            </span>
            <Link
              href="/blog"
              prefetch={false}
              className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {tBlog('home.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.translationKey} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
