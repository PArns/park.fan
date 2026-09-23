'use client';

import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { NewsList } from '@/components/blog/news-list';
import type { BlogMenu } from '@/lib/navigation/blog-menu';
import { categoryPath } from '@/lib/blog/paths';

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
 * **One heading over both columns, not one per column.** It used to carry two — "Neueste Beiträge"
 * over the opener and "Blog" over the rows — for a single list of posts split across two shapes,
 * and the second of them repeated the word that now labels the bar entry this panel hangs from. The
 * heading is `MenuSectionHeading`, the same rule the parks and "more" bands draw, and it is the
 * link to `/blog` (the "heading IS the link" rule those two already follow), so the panel keeps its
 * way to the index without a second copy of the word beside it.
 *
 * Categories move to a pill row along the bottom. As a left column they cost 13 rem of the band
 * for three links; as pills they cost one line and read as what they are, a filter rather than a
 * section of their own.
 *
 * News sits in a strip of its own between the articles and the categories: small cover, age and
 * title (`NewsList`), three in a line. There will be more news than articles, and a list of
 * the newest posts would soon be nothing but news — the articles keep the opener and the rows,
 * whatever gets published.
 *
 * Everything here is server-rendered from the build-time blog manifest — no fetch, no loading
 * state, and the covers are already 16:9 crops. That is the difference from the parks menu's rail,
 * which is a curated four because only 14 of 212 parks have a picture at all; here it is 7 of 7.
 */
export function BlogMenuPanel({ categories, recent, news, newsLabel, newsPath }: BlogMenu) {
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
      <div>
        {/* The one heading, spanning both columns — see the docblock. */}
        <div data-menu-stagger>
          <MenuSectionHeading label={t('latestPosts')} href="/blog" />
        </div>

        <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* The opener. */}
          {lead && (
            <div data-menu-stagger>
              <Link
                href={lead.path}
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
                      style={
                        lead.imagePosition ? { objectPosition: lead.imagePosition } : undefined
                      }
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
              <ul className="flex flex-col gap-1">
                {rest.map((post) => (
                  <li key={post.path}>
                    <Link
                      href={post.path}
                      prefetch={false}
                      className="group hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors"
                    >
                      {/* 16:10 auf 8 rem: die Zeile trägt vier Zeilen Text (Kategorie, Titel,
                          Teaser, Datum). Auf 7 rem waren es 112×70 und drei Zeilen — die Kategorie
                          ist die vierte, und ein Bild, das kürzer ist als sein Text, fällt unten
                          aus der Zeile. 128×80 trifft die neue Texthöhe. */}
                      {post.image && (
                        <span className="bg-muted relative block aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg">
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
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        {/* Dieselbe Optik wie der Opener links daneben: über dem Titel, klein,
                            versal, in der Akzentfarbe. Der Bezug ist bewusst der Opener und
                            nicht `BlogPostRow` — die Zeile dort setzt die Kategorie in
                            `text-muted-foreground`, die Karte in `var(--pk-text-3)`. Beide
                            stehen aber auf einer Seite, und diese zwei stehen in einem Band
                            nebeneinander: zwei Tonwerte für dasselbe Feld in derselben Fläche
                            liest man zweimal. Sie fehlte hier als einziger Stelle der App, die
                            Beiträge auflistet. */}
                        {post.category && (
                          <span className="text-primary mb-0.5 block text-[10px] font-semibold tracking-wide uppercase">
                            {post.category}
                          </span>
                        )}
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
      </div>

      {/* News: its own strip, a size smaller than the articles — see the docblock. */}
      {news.length > 0 && (
        <div data-menu-stagger>
          <MenuSectionHeading label={newsLabel} href={newsPath} />
          <NewsList items={news} className="sm:grid-cols-3" />
        </div>
      )}

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
}
