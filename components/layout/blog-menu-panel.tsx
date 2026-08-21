'use client';

import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BlogMenu } from '@/lib/navigation/blog-menu';

/**
 * The category hubs on the left, what was published last across the rest of the band — with the
 * posts' own cover images, which every post has.
 *
 * Everything here is server-rendered: the blog manifest is a build-time artifact, so there is no
 * fetch and no loading state, and the covers are already 16:9 crops. That is the difference from
 * the parks menu's photo rail, which had to be a curated four because only 14 of 212 parks have a
 * picture at all — here the coverage is 7 of 7.
 *
 * Why there is no tag column: see `lib/navigation/blog-menu.ts`. 31 tags over 7 posts is a set of
 * near-duplicates, and a sitewide template is the last place they belong. The width that frees is
 * what lets the four newest posts sit side by side with their titles readable.
 */
export function BlogMenuPanel({ categories, recent }: BlogMenu) {
  /*
   * `navigation`, not `blog`, for the headings — and the difference is 3 KB on every page of the
   * site.
   *
   * The layout's chrome namespaces are derived from the import graph, so one
   * `useTranslations('blog')` in a header component pulled the whole `blog` namespace into the set
   * that every page serializes: 6066 B of chrome JSON became 9047 B, times six locales, for a
   * single label.
   */
  const t = useTranslations('navigation');
  const format = useFormatter();

  return (
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-[minmax(0,13rem)_1fr]">
      {/* Two stagger steps, same as the parks band: the shared `NavMenu` lifts anything marked
          `data-menu-stagger` when the panel opens, so both menus settle in the same way. */}
      <div data-menu-stagger>
        <div className="text-foreground border-border/60 mb-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
          {t('categories')}
        </div>
        <ul className="space-y-px">
          {categories.map((category) => (
            <li key={category.path}>
              <Link
                href={`/blog/category/${category.path}`}
                prefetch={false}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                <span className="truncate">{category.label}</span>
                <span className="text-muted-foreground/70 text-xs tabular-nums">
                  {category.postCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/blog"
          prefetch={false}
          className="text-primary hover:text-primary/80 border-border/60 mt-3 block border-t pt-3 text-xs font-medium transition-colors"
        >
          {t('allPosts')}
        </Link>
      </div>

      <div data-menu-stagger>
        <div className="text-foreground border-border/60 mb-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
          {t('latestPosts')}
        </div>
        <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                prefetch={false}
                className="group focus-visible:ring-ring block rounded-lg focus-visible:ring-2 focus-visible:outline-none"
              >
                {post.image && (
                  <span className="mb-2 block aspect-[16/9] overflow-hidden rounded-lg">
                    <Image
                      src={post.image}
                      alt=""
                      width={320}
                      height={180}
                      sizes="240px"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                )}
                <span className="text-muted-foreground group-hover:text-foreground line-clamp-3 block text-sm leading-snug font-medium text-pretty transition-colors">
                  {post.title}
                </span>
                <span className="text-muted-foreground/70 mt-1 block text-[11px]">
                  {format.dateTime(new Date(post.date), {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' · '}
                  {t('readingTime', { minutes: post.readingTimeMinutes })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
