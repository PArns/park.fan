'use client';

import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BlogMenu } from '@/lib/navigation/blog-menu';

/**
 * The blog menu: one post given room, the rest as rows, the categories as a footer.
 *
 * It used to be a category column beside four equal thumbnails, which treated a 32-minute measured
 * guide and a 5-minute note as the same object and gave each a 145 px picture and a three-line
 * title. Four equal cards make the reader do all the choosing; an opener makes one of the choices
 * for them, and the covers finally get a size worth looking at.
 *
 * The split is the same one the blog itself uses: the newest post is the opener, everything after
 * it is a row with a small cover, its date and its reading time — the two facts that actually
 * decide whether somebody clicks — plus a line of the post's own teaser.
 *
 * The teaser is there for a reader first and a crawler second, and it is cut on the SERVER
 * (`trimExcerpt`, 170 characters): this text sits in the chrome of every page on the site, and a
 * CSS line clamp would hide the bytes without stopping them from shipping.
 *
 * Categories move to a pill row along the bottom. As a left column they cost 13 rem of the band
 * for three links; as pills they cost one line and read as what they are, a filter rather than a
 * section of their own.
 *
 * Everything here is server-rendered from the build-time blog manifest — no fetch, no loading
 * state, and the covers are already 16:9 crops. That is the difference from the parks menu's rail,
 * which is a curated four because only 14 of 212 parks have a picture at all; here it is 7 of 7.
 */
export function BlogMenuPanel({ categories, recent }: BlogMenu) {
  /*
   * `navigation`, not `blog`, for the headings — and the difference is 3 KB on every page.
   *
   * The layout's chrome namespaces are derived from the import graph, so one
   * `useTranslations('blog')` in a header component pulled the whole `blog` namespace into the set
   * every page serializes: 6066 B of chrome JSON became 9047 B, times six locales, for one label.
   */
  const t = useTranslations('navigation');
  const format = useFormatter();
  const [lead, ...rest] = recent;

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* The opener. */}
        {lead && (
          <div data-menu-stagger>
            <div className="text-foreground border-border/60 mb-2.5 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
              {t('latestPosts')}
            </div>
            <Link
              href={`/blog/${lead.slug}`}
              prefetch={false}
              className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              {lead.image && (
                <span className="bg-muted relative mb-3 block aspect-[16/9] overflow-hidden rounded-xl">
                  <Image
                    src={lead.image}
                    alt=""
                    width={640}
                    height={360}
                    sizes="(min-width: 1024px) 480px, 100vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
              )}
              {lead.category && (
                <span className="text-primary mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                  {lead.category}
                </span>
              )}
              <span className="text-foreground group-hover:text-primary block text-lg leading-snug font-bold text-pretty transition-colors">
                {lead.title}
              </span>
              {lead.excerpt && (
                <span className="text-muted-foreground mt-1.5 line-clamp-4 block text-[13px] leading-relaxed">
                  {lead.excerpt}
                </span>
              )}
              <span className="text-muted-foreground/80 mt-2 block text-xs">
                {dateOf(lead.date)} · {t('readingTime', { minutes: lead.readingTimeMinutes })}
              </span>
            </Link>
          </div>
        )}

        {/* The rest, as rows. A row carries the two facts that decide a click — how old it is and
            how long it takes — where a fourth equal card carried neither at a legible size. */}
        {rest.length > 0 && (
          <div data-menu-stagger>
            <div className="text-foreground border-border/60 mb-2.5 flex items-center justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
              <span>{t('blog')}</span>
              <Link
                href="/blog"
                prefetch={false}
                className="text-primary hover:text-primary/80 text-[11px] font-medium normal-case transition-colors"
              >
                {t('allPosts')}
              </Link>
            </div>
            <ul className="flex flex-col gap-1">
              {rest.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    prefetch={false}
                    className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
                  >
                    {/* 16:10 auf 7 rem: die Zeile trägt drei Zeilen Text
                        (Titel, Teaser, Datum) und ist damit rund 70 px hoch. Auf 6 rem und 16:10
                        war das Bild 60 px und fiel unten aus der Zeile; auf 4:3 waren es 84 und es
                        stand über. 112×70 trifft die Texthöhe. */}
                    {post.image && (
                      <span className="bg-muted relative block aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={post.image}
                          alt=""
                          fill
                          sizes="112px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground group-hover:text-primary line-clamp-2 block text-sm leading-snug font-medium text-pretty transition-colors">
                        {post.title}
                      </span>
                      {post.excerpt && (
                        <span className="text-muted-foreground mt-0.5 line-clamp-1 block text-xs">
                          {post.excerpt}
                        </span>
                      )}
                      <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                        {dateOf(post.date)} ·{' '}
                        {t('readingTime', { minutes: post.readingTimeMinutes })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
              href={`/blog/category/${category.path}`}
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
}
