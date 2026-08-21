'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BlogMenu } from '@/lib/navigation/blog-menu';

/**
 * Two columns: the category hubs, and what was published last. Both server-rendered — no fetch,
 * no loading state, because the blog manifest is a build-time artifact and this is eight links.
 *
 * Why there is no tag column: see `lib/navigation/blog-menu.ts`. 31 tags over 7 posts is a set of
 * near-duplicates, and a sitewide template is the last place they belong.
 */
export function BlogMenuPanel({ categories, recent }: BlogMenu) {
  /*
   * `navigation`, not `blog`, for the "Kategorien" heading — and the difference is 3 KB on every
   * page of the site.
   *
   * The layout's chrome namespaces are derived from the import graph, so one `useTranslations('blog')`
   * in a header component pulled the whole `blog` namespace into the set that every page
   * serializes: 6066 B of chrome JSON became 9047 B, times six locales, for a single label. The
   * word lives in `navigation` now, which the header already ships.
   */
  const t = useTranslations('navigation');

  return (
    <div className="flex gap-4">
      <div className="border-border/50 w-52 shrink-0 border-r pr-3">
        <div className="text-muted-foreground/70 px-2 pb-1.5 text-[11px] font-semibold tracking-wide uppercase">
          {t('categories')}
        </div>
        <ul className="space-y-0.5">
          {categories.map((category) => (
            <li key={category.path}>
              <Link
                href={`/blog/category/${category.path}`}
                prefetch={false}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                <span className="truncate">{category.label}</span>
                <span className="text-muted-foreground/70 text-xs tabular-nums">
                  {category.postCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-64 shrink-0">
        <div className="text-muted-foreground/70 px-2 pb-1.5 text-[11px] font-semibold tracking-wide uppercase">
          {t('latestPosts')}
        </div>
        <ul className="space-y-0.5">
          {recent.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                prefetch={false}
                className="text-muted-foreground hover:text-foreground hover:bg-muted block rounded-md px-2 py-1.5 text-sm leading-snug transition-colors"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
