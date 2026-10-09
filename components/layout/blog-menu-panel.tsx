'use client';

import { memo, useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { BlogCoverFallback, slugFromPostPath } from '@/components/blog/blog-cover-fallback';
import type { BlogMenu, BlogMenuPost, BlogMenuSearchEntry } from '@/lib/navigation/blog-menu';
import { isBlogMenuQuery, searchBlogMenu } from '@/lib/navigation/blog-menu-search';
import { categoryPath } from '@/lib/blog/paths';

/**
 * A post as a row of the panel, the same for the newest posts and for search results: a small
 * cover, the category, the title, one line of teaser, and the two facts that decide a click, how
 * old the post is and how long it takes.
 */
function MenuPostRow({ post, meta }: { post: BlogMenuPost; meta: string }) {
  return (
    <Link
      href={post.path}
      prefetch={false}
      className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      {/* 16:10 at 8 rem: the row holds four lines of text (category, title, teaser, date), and a
          picture shorter than its text falls out of the row. */}
      <span className="bg-muted relative block aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg">
        {post.image ? (
          <Image
            src={post.image}
            alt=""
            fill
            sizes="128px"
            style={post.imagePosition ? { objectPosition: post.imagePosition } : undefined}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <BlogCoverFallback
            slug={slugFromPostPath(post.path)}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        {/* The opener's look: above the title, small, uppercase, in the accent, so one band does
            not show the same field in two tones. */}
        {post.category && (
          <span className="text-primary mb-0.5 block text-[10px] font-semibold tracking-wide uppercase">
            {post.category}
          </span>
        )}
        <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium text-pretty transition-colors">
          {post.title}
        </span>
        {post.excerpt && (
          <span className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{post.excerpt}</span>
        )}
        <span className="text-muted-foreground/80 mt-1 block text-[11px]">{meta}</span>
      </span>
    </Link>
  );
}

/**
 * The blog menu: the newest article as the opener, the rest as rows with a small cover, date,
 * reading time and teaser, and the categories as a pill row along the bottom. One heading over both
 * columns, a `MenuSectionHeading` linking to `/blog`, with a search field on its right that swaps
 * both columns for the matching articles. The teaser is cut on the server (`trimExcerpt`), because
 * this text ships in the chrome of every page and a CSS clamp would not stop the bytes; for the
 * same reason the search reads its list from `/api/nav/articles/[locale]`, fetched when the field
 * is first pointed at or focused. Articles only; news has its own panel. Memoised for the same
 * reason as `ParksMenuPanel`.
 */
export const BlogMenuPanel = memo(function BlogMenuPanel({ categories, recent }: BlogMenu) {
  /*
   * `navigation`, not `blog`: one `useTranslations('blog')` in a header component pulls the whole
   * namespace into the chrome every page serializes.
   */
  const t = useTranslations('navigation');
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const [lead, ...rest] = recent;

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' });
  // A post that got new content sorts by that day, so the row says it was updated rather than
  // passing the day off as its publication date.
  const dayOf = (post: BlogMenuPost) =>
    post.updated ? t('updatedOn', { date: dateOf(post.date) }) : dateOf(post.date);
  const metaOf = (post: BlogMenuPost) =>
    `${dayOf(post)} · ${t('readingTime', { minutes: post.readingTimeMinutes })}`;

  const [query, setQuery] = useState('');
  // The field stays urgent; the columns it swaps read a deferred copy, see
  // docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
  const deferredQuery = useDeferredValue(query);
  const [armed, setArmed] = useState(false);
  const { data: index, isError } = useQuery({
    queryKey: ['blog-menu-search', locale],
    queryFn: async () => {
      const response = await fetch(`/api/nav/articles/${locale}`);
      if (!response.ok) throw new Error(`nav articles ${response.status}`);
      return ((await response.json()) as { posts: BlogMenuSearchEntry[] }).posts;
    },
    enabled: armed,
    // Static per deployment, so one request per tab.
    staleTime: Infinity,
  });
  const searching = isBlogMenuQuery(deferredQuery);
  const result = useMemo(
    () => (searching && index ? searchBlogMenu(index, deferredQuery) : null),
    [searching, index, deferredQuery]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && index) {
      const first = searchBlogMenu(index, query).matches[0];
      if (!first) return;
      event.preventDefault();
      router.push(first.path);
    }
    // The first Escape empties the field and leaves the band open; `useMenuTrigger` skips an
    // Escape that was used. The second one closes the band as anywhere else.
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    }
  };

  const searchField = (
    <div
      className="relative w-56 shrink-0 @min-[1280px]:w-64"
      onPointerEnter={() => setArmed(true)}
    >
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setArmed(true)}
        onKeyDown={onKeyDown}
        placeholder={t('searchArticles')}
        aria-label={t('searchArticles')}
        autoComplete="off"
        enterKeyHint="go"
        className="h-7 rounded-full pr-3 pl-8 text-xs shadow-none md:text-xs"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div data-menu-stagger>
          <MenuSectionHeading
            label={result ? t('searchResults', { count: result.total }) : t('latestPosts')}
            href="/blog"
            aside={searchField}
          />
        </div>
        <span className="sr-only" aria-live="polite">
          {result ? t('searchResults', { count: result.total }) : ''}
        </span>

        {/* Until the list has arrived the newest posts stay, rather than a blank band. */}
        {result && result.total > 0 ? (
          // Down the first column, then the second: the best match leads and the second-best
          // sits under it, where the eye goes next.
          <ul className="grid gap-x-8 gap-y-1 lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-4">
            {result.matches.map((post) => (
              <li key={post.path}>
                <MenuPostRow post={post} meta={metaOf(post)} />
              </li>
            ))}
          </ul>
        ) : result || (searching && isError) ? (
          <p className="text-muted-foreground py-6 text-sm">
            {result ? t('searchEmpty', { query: deferredQuery.trim() }) : t('searchFailed')}
          </p>
        ) : (
          <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {lead && (
              <div data-menu-stagger>
                <Link
                  href={lead.path}
                  prefetch={false}
                  className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="bg-muted relative mb-3 block aspect-[16/9] overflow-hidden rounded-xl">
                    {lead.image ? (
                      <Image
                        src={lead.image}
                        alt=""
                        width={640}
                        height={360}
                        sizes="(min-width: 1024px) 480px, 100vw"
                        style={
                          lead.imagePosition ? { objectPosition: lead.imagePosition } : undefined
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <BlogCoverFallback
                        slug={slugFromPostPath(lead.path)}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </span>
                  {lead.category && (
                    <span className="text-primary mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                      {lead.category}
                    </span>
                  )}
                  <span className="text-foreground group-hover:text-primary block text-lg leading-snug font-bold text-pretty transition-colors">
                    {lead.title}
                  </span>
                  {lead.excerpt && (
                    <span className="text-muted-foreground mt-1.5 line-clamp-4 text-[13px] leading-relaxed">
                      {lead.excerpt}
                    </span>
                  )}
                  <span className="text-muted-foreground/80 mt-2 block text-xs">
                    {metaOf(lead)}
                  </span>
                </Link>
              </div>
            )}

            {rest.length > 0 && (
              <div data-menu-stagger>
                <ul className="flex flex-col gap-1">
                  {rest.map((post) => (
                    <li key={post.path}>
                      <MenuPostRow post={post} meta={metaOf(post)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categories as a pill row, not a column: three links do not earn 13 rem of the band. */}
      {categories.length > 0 && (
        <div
          data-menu-stagger
          className="border-border/60 flex flex-wrap items-center gap-2 border-t pt-4"
        >
          <span className="text-muted-foreground mr-1 text-[11px] font-semibold tracking-wide uppercase">
            {t('categories')}
          </span>
          {categories.map((category) => (
            <Link
              key={category.path}
              href={categoryPath(category.path)}
              prefetch={false}
              className="border-border/70 text-muted-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            >
              {category.label}
              <span className="text-muted-foreground/60 tabular-nums">{category.postCount}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
