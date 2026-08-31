import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Clock, Newspaper } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { listPostsByRecency } from '@/lib/blog/listing';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogTeaserReveal } from './blog-teaser-reveal';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import type { Locale } from '@/i18n/config';

/**
 * The newest post, one band wide, directly under the hero.
 *
 * It stands where the park shortcut row used to: the first thing under the fold,
 * which is the only place on this page that reaches a reader who has not decided
 * to scroll yet. The blog's own chapter further down keeps the lead card and the
 * four rows — this is a pointer, not a second copy of it, so it carries the ONE
 * newest post and nothing else.
 *
 * **No `<Suspense>`, and that is the point.** `listPostsByRecency` reads the
 * generated manifest synchronously, so there is no async work to defer and a
 * boundary here would drop the band out of the first HTML and put it back a
 * moment later — 88 px of shift on the highest-traffic page in the app, for
 * nothing. Synchronous data belongs inline, at full height.
 *
 * It renders nothing at all where the locale publishes no posts, which is the
 * same condition the blog routes 404 under; the band is the last child of the
 * hero's own section stack, so an absent one shifts nothing.
 */
export async function BlogTeaserBand({ locale }: { locale: Locale }) {
  const [t, tBlog] = await Promise.all([
    getTranslations('homeStory.blogTeaser'),
    getTranslations('blog'),
  ]);

  // Five: the lead plus four in the panel. More than that and the floating panel
  // is taller than the viewport it drops into on a laptop.
  const posts = listPostsByRecency(locale).slice(0, 5);
  const post = posts[0];
  if (!post) return null;
  const rest = posts.slice(1);

  const { frontmatter } = post;
  const cover = versionedPath(frontmatter.coverImage?.src);

  return (
    // `relative z-40`: the panel drops out of this band ONTO the chapters after
    // it, and those paint later. Being positioned is not enough — the steps
    // chapter carries `z-30` of its own (its search dropdown needs it), so at
    // z-20 this band's panel sat underneath the chapter's headline and the page
    // read straight through it. Above that, below the header's z-50.
    <section className="border-border bg-muted/30 relative z-40 border-y">
      <BlogTeaserReveal
        panel={
          rest.length > 0 ? (
            <div className="grid gap-1 sm:grid-cols-2">
              {rest.map((p) => (
                <BlogPostCard key={p.translationKey} post={p} variant="compact" />
              ))}
            </div>
          ) : null
        }
      >
        <div className="container mx-auto flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5">
          <span className="text-muted-foreground inline-flex shrink-0 items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
            <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
            {t('label')}
          </span>

          <Link
            href={`/blog/${post.slug}` as '/'}
            prefetch={false}
            className="group flex min-w-0 flex-1 items-center gap-3"
          >
            {cover && (
              // Fixed box rather than an intrinsic one: the covers are a mix of
              // 16:9 crops and portraits, and a row whose height follows the image
              // would change height with whichever post is newest.
              <span className="border-border relative hidden h-11 w-16 shrink-0 overflow-hidden rounded-lg border sm:block">
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  style={{ objectPosition: objectPositionForSrc(frontmatter.coverImage?.src) }}
                />
              </span>
            )}
            <span className="min-w-0">
              <span className="group-hover:text-primary block truncate text-[13px] font-semibold transition-colors">
                {frontmatter.title}
              </span>
              <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                {tBlog('readingTime', { minutes: post.readingTimeMinutes })}
              </span>
            </span>
          </Link>

          <Link
            href="/blog"
            prefetch={false}
            className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {tBlog('home.viewAll')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </BlogTeaserReveal>
    </section>
  );
}
