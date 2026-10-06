'use client';

import { memo } from 'react';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { BlogCoverFallback, slugFromPostPath } from '@/components/blog/blog-cover-fallback';
import type { BlogMenu } from '@/lib/navigation/blog-menu';
import { categoryPath } from '@/lib/blog/paths';

/**
 * The blog menu: the newest article as the opener, the rest as rows with a small cover, date,
 * reading time and teaser, and the categories as a pill row along the bottom. One heading over both
 * columns, a `MenuSectionHeading` linking to `/blog`. The teaser is cut on the server
 * (`trimExcerpt`), because this text ships in the chrome of every page and a CSS clamp would not
 * stop the bytes. Articles only; news has its own panel. Memoised for the same reason as
 * `ParksMenuPanel`.
 */
export const BlogMenuPanel = memo(function BlogMenuPanel({ categories, recent }: BlogMenu) {
  /*
   * `navigation`, not `blog`: one `useTranslations('blog')` in a header component pulls the whole
   * namespace into the chrome every page serializes.
   */
  const t = useTranslations('navigation');
  const format = useFormatter();
  const [lead, ...rest] = recent;

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' });
  // A post that got new content sorts by that day, so the row says it was updated rather than
  // passing the day off as its publication date.
  const dayOf = (post: BlogMenu['recent'][number]) =>
    post.updated ? t('updatedOn', { date: dateOf(post.date) }) : dateOf(post.date);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div data-menu-stagger>
          <MenuSectionHeading label={t('latestPosts')} href="/blog" />
        </div>

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
                  {dayOf(lead)} · {t('readingTime', { minutes: lead.readingTimeMinutes })}
                </span>
              </Link>
            </div>
          )}

          {/* The rest, as rows carrying the two facts that decide a click: how old a post is and
              how long it takes. */}
          {rest.length > 0 && (
            <div data-menu-stagger>
              <ul className="flex flex-col gap-1">
                {rest.map((post) => (
                  <li key={post.path}>
                    <Link
                      href={post.path}
                      prefetch={false}
                      className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
                    >
                      {/* 16:10 at 8 rem: the row holds four lines of text (category, title,
                          teaser, date), and a picture shorter than its text falls out of the
                          row. */}
                      <span className="bg-muted relative block aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg">
                        {post.image ? (
                          <Image
                            src={post.image}
                            alt=""
                            fill
                            sizes="128px"
                            style={
                              post.imagePosition
                                ? { objectPosition: post.imagePosition }
                                : undefined
                            }
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
                        {/* The opener's look: above the title, small, uppercase, in the accent, so
                            one band does not show the same field in two tones. */}
                        {post.category && (
                          <span className="text-primary mb-0.5 block text-[10px] font-semibold tracking-wide uppercase">
                            {post.category}
                          </span>
                        )}
                        <span className="text-foreground group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium text-pretty transition-colors">
                          {post.title}
                        </span>
                        {post.excerpt && (
                          <span className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                            {post.excerpt}
                          </span>
                        )}
                        <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                          {dayOf(post)} · {t('readingTime', { minutes: post.readingTimeMinutes })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
